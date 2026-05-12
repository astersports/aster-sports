// Wave 4.3-A — auto-draft engine.
// Wave 4.3-B — 5 remaining handlers (game_completed, schedule_changed,
// rsvp_low_24h_before, tournament_approaching, tournament_completed)
// implemented + force-fire override for ops testing.
//
// Reads briefing_triggers and creates placeholder draft comms_messages
// rows (subject + content_sections NULL; resolver runs at preview/send
// time per wave-4.2-A-8a). Per-org collapse via Set across team_type
// rows. weekly_sunday TZ gate inline; other handlers select via their
// natural time windows.
//
// Auth: shares the briefing-cron-dispatch cron secret via app_secrets
// (wave 4.3-F).
//
// Force-fire (ops): POST /briefing-auto-draft-tick
//   ?force_trigger_event=<event>&force_now=<ISO>
// Bypasses the weekly_sunday TZ gate; force_now overrides Date.now()
// for handler time-window queries. Idempotency still applies.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildWeeklyDigestDraftRow, isWeeklySundayWindow, weeklyDigestPeriod } from "./_helpers.ts";
import {
  handleGameCompleted, handleRsvpLow24h, handleScheduleChanged,
  handleTournamentApproaching, handleTournamentCompleted,
} from "./_handlers.ts";

interface TriggerRow {
  id: string;
  org_id: string;
  team_type_id: string | null;
  trigger_event: string;
  briefing_kind: string;
  lead_time_hours: number | null;
  active: boolean;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

async function readCronSecret(sb: ReturnType<typeof createClient>): Promise<string | null> {
  const { data, error } = await sb.from("app_secrets").select("value").eq("name", "cron_secret").maybeSingle();
  if (error || !data?.value) return null;
  return data.value as string;
}

// Wave 4.8 6c — archive expired drafts on every tick. Single UPDATE
// scoped to status='draft' AND expires_at < now. Runs unconditionally
// before the trigger loop (no briefing_triggers row needed).
async function handleExpireSweep(sb: ReturnType<typeof createClient>, now: Date) {
  const { data, error } = await sb.from("comms_messages")
    .update({ status: "archived" })
    .eq("status", "draft")
    .lt("expires_at", now.toISOString())
    .select("id, kind, anchor_id");
  if (error) return { error: error.message, archived: 0 };
  return { archived: (data || []).length, ids: (data || []).map((r: { id: string }) => r.id) };
}

async function handleWeeklySunday(sb: ReturnType<typeof createClient>, triggerId: string, orgId: string, now: Date, bypassWindow: boolean) {
  if (!bypassWindow && !isWeeklySundayWindow(now)) return { skipped: "not_in_window" };
  const period = weeklyDigestPeriod(now);
  const { data: existing, error: selErr } = await sb.from("comms_messages")
    .select("id").eq("org_id", orgId).eq("kind", "weekly_digest").eq("period_start", period.period_start)
    .in("status", ["draft", "scheduled", "queued", "sent"]).limit(1);
  if (selErr) return { error: selErr.message };
  if (existing && existing.length > 0) return { skipped: "exists", existing_id: existing[0].id };
  const row = buildWeeklyDigestDraftRow({ orgId, period, now, triggerId });
  const { data: inserted, error: insErr } = await sb.from("comms_messages").insert(row).select("id").single();
  if (insErr) return { error: insErr.message };
  return { draft_created: true, id: inserted.id, period_start: period.period_start };
}

async function dispatchTrigger(sb: ReturnType<typeof createClient>, t: TriggerRow, now: Date, forceEvent: string | null) {
  const bypassWeeklyWindow = forceEvent === "weekly_sunday";
  switch (t.trigger_event) {
    case "weekly_sunday": return [{ trigger_id: t.id, org_id: t.org_id, kind: t.briefing_kind, ...(await handleWeeklySunday(sb, t.id, t.org_id, now, bypassWeeklyWindow)) }];
    case "game_completed": return await handleGameCompleted(sb, t, now);
    case "tournament_approaching": return await handleTournamentApproaching(sb, t, now);
    case "tournament_completed": return await handleTournamentCompleted(sb, t, now);
    case "schedule_changed": return await handleScheduleChanged(sb, t, now);
    case "rsvp_low_24h_before": return await handleRsvpLow24h(sb, t, now);
    case "event_reminder_due": return [{ trigger_id: t.id, org_id: t.org_id, kind: t.briefing_kind, skipped: "not_implemented", trigger_event: t.trigger_event }];
    default: return [{ trigger_id: t.id, org_id: t.org_id, kind: t.briefing_kind, skipped: "unknown_trigger_event", trigger_event: t.trigger_event }];
  }
}

Deno.serve(async (req) => {
  const auth = req.headers.get("Authorization");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
  const expected = await readCronSecret(sb);
  if (!expected || auth !== `Bearer ${expected}`) return json({ error: "Unauthorized" }, 401);

  const url = new URL(req.url);
  const forceEvent = url.searchParams.get("force_trigger_event");
  const forceNow = url.searchParams.get("force_now");
  const now = forceNow ? new Date(forceNow) : new Date();
  if (forceNow && isNaN(now.getTime())) return json({ error: "force_now must be a valid ISO 8601 date" }, 400);

  // Sweep expired drafts before dispatch — independent of trigger rows.
  const sweepResult = await handleExpireSweep(sb, now);

  let query = sb.from("briefing_triggers")
    .select("id, org_id, team_type_id, trigger_event, briefing_kind, lead_time_hours, active")
    .eq("active", true);
  if (forceEvent) query = query.eq("trigger_event", forceEvent);
  const { data: triggers, error: trigErr } = await query;
  if (trigErr) return json({ error: trigErr.message }, 500);
  if (!triggers || triggers.length === 0) return json({ processed: 0, expire_sweep: sweepResult, results: [], force: { forceEvent, forceNow } });

  // Per-org collapse: each (org_id, trigger_event) pair runs once.
  const seen = new Set<string>();
  const results: Array<Record<string, unknown>> = [];
  for (const t of triggers as TriggerRow[]) {
    const key = `${t.org_id}:${t.trigger_event}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const r = await dispatchTrigger(sb, t, now, forceEvent);
    results.push(...r);
  }
  const draftsCreated = results.filter((r) => r.created || r.draft_created).length;
  return json({
    processed: results.length,
    drafts_created: draftsCreated,
    expire_sweep: sweepResult,
    results,
    force: forceEvent || forceNow ? { forceEvent, forceNow } : undefined,
  });
});
