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
import { buildEmailRow, mintUnsubscribeUrl } from "./_lib.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FROM_EMAIL = "briefings@legacyhoopers.org";
// Wave 4.3-H: from_name reads from organization_settings.from_name per kind
// (no per-kind branching needed; Frank locked "Legacy Hoopers" for all sends).
// Fallback used only if org_settings row is missing or column is NULL.
const FROM_NAME_FALLBACK = "Legacy Hoopers";
const REPLY_TO_FALLBACK = "info@legacyhoopers.org";
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
    .select("id, org_id, subject, body_html, body_plain, sent_at")
    .eq("id", body.message_id).single();
  if (msgErr || !message) return json({ error: "Message not found" }, 404);
  if (message.sent_at) return json({ error: "Already sent" }, 409);

  const { data: roles, error: rolesErr } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", message.org_id)
    .in("role", ["admin", "coach"]);
  if (rolesErr) return json({ error: `Role lookup failed: ${rolesErr.message}` }, 500);
  if (!roles || roles.length === 0) return json({ error: "Not authorized" }, 403);

  const { data: recipients, error: recErr } = await sb
    .from("comms_message_recipients")
    .select("id, email_at_send, guardian_id, body_html_rendered, body_plain_rendered, subject_rendered")
    .eq("message_id", body.message_id)
    .eq("delivery_status", "queued");
  if (recErr) return json({ error: recErr.message }, 500);
  if (!recipients || recipients.length === 0) return json({ error: "No queued recipients" }, 400);

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
      const nonPilot = (guardians || []).filter((g) => !g.is_pilot_family);
      if (nonPilot.length) {
        const offending = nonPilot.map((g) => g.email).join(", ");
        return json({
          error: `PILOT MODE: ${nonPilot.length} non-pilot guardians in queue (${offending}). Aborting. Toggle organization_settings.pilot_mode_enabled=FALSE to allow production sends.`,
          non_pilot_count: nonPilot.length, pilot_mode_active: true,
        }, 403);
      }
    }
  }

  if (body.dry_run) return json({ ok: true, dry_run: true, would_send: recipients.length, pilot_mode_active: pilotMode, reply_to: replyTo });

  const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
  const fromHeader = `${fromName} <${FROM_EMAIL}>`;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const errors: string[] = [];
  let sent = 0;
  let failed = 0;

  for (const group of chunk(recipients, RESEND_BATCH_LIMIT)) {
    const unsubUrls = await Promise.all(group.map((r) => mintUnsubscribeUrl(sb, supabaseUrl, r.guardian_id)));
    const batch = group.map((r, idx) => buildEmailRow(r, message, fromHeader, replyTo, unsubUrls[idx]));
    const { data: batchData, error: batchErr } = await resend.batch.send(batch);
    if (batchErr) {
      failed += group.length;
      errors.push(batchErr.message ?? "Batch rejected");
      await sb.from("comms_message_recipients")
        .update({ delivery_status: "failed", delivery_method: "resend_api" })
        .in("id", group.map((r) => r.id));
      continue;
    }
    const updates = (batchData?.data ?? []).map((res: any, i: number) => {
      const recipientId = group[i].id;
      if (res?.id) {
        sent++;
        return sb.from("comms_message_recipients")
          .update({ delivery_status: "sent", delivery_method: "resend_api" })
          .eq("id", recipientId);
      }
      failed++;
      errors.push(`${group[i].email_at_send}: ${res?.error ?? "unknown"}`);
      return sb.from("comms_message_recipients")
        .update({ delivery_status: "failed", delivery_method: "resend_api" })
        .eq("id", recipientId);
    });
    await Promise.all(updates);
  }

  await sb.from("comms_messages")
    .update({
      sent_at: new Date().toISOString(),
      sent_by: user.id,
      recipient_count: recipients.length,
      delivery_method: "resend_api",
    })
    .eq("id", body.message_id);

  return json({ ok: failed === 0, sent, failed, errors, pilot_mode_active: pilotMode, reply_to: replyTo });
});
