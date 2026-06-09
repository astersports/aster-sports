// Drains queued recipients for a comms_messages row and dispatches
// via Resend. Per-recipient status updates so a single bounce doesn't
// fail the whole send.
//
// Wave 3: per-recipient body capture (body_html_rendered, body_plain_rendered,
// subject_rendered) for kinds like weekly_digest where each family gets a
// personalized body. Falls back to message-level body when per-recipient
// columns are null. Chunks into batches of 100 (Resend's batch limit) so
// digests with >100 recipients dispatch in multiple calls.
//
// Wave 3.5 §B5.1: pilot-mode defense in depth. Before dispatch, fetch
// organization_settings.pilot_mode_enabled. When TRUE, every queued
// recipient with a non-null guardian_id MUST be flagged is_pilot_family.
// Admin BCC rows have guardian_id=null and are always allowed. Any
// non-pilot guardian in the queue aborts the entire dispatch with 403.
//
// Wave 3.5 §B5.8 (v8): reply_to corrected from personal Gmail to
// info@legacyhoopers.org per spec.
//
// Wave 3.6 §D6 (v9): reply_to is now read from
// organization_settings.reply_to_email (per-org configurable for
// multi-tenant). Falls back to REPLY_TO_FALLBACK when row/column null.
//
// Wave 4.1c (v15): RFC 8058 List-Unsubscribe + List-Unsubscribe-Post
// headers per recipient. Unlocks Gmail/Yahoo bulk-sender one-click
// requirement. Token minted via public.mint_unsubscribe_token (HMAC,
// service role) — same URL the body footer uses, so MUAs that respect
// the header and clients that use the body link converge on the same
// guardian_email_preferences upsert. Admin BCC rows (guardian_id=null)
// receive no header — they're QA copies, not subscriber deliveries.
//
// Caller must be admin or coach in the message's org_id.
// Body: { message_id: uuid, dry_run?: boolean }
// Returns: { ok: boolean, sent: int, failed: int, errors: string[] }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4";
import { buildEmailRow, dispatchPushFanout, mintUnsubscribeUrl } from "./_lib.ts";
import { alreadySent, classifyBatchResult, decidePilotGate, decideSuppression } from "./_dispatch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Platform send-from address (rebrand 2026-06-02; was briefings@legacyhoopers.org).
// astersports.app is verified in Resend. from_name still shows the org (below) and
// replies route to the org's reply-to, so families see "Legacy Hoopers" + reply
// to the org — only the envelope sender is the platform domain.
const FROM_EMAIL = "noreply@astersports.app";
// Wave 4.3-H: from_name reads from organization_settings.from_name per kind
// (no per-kind branching needed; Frank locked "Legacy Hoopers" for all sends).
// Fallback used only if org_settings row is missing or column is NULL.
const FROM_NAME_FALLBACK = "Legacy Hoopers";
const REPLY_TO_FALLBACK = "support@astersports.app";
const RESEND_BATCH_LIMIT = 100;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "No auth header" }, 401);

  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: authErr } = await supabaseAuth.auth.getUser();
  if (authErr || !user) return json({ error: "Invalid auth" }, 401);

  let body: { message_id?: string; dry_run?: boolean };
  try { body = await req.json(); }
  catch { return json({ error: "Invalid JSON body" }, 400); }
  if (!body.message_id) return json({ error: "message_id required" }, 400);

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: message, error: msgErr } = await sb
    .from("comms_messages")
    .select("id, org_id, subject, headline, body_html, body_plain, sent_at")
    .eq("id", body.message_id).single();
  if (msgErr || !message) return json({ error: "Message not found" }, 404);
  if (alreadySent(message)) return json({ error: "Already sent" }, 409);

  const { data: roles, error: rolesErr } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", message.org_id)
    .in("role", ["admin", "coach"]);
  if (rolesErr) return json({ error: `Role lookup failed: ${rolesErr.message}` }, 500);
  if (!roles || roles.length === 0) return json({ error: "Not authorized" }, 403);

  // The delivery_status='queued' filter is the re-drive idempotency guard
  // (skips already-'sent' rows). NOTE (G8 review): 'queued' is AMBIGUOUS for a
  // RECOVERY re-drive — a recipient emailed-but-crashed-before-writeback still
  // reads 'queued'. A blind re-drive double-sends them. G5 must auto-re-drive
  // only safe-'failed' rows + surface 'queued' for review until the window is
  // closed (sending-claim state or provider idempotency keys).
  const { data: recipients, error: recErr } = await sb
    .from("comms_message_recipients")
    .select("id, email_at_send, guardian_id, body_html_rendered, body_plain_rendered, subject_rendered")
    .eq("message_id", body.message_id)
    .eq("delivery_status", "queued");
  if (recErr) return json({ error: recErr.message }, 500);
  if (!recipients || recipients.length === 0) return json({ error: "No queued recipients" }, 400);

  // Wave 3.A #19 P1 closure: filter out guardians who unsubscribed via a
  // prior briefing's One-Click List-Unsubscribe header or footer link.
  // guardian_email_preferences.unsubscribed_at is the canonical opt-out
  // signal — written by unsubscribe-handler + resend-webhook-receiver,
  // never previously read on the send path. Honors CAN-SPAM. Admin BCC
  // rows (guardian_id NULL) bypass — they're the operator's audit copy.
  let suppressed = 0;
  {
    const recipientGuardianIds = recipients.map((r) => r.guardian_id).filter(Boolean) as string[];
    if (recipientGuardianIds.length) {
      const { data: prefs, error: prefsErr } = await sb
        .from("guardian_email_preferences")
        .select("guardian_id, unsubscribed_at")
        .in("guardian_id", recipientGuardianIds);
      if (prefsErr) return json({ error: `guardian_email_preferences lookup: ${prefsErr.message}` }, 500);
      const { suppressedIds, stillQueued } = decideSuppression(recipients, prefs ?? []);
      if (suppressedIds.length) {
        // Flip suppressed rows' delivery_status to 'unsubscribed' so the
        // audit trail records the skip (uses an existing allowed value
        // from the delivery_status CHECK constraint — no schema change).
        await sb.from("comms_message_recipients")
          .update({ delivery_status: "unsubscribed" })
          .in("id", suppressedIds);
        suppressed = suppressedIds.length;
        // Drop suppressed rows from the in-memory list so the send loop skips them.
        if (stillQueued.length === 0) {
          // Everyone unsubscribed — there is nothing to send, but the message
          // must still be FINALIZED (status='sent', sent_at) so it isn't
          // stranded at 'draft'/'queued' forever. Leaving it unfinalized made
          // the client report success while the row looked permanently unsent
          // and could not be re-driven (0 'queued' rows → 400 on re-invoke).
          const { error: finErr } = await sb.from("comms_messages")
            .update({ status: "sent", sent_at: new Date().toISOString(), sent_by: user.id, recipient_count: 0, delivery_method: "resend_api" })
            .eq("id", body.message_id);
          return json({ ok: !finErr, sent: 0, failed: 0, suppressed, errors: finErr ? [`Finalize failed: ${finErr.message}`] : [] });
        }
        recipients.length = 0;
        recipients.push(...stillQueued);
      }
    }
  }

  // Pilot-mode defense in depth + reply-to lookup (Wave 3.5 §B5.1 + 3.6 §D6).
  const { data: orgSettings, error: orgErr } = await sb
    .from("organization_settings")
    .select("pilot_mode_enabled, reply_to_email, from_name")
    .eq("organization_id", message.org_id)
    .maybeSingle();
  if (orgErr) return json({ error: `Org settings lookup failed: ${orgErr.message}` }, 500);
  const pilotMode = orgSettings?.pilot_mode_enabled ?? true;
  const replyTo = orgSettings?.reply_to_email ?? REPLY_TO_FALLBACK;
  const fromName = orgSettings?.from_name ?? FROM_NAME_FALLBACK;
  if (pilotMode) {
    const guardianIds = recipients.map((r) => r.guardian_id).filter(Boolean);
    if (guardianIds.length) {
      // Phase 1 audit P0-2: defense-in-depth — the guardianIds array
      // comes from comms_message_recipients which is already filtered
      // by message_id (and thus by message.org_id), but the guardians
      // query itself didn't enforce org scope. Adding the filter
      // protects against a malformed/crafted guardianIds array slipping
      // through and leaking cross-org guardian email + is_pilot_family.
      const { data: guardians, error: gErr } = await sb
        .from("guardians").select("id, is_pilot_family, email")
        .eq("org_id", message.org_id)
        .in("id", guardianIds);
      if (gErr) return json({ error: `Pilot check failed: ${gErr.message}` }, 500);
      const gate = decidePilotGate(guardians, pilotMode);
      if (gate.abort) {
        return json({
          error: `PILOT MODE: ${gate.nonPilotCount} non-pilot guardians in queue (${gate.nonPilotEmails.join(", ")}). Aborting. Toggle organization_settings.pilot_mode_enabled=FALSE to allow production sends.`,
          non_pilot_count: gate.nonPilotCount, pilot_mode_active: true,
        }, 403);
      }
    }
  }

  if (body.dry_run) return json({ ok: true, dry_run: true, would_send: recipients.length, pilot_mode_active: pilotMode, reply_to: replyTo });

  // Wave 3.A #19 P1 closure: prefer app_secrets.resend_api_key per AP #33.
  // Env fallback kept for the rollout window — remove in a follow-up PR
  // once operator confirms the app_secrets row is populated.
  const { data: keyRow } = await sb.from("app_secrets").select("value").eq("name", "resend_api_key").maybeSingle();
  const resendKey = (keyRow?.value as string | null) ?? Deno.env.get("RESEND_API_KEY");
  if (!resendKey) throw new Error("RESEND_API_KEY missing: not in app_secrets, not in Deno.env");
  const resend = new Resend(resendKey);
  const fromHeader = `${fromName} <${FROM_EMAIL}>`;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const errors: string[] = [];
  let sent = 0;
  let failed = 0;

  for (const group of chunk(recipients, RESEND_BATCH_LIMIT)) {
    const unsubUrls = await Promise.all(group.map((r) => mintUnsubscribeUrl(sb, supabaseUrl, r.guardian_id)));
    const batch = group.map((r, idx) => buildEmailRow(r, message, fromHeader, replyTo, unsubUrls[idx]));
    const { data: batchData, error: batchErr } = await resend.batch.send(batch);
    // Pure decision (mirror: ./_dispatch.ts, tested in sendDispatch.test.js):
    // which rows are sent vs failed for this batch. IO (the status writeback)
    // stays here. Bulk .in() per status — same rows get the same status as the
    // prior per-row writeback, fewer round-trips.
    const c = classifyBatchResult(group, { data: batchData, error: batchErr });
    sent += c.sent;
    failed += c.failed;
    errors.push(...c.errors);
    const ops = [];
    if (c.failedIds.length) {
      ops.push(sb.from("comms_message_recipients")
        .update({ delivery_status: "failed", delivery_method: "resend_api" })
        .in("id", c.failedIds));
    }
    if (c.sentIds.length) {
      ops.push(sb.from("comms_message_recipients")
        .update({ delivery_status: "sent", delivery_method: "resend_api" })
        .in("id", c.sentIds));
    }
    await Promise.all(ops);
  }

  // Finalize the message row. status='sent' is authoritative here (service
  // role) — the client must NOT own this transition. Surface a failed
  // write-back instead of swallowing it (the silent failure left messages
  // stranded at 'queued' despite delivered emails — caught 2026-05-27).
  const { error: finalizeErr } = await sb.from("comms_messages")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      sent_by: user.id,
      recipient_count: recipients.length,
      delivery_method: "resend_api",
    })
    .eq("id", body.message_id);
  if (finalizeErr) errors.push(`Finalize failed: ${finalizeErr.message}`);

  // Wave C: best-effort push fan-out alongside email (secondary channel —
  // never fails the email send). See _lib.ts dispatchPushFanout.
  try {
    await dispatchPushFanout(sb, supabaseUrl, message, recipients, fromName);
  } catch (e) {
    errors.push(`push dispatch (non-fatal): ${(e as Error).message ?? String(e)}`);
  }

  return json({ ok: failed === 0 && !finalizeErr, sent, failed, suppressed, errors, pilot_mode_active: pilotMode, reply_to: replyTo });
});
