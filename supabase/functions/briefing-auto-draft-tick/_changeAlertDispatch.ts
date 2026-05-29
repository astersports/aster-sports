// Event change-alert dispatcher (Wave 3.A #19 P0-1).
//
// The 5 migration-027 triggers write queued `event_notifications` rows when a
// published event is added / cancelled / rescheduled / relocated, plus
// chat_mention on coach comments. Nothing consumed them — 30 rows sat queued
// for 17 days, parents never notified. This handler runs unconditionally on
// every briefing-auto-draft-tick (like handleExpireSweep) and drains the
// queue:
//
//   - URGENT rows (channels contains "push" => trigger p_urgent=true:
//     cancellation / reschedule / relocation): resolve team -> guardians,
//     compose, send push + email per the org's notification_channels config,
//     mark sent/failed. Urgent changes bypass quiet hours
//     (notification_channels.emergency_override_bypasses_quiet_hours).
//   - in_app-only rows (event_added / chat_mention): no in-app consumer
//     exists yet, so mark 'cancelled' to keep the queue clean (Decision D,
//     2026-05-29). Re-point here when an in-app feed lands.
//
// Reuses the Stream A send IO (_reminderSend.ts) so push/email behaviour +
// pilot-mode gating stay identical to event reminders.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { composeChangeAlert } from "./_changeAlertLogic.ts";
import { resolveRecipients, sendReminderEmail, sendReminderPush } from "./_reminderSend.ts";

const DEFAULT_CHANNELS = { push: true, email: true };

interface OrgNotify {
  pilotMode: boolean;
  defaults: { push: boolean; email: boolean };
  perCategory: Record<string, { push?: boolean; email?: boolean }>;
}

async function loadOrgNotify(sb: SupabaseClient, orgId: string): Promise<OrgNotify> {
  const { data, error } = await sb.from("organization_settings")
    .select("pilot_mode_enabled, notification_channels").eq("organization_id", orgId).maybeSingle();
  // Read error -> pilotMode true (fail safe: suppress non-pilot sends).
  const pilotMode = error ? true : ((data?.pilot_mode_enabled as boolean | undefined) ?? true);
  const nc = (data?.notification_channels as any) || {};
  return { pilotMode, defaults: nc.defaults || DEFAULT_CHANNELS, perCategory: nc.per_category || {} };
}

export async function handleEventChangeDispatch(
  sb: SupabaseClient, now: Date, supabaseUrl: string, cronSecret: string,
): Promise<Array<Record<string, unknown>>> {
  const base = { kind: "event_change_dispatch" };
  const { data: rows, error } = await sb.from("event_notifications")
    .select("id, org_id, recipient_id, notification_type, change_summary, channels")
    .eq("status", "queued").order("created_at", { ascending: true }).limit(100);
  if (error) return [{ ...base, error: error.message }];
  if (!rows || rows.length === 0) return [{ ...base, processed: 0 }];

  const hasPush = (r: any) => Array.isArray(r.channels) && r.channels.includes("push");
  const inAppOnly = rows.filter((r: any) => !hasPush(r));
  const urgent = rows.filter(hasPush);
  const out: Array<Record<string, unknown>> = [];

  // in_app-only: no consumer today -> clear so the queue can't re-accumulate.
  if (inAppOnly.length) {
    const { error: clrErr } = await sb.from("event_notifications").update({ status: "cancelled" })
      .in("id", inAppOnly.map((r: any) => r.id)).eq("status", "queued");
    out.push({ ...base, in_app_only_cleared: clrErr ? 0 : inAppOnly.length, ...(clrErr ? { in_app_error: clrErr.message } : {}) });
  }

  // Group urgent rows by org so settings load once per org.
  const byOrg = new Map<string, any[]>();
  for (const r of urgent) {
    const list = byOrg.get(r.org_id) ?? [];
    list.push(r);
    byOrg.set(r.org_id, list);
  }

  for (const [orgId, orgRows] of byOrg) {
    const cfg = await loadOrgNotify(sb, orgId);
    for (const r of orgRows) {
      // Claim queued -> sending so overlapping ticks can't double-send.
      const { data: claimed, error: claimErr } = await sb.from("event_notifications")
        .update({ status: "sending" }).eq("id", r.id).eq("status", "queued").select("id");
      if (claimErr) { out.push({ ...base, anchor_id: r.id, error: claimErr.message }); continue; }
      if (!claimed || claimed.length === 0) { out.push({ ...base, anchor_id: r.id, skipped: "claimed_elsewhere" }); continue; }
      try {
        const cat = cfg.perCategory[r.notification_type] || cfg.defaults;
        const rec = await resolveRecipients(sb, r.recipient_id, orgId, cfg.pilotMode);
        const c = composeChangeAlert(r);
        const pushSent = (cat.push && cronSecret) ? await sendReminderPush(supabaseUrl, cronSecret, rec.userIds, c.title, c.pushBody) : 0;
        const emailSent = cat.email ? await sendReminderEmail(sb, orgId, rec.emails, c.subject, c.html, c.plain) : 0;
        await sb.from("event_notifications").update({ status: "sent", sent_at: now.toISOString(), delivered_at: now.toISOString() }).eq("id", r.id);
        out.push({ ...base, anchor_id: r.id, type: r.notification_type, push_sent: pushSent, email_sent: emailSent, recipients: rec.count, sent: true });
      } catch (e) {
        const reason = String((e as Error)?.message ?? e).slice(0, 300);
        await sb.from("event_notifications").update({ status: "failed", failed_at: now.toISOString(), failure_reason: reason }).eq("id", r.id);
        out.push({ ...base, anchor_id: r.id, error: reason });
      }
    }
  }
  return out;
}
