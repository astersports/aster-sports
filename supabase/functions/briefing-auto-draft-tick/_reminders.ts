// Stream A (§16.5) event-reminder handler — automatic direct-send.
// Detects games/tournament games crossing the 3d/1d/4h cadence and sends
// push + email directly (NOT the editorial briefing pipeline). Per-offset
// idempotency via event_reminder_log (unique event_id+offset_bucket); the
// log row is claimed BEFORE sending so overlapping ticks can't double-fire.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { composeReminder, decideReminder, isQuietHoursET } from "./_reminderLogic.ts";
import { resolveRecipients, sendReminderEmail, sendReminderPush } from "./_reminderSend.ts";
import type { HandlerResult, Trigger } from "./_draftRow.ts";

const EVENT_FIELDS =
  "id, team_id, title, opponent, start_at, location, sub_location, arrival_minutes_before, jersey, teams!inner(org_id)";

export async function handleEventReminder(sb: SupabaseClient, trigger: Trigger, now: Date): Promise<HandlerResult[]> {
  const base = { trigger_id: trigger.id, org_id: trigger.org_id, kind: "event_reminder" };
  if (isQuietHoursET(now)) return [{ ...base, skipped: "quiet_hours" }];

  const { data: secretRow, error: secErr } = await sb.from("app_secrets").select("value").eq("name", "cron_secret").maybeSingle();
  const cronSecret = secErr ? "" : ((secretRow?.value as string | undefined) ?? "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  // On an org-settings read error, default pilotMode TRUE (fail safe — that
  // suppresses non-pilot sends rather than risking a broad accidental send).
  const { data: os, error: osErr } = await sb.from("organization_settings")
    .select("pilot_mode_enabled").eq("organization_id", trigger.org_id).maybeSingle();
  const pilotMode = osErr ? true : ((os?.pilot_mode_enabled as boolean | undefined) ?? true);

  // Wave 3.A #19 P0-3 closure: respect admin "Event Reminders" toggle from
  // AutoNotificationSettingsSheet → organizations.auto_notifications JSONB.
  // Undefined = enabled (matches UI's `cfg.reminders_enabled !== false`).
  // Read error → enabled (fail-OPEN here is correct: don't silence reminders
  // because of a transient DB hiccup; the per-event idempotency log still
  // prevents double-fire).
  const { data: org, error: orgErr } = await sb.from("organizations")
    .select("auto_notifications").eq("id", trigger.org_id).maybeSingle();
  const autoCfg = (orgErr ? {} : (org?.auto_notifications as Record<string, unknown> | null) ?? {}) as { reminders_enabled?: boolean };
  if (autoCfg.reminders_enabled === false) {
    return [{ ...base, skipped: "reminders_disabled_by_admin" }];
  }

  const nowMs = now.getTime();
  const in72 = new Date(nowMs + 72 * 3600000).toISOString();
  const { data: evs, error } = await sb.from("events").select(EVENT_FIELDS)
    .in("event_type", ["game", "tournament"]).eq("status", "scheduled").eq("publish_status", "published")
    .gt("start_at", now.toISOString()).lte("start_at", in72);
  if (error) return [{ ...base, error: error.message }];
  const orgEvents = (evs ?? []).filter((e: any) => e.teams?.org_id === trigger.org_id);

  const out: HandlerResult[] = [];
  for (const e of orgEvents as any[]) {
    const { data: logs, error: logErr } = await sb.from("event_reminder_log").select("offset_bucket").eq("event_id", e.id);
    // Can't read the dedup log -> skip this event rather than risk re-sending.
    if (logErr) { out.push({ ...base, anchor_id: e.id, error: logErr.message }); continue; }
    const decision = decideReminder(Date.parse(e.start_at), nowMs, (logs ?? []).map((l: any) => l.offset_bucket));
    if (!decision) continue;

    // Claim the send bucket first — unique(event_id,offset_bucket) makes a
    // concurrent tick's insert fail, so only one tick sends this reminder.
    const { error: claimErr } = await sb.from("event_reminder_log")
      .insert({ org_id: trigger.org_id, event_id: e.id, offset_bucket: decision.sendBucket, recipient_count: 0 });
    if (claimErr) { out.push({ ...base, anchor_id: e.id, skipped: "claimed_elsewhere" }); continue; }
    if (decision.supersededBuckets.length) {
      await sb.from("event_reminder_log").upsert(
        decision.supersededBuckets.map((b) => ({ org_id: trigger.org_id, event_id: e.id, offset_bucket: b, recipient_count: 0 })),
        { onConflict: "event_id,offset_bucket", ignoreDuplicates: true },
      );
    }

    const rec = await resolveRecipients(sb, e.team_id, trigger.org_id, pilotMode);
    const c = composeReminder(e, decision.sendBucket);
    const pushSent = cronSecret ? await sendReminderPush(supabaseUrl, cronSecret, rec.userIds, c.title, c.pushBody) : 0;
    const emailSent = await sendReminderEmail(sb, trigger.org_id, rec.emailGuardians, c.subject, c.html, c.plain);
    await sb.from("event_reminder_log").update({ recipient_count: rec.count, push_sent: pushSent, email_sent: emailSent })
      .eq("event_id", e.id).eq("offset_bucket", decision.sendBucket);
    out.push({ ...base, anchor_id: e.id, sent_bucket: decision.sendBucket, push_sent: pushSent, email_sent: emailSent, recipients: rec.count, reminder_sent: true } as HandlerResult);
  }
  return out;
}
