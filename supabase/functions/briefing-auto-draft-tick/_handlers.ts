// Wave 4.3-B — auto-draft handlers for the 5 non-weekly trigger
// events. Mirror of weekly_sunday's pattern from 4.3-A: each handler
// selects unscheduled anchors, idempotency-checks, inserts a
// placeholder draft (subject + content_sections NULL). The resolver
// runs fresh at admin's preview/send time per the wave-4.2-A-8a
// locked behavior.
//
// Per-org collapse (Set across trigger rows within the same org)
// happens in index.ts dispatch — handlers receive (orgId, trigger,
// now) and don't fan out internally across team_type rows.
//
// Wave 4.8 6c Session 1 — each handler now derives an anchorTime
// (event.start_at / tournament.start_date / tournament.end_date /
// event.start_at / null) and computes expires_at via
// computeExpiryForKind. placeholderDraft + draftExists + tryInsert
// moved to ./_draftRow.ts to keep this file under the 150 LOC cap.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { computeExpiryForKind } from "./_helpers.ts";
import { nudgeWindowEndIso, rsvpMinGoingThreshold, rsvpNudgesEnabled, shouldNudgeLowGoing } from "./_rsvpNudgeThreshold.ts";
import { draftExists, HandlerResult, placeholderDraft, Trigger, tryInsert } from "./_draftRow.ts";

export async function handleGameCompleted(sb: SupabaseClient, trigger: Trigger, now: Date): Promise<HandlerResult[]> {
  const nowIso = now.toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
  const { data, error } = await sb.from("game_results")
    .select("event_id, published_at, events!inner(id, team_id, start_at, teams!inner(org_id))")
    .not("published_at", "is", null).gt("published_at", sevenDaysAgo).lte("published_at", nowIso);
  if (error) return [{ trigger_id: trigger.id, org_id: trigger.org_id, kind: "game_recap", error: error.message }];
  const rows = data || [];
  const orgRows = rows.filter((r: any) => r.events?.teams?.org_id === trigger.org_id);
  const out: HandlerResult[] = [];
  for (const r of orgRows as any[]) {
    // PR-A follow-up (proposal lifecycle): anchor the 14d window to the LATER
    // of game date and score-publish. A score entered >14d after the game
    // would otherwise yield expires_at = start_at + 14d already in the past ->
    // born archived -> invisible in the Radar. published_at is within the last
    // 7d (query filter), so GREATEST(start_at, published_at) + 14d is always
    // >=7d in the future -> the proposal is born LIVE and actionable.
    const startAt = r.events?.start_at ? new Date(r.events.start_at) : null;
    const publishedAt = r.published_at ? new Date(r.published_at) : null;
    const anchorTime = (startAt && publishedAt)
      ? (publishedAt > startAt ? publishedAt : startAt)
      : (publishedAt ?? startAt);
    const expiresAt = computeExpiryForKind("game_recap", anchorTime, now);
    const row = placeholderDraft(trigger, "game_recap", "event", r.event_id, r.events.team_id, "event_attendees", expiresAt, now);
    out.push(await tryInsert(sb, trigger, "game_recap", r.event_id, row));
  }
  return out;
}

export async function handleTournamentApproaching(sb: SupabaseClient, trigger: Trigger, now: Date): Promise<HandlerResult[]> {
  const leadH = trigger.lead_time_hours ?? 72;
  const windowEnd = new Date(now.getTime() + leadH * 3600000).toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);
  const { data, error } = await sb.from("tournaments")
    .select("id, start_date, org_id")
    .eq("org_id", trigger.org_id).gte("start_date", today).lte("start_date", windowEnd);
  if (error) return [{ trigger_id: trigger.id, org_id: trigger.org_id, kind: "tournament_prelim", error: error.message }];
  const rows = data || [];
  const out: HandlerResult[] = [];
  for (const t of rows) {
    // start_date is a DATE — bind it to midnight Eastern via the SQL
    // text-cast pattern mirrored from the migration (EDT-fixed offset
    // is acceptable for May; full DST correctness ships with the
    // briefing_active_queue RPC in PR #119).
    const anchorTime = new Date(`${t.start_date}T04:00:00Z`);
    const expiresAt = computeExpiryForKind("tournament_prelim", anchorTime, now);
    const row = placeholderDraft(trigger, "tournament_prelim", "tournament", t.id, null, "tournament_attendees", expiresAt, now);
    out.push(await tryInsert(sb, trigger, "tournament_prelim", t.id, row));
  }
  return out;
}

export async function handleTournamentCompleted(sb: SupabaseClient, trigger: Trigger, now: Date): Promise<HandlerResult[]> {
  const today = now.toISOString().slice(0, 10);
  const fourteenAgo = new Date(now.getTime() - 14 * 86400000).toISOString().slice(0, 10);
  const { data, error } = await sb.from("tournaments")
    .select("id, end_date").eq("org_id", trigger.org_id).gte("end_date", fourteenAgo).lt("end_date", today);
  if (error) return [{ trigger_id: trigger.id, org_id: trigger.org_id, kind: "tournament_recap", error: error.message }];
  const rows = data || [];
  const out: HandlerResult[] = [];
  for (const t of rows) {
    // end_date DATE → end-of-day Eastern (03:59 UTC the next morning).
    const anchorTime = new Date(`${t.end_date}T23:59:59Z`);
    const expiresAt = computeExpiryForKind("tournament_recap", anchorTime, now);
    const row = placeholderDraft(trigger, "tournament_recap", "tournament", t.id, null, "tournament_attendees", expiresAt, now);
    out.push(await tryInsert(sb, trigger, "tournament_recap", t.id, row));
  }
  return out;
}

export async function handleScheduleChanged(sb: SupabaseClient, trigger: Trigger, now: Date): Promise<HandlerResult[]> {
  const cutoff = new Date(now.getTime() - 24 * 3600000).toISOString();
  // STEP-3 (2026-06-03): comms_messages is the canonical "already notified?"
  // source. The per-anchor idempotency check below (kind=schedule_change,
  // status in draft/scheduled/queued/sent, last_edited_at >= changed_at) is the
  // sole guard. We do NOT pre-filter on event_change_audit.dispatch_email_id:
  // that column conflates "admin chose to skip" with "not yet sent" (migration
  // 20260523224521), is never written by the composer send path, and is now
  // optional forensic denormalization — not the health signal.
  const { data, error } = await sb.from("event_change_audit")
    .select("id, event_id, changed_at, events!inner(team_id)")
    .eq("org_id", trigger.org_id).gt("changed_at", cutoff);
  if (error) return [{ trigger_id: trigger.id, org_id: trigger.org_id, kind: "schedule_change", error: error.message }];
  const rows = data || [];
  const out: HandlerResult[] = [];
  const expiresAt = computeExpiryForKind("schedule_change", null, now);
  for (const r of rows as any[]) {
    // schedule_change idempotency: per-audit-row — a draft from BEFORE
    // this audit row's changed_at is a stale change; create a fresh one.
    const { data: existing } = await sb.from("comms_messages").select("id")
      .eq("org_id", trigger.org_id).eq("kind", "schedule_change").eq("anchor_id", r.event_id)
      .in("status", ["draft", "scheduled", "queued", "sent"]).gte("last_edited_at", r.changed_at).limit(1);
    if (existing && existing.length > 0) {
      out.push({ trigger_id: trigger.id, org_id: trigger.org_id, kind: "schedule_change", anchor_id: r.event_id, skipped: "already_drafted" });
      continue;
    }
    const row = placeholderDraft(trigger, "schedule_change", "event", r.event_id, r.events?.team_id ?? null, "event_attendees", expiresAt, now);
    const { error: insErr } = await sb.from("comms_messages").insert(row);
    out.push(insErr
      ? { trigger_id: trigger.id, org_id: trigger.org_id, kind: "schedule_change", anchor_id: r.event_id, error: insErr.message }
      : { trigger_id: trigger.id, org_id: trigger.org_id, kind: "schedule_change", anchor_id: r.event_id, created: true });
  }
  return out;
}

// The DB trigger_event value stays `rsvp_low_24h_before` (briefing_triggers
// CHECK + seed rows); only the function + its window were renamed/widened.
export async function handleRsvpLowGoing(sb: SupabaseClient, trigger: Trigger, now: Date): Promise<HandlerResult[]> {
  const nowIso = now.toISOString();
  // Event-proximity window: games starting within RSVP_NUDGE_WINDOW_HOURS of now.
  // Operator-widened 2026-06-05 from 24h to 48h — more lead time to rally players
  // for a short-rostered game. The window bound lives in the AP #30 mirror pair.
  const windowEnd = nudgeWindowEndIso(now);
  // Per-org "fewer than N confirmed going" floor from
  // organizations.auto_notifications.rsvp_min_going (default 5 — "you need 5 to
  // field a game"). Operator-locked 2026-06-05; replaced the prior
  // organization_settings.nudge_rules <70%-coverage model. Mirrors the
  // reminders_enabled default-when-unset pattern the same column uses.
  // AP #36 — destructure error; a read miss falls back to the default floor.
  const { data: org, error: orgErr } = await sb.from("organizations")
    .select("auto_notifications").eq("id", trigger.org_id).maybeSingle();
  const autoCfg = (orgErr ? {} : (org?.auto_notifications as Record<string, unknown> | null) ?? {}) as { rsvp_min_going?: unknown; rsvp_nudges_enabled?: boolean };
  // FORK A (operator-ratified 2026-06-09): Stream B is OFF unless the admin has
  // explicitly enabled it. Empty {} / unset / read-miss => OFF (fail-closed).
  // Mirrors the Stream A reminders_enabled gate in _reminders.ts, but inverted
  // default (Stream A is opt-out / default-ON; Stream B is opt-in / default-OFF).
  if (!rsvpNudgesEnabled(autoCfg)) {
    return [{ trigger_id: trigger.id, org_id: trigger.org_id, kind: "rsvp_nudge", skipped: "nudges_disabled_by_admin" }];
  }
  const threshold = rsvpMinGoingThreshold(autoCfg);
  // Scope to real GAMES that are live on the schedule — matches the Stream A
  // reminder handler (_reminders.ts). Without these filters Stream B drafted
  // spurious "QUICK RSVP" nudges for practices (§16.5 scopes Stream B to "an
  // upcoming game") and for cancelled/unpublished events (which trivially trip
  // the going-floor at ~0 confirmed). event_type game|tournament + status
  // scheduled + publish_status published.
  const { data: eventsData, error } = await sb.from("events")
    .select("id, team_id, start_at, teams!inner(org_id)")
    .in("event_type", ["game", "tournament"]).eq("status", "scheduled").eq("publish_status", "published")
    .gt("start_at", nowIso).lte("start_at", windowEnd);
  if (error) return [{ trigger_id: trigger.id, org_id: trigger.org_id, kind: "rsvp_nudge", error: error.message }];
  const events = eventsData || [];
  const orgEvents = events.filter((e: any) => e.teams?.org_id === trigger.org_id);
  const out: HandlerResult[] = [];
  for (const e of orgEvents as any[]) {
    // Count confirmed "going" RSVPs for the event. AP #36 — destructure error
    // and surface it rather than letting a false-empty count draft a spurious
    // nudge.
    const { count: goingCount, error: goingErr } = await sb.from("event_rsvps")
      .select("*", { count: "exact", head: true }).eq("event_id", e.id).eq("response", "going");
    if (goingErr) { out.push({ trigger_id: trigger.id, org_id: trigger.org_id, kind: "rsvp_nudge", anchor_id: e.id, error: goingErr.message }); continue; }
    if (!shouldNudgeLowGoing(goingCount ?? 0, threshold)) {
      out.push({ trigger_id: trigger.id, org_id: trigger.org_id, kind: "rsvp_nudge", anchor_id: e.id, skipped: "going_floor_met" });
      continue;
    }
    const anchorTime = e.start_at ? new Date(e.start_at) : null;
    const expiresAt = computeExpiryForKind("rsvp_nudge", anchorTime, now);
    const row = placeholderDraft(trigger, "rsvp_nudge", "event", e.id, e.team_id, "event_attendees", expiresAt, now);
    out.push(await tryInsert(sb, trigger, "rsvp_nudge", e.id, row));
  }
  return out;
}
