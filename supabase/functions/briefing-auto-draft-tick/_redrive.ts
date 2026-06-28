// G5 OPT-B re-drive sweep. Re-drives ONLY provably-safe delivery_status='failed'
// recipients (batch-rejection, no email sent) on non-archived dispatched
// messages, capped at redrive_count < 3 — NEVER the ambiguous crash-window class
// (human-review only, PR 1a). Sends DIRECTLY via Resend (NOT send-tournament-
// message, which 409s a finalized message). The pilot + suppression gate is
// re-applied at re-drive time via the SHARED pure kernels (./_dispatch.ts). IO
// stays here. Global (all orgs) — cron uses service role. buildEmailRow +
// mintUnsubscribeUrl are LOCAL copies (Edge bundles the fn dir only, AP#30).

import { Resend } from "https://esm.sh/resend@4";
import { classifyBatchResult, decidePilotGate, decideSuppression } from "./_dispatch.ts";

const FROM_EMAIL = "noreply@astersports.app";
const FROM_NAME_FALLBACK = "Aster AAU";
const REPLY_TO_FALLBACK = "support@astersports.app";
const BATCH_LIMIT = 100;

async function mintUnsubscribeUrl(sb: any, supabaseUrl: string, guardianId: string | null) {
  if (!guardianId) return null;
  const { data: token, error } = await sb.rpc("mint_unsubscribe_token", { p_guardian_id: guardianId });
  if (error || !token) return null;
  return `${supabaseUrl}/functions/v1/unsubscribe-handler?t=${encodeURIComponent(token)}`;
}

function buildEmailRow(r: any, msg: any, fromHeader: string, replyTo: string, unsubscribeUrl: string | null) {
  const headers = unsubscribeUrl ? {
    "List-Unsubscribe": `<${unsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  } : undefined;
  return {
    from: fromHeader,
    to: [r.email_at_send],
    subject: r.subject_rendered ?? msg.subject,
    html: r.body_html_rendered ?? msg.body_html,
    text: r.body_plain_rendered ?? msg.body_plain,
    reply_to: replyTo,
    ...(r.id ? { tags: [{ name: "recipient_id", value: String(r.id) }] } : {}),
    ...(headers ? { headers } : {}),
  };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Apply the pilot + suppression gate to one message's failed group, then send.
// Returns { redriven, refailed, escalated } for the group (or a skip marker).
async function redriveGroup(sb: any, resend: any, supabaseUrl: string, msg: any, group: any[]) {
  // Suppression: drop guardians who unsubscribed since the original send.
  // Fail-closed (AP#36): a prefs lookup error skips this group (re-tried next sweep).
  const gids = group.map((r) => r.guardian_id).filter(Boolean);
  let prefs: any[] = [];
  if (gids.length) {
    const { data, error } = await sb.from("guardian_email_preferences")
      .select("guardian_id, unsubscribed_at").in("guardian_id", gids);
    if (error) return { redriven: 0, refailed: 0, escalated: 0, skipped: "prefs_lookup", message_id: msg.id };
    prefs = data ?? [];
  }
  const { suppressedIds, stillQueued } = decideSuppression(group, prefs);
  if (suppressedIds.length) {
    await sb.from("comms_message_recipients").update({ delivery_status: "unsubscribed" }).in("id", suppressedIds);
  }
  if (!stillQueued.length) return { redriven: 0, refailed: 0, escalated: 0 };

  // Pilot gate (fail-closed, ?? true matches index.ts:166; AP#36: an org_settings
  // lookup error -> pilotMode true -> the gate runs).
  const { data: os, error: osErr } = await sb.from("organization_settings")
    .select("pilot_mode_enabled, reply_to_email, from_name")
    .eq("organization_id", msg.org_id).maybeSingle();
  const pilotMode = osErr ? true : (os?.pilot_mode_enabled ?? true);
  if (pilotMode) {
    const sgids = stillQueued.map((r: any) => r.guardian_id).filter(Boolean);
    if (sgids.length) {
      const { data: guardians, error: gErr } = await sb.from("guardians")
        .select("id, is_pilot_family, email").eq("org_id", msg.org_id).in("id", sgids);
      if (gErr) return { redriven: 0, refailed: 0, escalated: 0, skipped: "pilot_lookup", message_id: msg.id }; // fail-closed
      const gate = decidePilotGate(guardians ?? [], pilotMode);
      if (gate.abort) return { redriven: 0, refailed: 0, escalated: 0, skipped: "pilot_gate", message_id: msg.id };
    }
  }

  // Send directly via Resend, chunked. classifyBatchResult drives the writeback.
  const fromName = os?.from_name ?? FROM_NAME_FALLBACK;
  const replyTo = os?.reply_to_email ?? REPLY_TO_FALLBACK;
  const fromHeader = `${fromName} <${FROM_EMAIL}>`;
  let redriven = 0; let refailed = 0; let escalated = 0;
  for (const batch of chunk(stillQueued, BATCH_LIMIT)) {
    const unsubUrls = await Promise.all(batch.map((r: any) => mintUnsubscribeUrl(sb, supabaseUrl, r.guardian_id)));
    const rows = batch.map((r: any, i: number) => buildEmailRow(r, msg, fromHeader, replyTo, unsubUrls[i]));
    const { data, error } = await resend.batch.send(rows);
    const c = classifyBatchResult(batch, { data, error });
    redriven += c.sent; refailed += c.failed;
    if (c.sentIds.length) {
      await sb.from("comms_message_recipients").update({ delivery_status: "sent" }).in("id", c.sentIds);
    }
    if (c.failedIds.length) {
      // Increment redrive_count per prior value (varies per row): group failed
      // rows by their prior count and bump each. A row reaching 3 is no longer
      // selected next sweep -> escalated.
      const byPrev = new Map<number, string[]>();
      for (const r of batch as any[]) {
        if (!c.failedIds.includes(r.id)) continue;
        const p = r.redrive_count ?? 0;
        const list = byPrev.get(p) ?? []; list.push(r.id); byPrev.set(p, list);
      }
      for (const [prev, ids] of byPrev.entries()) {
        const next = prev + 1;
        await sb.from("comms_message_recipients").update({ delivery_status: "failed", redrive_count: next }).in("id", ids);
        if (next >= 3) escalated += ids.length;
      }
    }
  }
  return { redriven, refailed, escalated };
}

export async function handleRedriveSweep(sb: any, now: Date) {
  void now;
  const { data: msgs, error: mErr } = await sb.from("comms_messages")
    .select("id, org_id, subject, body_html, body_plain, team_id")
    .not("status", "in", "(draft,archived)");
  if (mErr) return { error: mErr.message, redriven: 0, escalated: 0 };
  const msgIds = (msgs ?? []).map((m: any) => m.id);
  if (!msgIds.length) return { redriven: 0, escalated: 0, skipped_no_failed: true };

  const { data: recips, error: rErr } = await sb.from("comms_message_recipients")
    .select("id, message_id, guardian_id, email_at_send, body_html_rendered, body_plain_rendered, subject_rendered, redrive_count")
    .in("message_id", msgIds).eq("delivery_status", "failed").lt("redrive_count", 3);
  if (rErr) return { error: rErr.message, redriven: 0, escalated: 0 };
  if (!recips || !recips.length) return { redriven: 0, escalated: 0, skipped_no_failed: true };

  const { data: keyRow, error: keyErr } = await sb.from("app_secrets").select("value").eq("name", "resend_api_key").maybeSingle();
  const resendKey = (keyErr ? null : (keyRow?.value as string | null)) ?? Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return { error: "RESEND_API_KEY missing", redriven: 0, escalated: 0 };
  const resend = new Resend(resendKey);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

  const msgById = Object.fromEntries((msgs ?? []).map((m: any) => [m.id, m]));
  const byMsg = new Map<string, any[]>();
  for (const r of recips) { const l = byMsg.get(r.message_id) ?? []; l.push(r); byMsg.set(r.message_id, l); }

  let redriven = 0; let refailed = 0; let escalated = 0; const skipped: any[] = [];
  for (const [mid, group] of byMsg.entries()) {
    const res = await redriveGroup(sb, resend, supabaseUrl, msgById[mid], group);
    if (res.skipped) { skipped.push({ message_id: res.message_id, skipped: res.skipped }); continue; }
    redriven += res.redriven; refailed += res.refailed; escalated += res.escalated;
  }
  return { redriven, refailed, escalated, skipped };
}
