// Wave 4.3-A — auto-draft engine.
//
// Reads briefing_triggers and creates draft comms_messages rows for
// trigger events whose conditions are met right now. This is a
// SEPARATE function from briefing-cron-dispatch (which is the wave-
// 3.17 scheduled-send dispatcher); the two share no logic beyond
// the cron secret. Two functions intentional: scheduled-send is
// stable + narrow, auto-draft is new + grows across 4.3-B/C.
//
// Trigger event coverage in 4.3-A:
//   weekly_sunday   — IMPLEMENTED. Fires Sunday 08:00-08:59 NY tz
//                     per active trigger row.
//   game_completed, schedule_changed, rsvp_low_24h_before,
//   tournament_approaching, tournament_completed
//                   — STUB (no-op, returns skipped:not_implemented).
//                     4.3-B fills these in.
//
// Idempotency: skip insert if a (org_id, kind, period_start) row
// already exists for weekly_digest. The 1-hour TZ window plus this
// check guarantees at most one draft per org per Sunday despite
// the every-minute cron tick.
//
// Auth: shares the briefing-cron-dispatch cron secret. Wave 4.3-F
// moved the secret from Deno.env to public.app_secrets (name =
// 'cron_secret'), readable by the function's service-role client.
// The pg_cron job command builds Bearer from the same row.
// Rotation = `UPDATE app_secrets SET value = encode(gen_random_bytes(32), 'hex')
// WHERE name = 'cron_secret';` — immediate, no dashboard ceremony.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  buildWeeklyDigestDraftRow, isWeeklySundayWindow, weeklyDigestPeriod,
} from "./_helpers.ts";

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
  return new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json" },
  });
}

async function handleWeeklySunday(sb: ReturnType<typeof createClient>, orgId: string, now: Date) {
  if (!isWeeklySundayWindow(now)) return { skipped: "not_in_window" };
  const period = weeklyDigestPeriod(now);
  const { data: existing, error: selErr } = await sb
    .from("comms_messages")
    .select("id")
    .eq("org_id", orgId)
    .eq("kind", "weekly_digest")
    .eq("period_start", period.period_start)
    .in("status", ["draft", "scheduled", "queued", "sent"])
    .limit(1);
  if (selErr) return { error: selErr.message };
  if (existing && existing.length > 0) return { skipped: "exists", existing_id: existing[0].id };
  const row = buildWeeklyDigestDraftRow({ orgId, period, now });
  const { data: inserted, error: insErr } = await sb
    .from("comms_messages").insert(row).select("id").single();
  if (insErr) return { error: insErr.message };
  return { draft_created: true, id: inserted.id, period_start: period.period_start };
}

async function dispatchTrigger(sb: ReturnType<typeof createClient>, trigger: TriggerRow, now: Date) {
  switch (trigger.trigger_event) {
    case "weekly_sunday":
      return await handleWeeklySunday(sb, trigger.org_id, now);
    case "game_completed":
    case "schedule_changed":
    case "rsvp_low_24h_before":
    case "tournament_approaching":
    case "tournament_completed":
    case "event_reminder_due":
      // Stubbed in 4.3-A; 4.3-B fills these in.
      return { skipped: "not_implemented", trigger_event: trigger.trigger_event };
    default:
      return { skipped: "unknown_trigger_event", trigger_event: trigger.trigger_event };
  }
}

async function readCronSecret(sb: ReturnType<typeof createClient>): Promise<string | null> {
  const { data, error } = await sb.from("app_secrets").select("value").eq("name", "cron_secret").maybeSingle();
  if (error || !data?.value) return null;
  return data.value as string;
}

Deno.serve(async (req) => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

  const presented = req.headers.get("Authorization")?.replace(/^Bearer\s+/, "") ?? "";
  const expected = await readCronSecret(sb);
  if (!expected || presented !== expected) {
    return json({ error: "Unauthorized" }, 401);
  }

  const now = new Date();
  const { data: triggers, error: trigErr } = await sb
    .from("briefing_triggers")
    .select("id, org_id, team_type_id, trigger_event, briefing_kind, lead_time_hours, active")
    .eq("active", true);
  if (trigErr) return json({ error: trigErr.message }, 500);
  if (!triggers || triggers.length === 0) return json({ processed: 0, results: [] });

  // Collapse weekly_sunday triggers per (org_id) — Q3 lock: one
  // org-wide weekly_digest per Sunday, ignore team_type_id. Other
  // trigger_events fan out as-is (each row dispatched separately).
  const seenWeeklySundayOrgs = new Set<string>();
  const results: Array<Record<string, unknown>> = [];
  for (const t of triggers as TriggerRow[]) {
    if (t.trigger_event === "weekly_sunday") {
      if (seenWeeklySundayOrgs.has(t.org_id)) continue;
      seenWeeklySundayOrgs.add(t.org_id);
    }
    const r = await dispatchTrigger(sb, t, now);
    results.push({ trigger_id: t.id, org_id: t.org_id, kind: t.briefing_kind, ...r });
  }

  const draftsCreated = results.filter((r) => r.draft_created).length;
  return json({ processed: results.length, drafts_created: draftsCreated, results });
});
