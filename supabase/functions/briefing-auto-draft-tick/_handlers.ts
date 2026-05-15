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
import { draftExists, HandlerResult, placeholderDraft, Trigger, tryInsert } from "./_draftRow.ts";

export async function handleGameCompleted(sb: SupabaseClient, trigger: Trigger, now: Date): Promise<HandlerResult[]> {
  const nowIso = now.toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
  const { data: rows = [], error } = await sb.from("game_results")
    .select("event_id, events!inner(id, team_id, start_at, teams!inner(org_id))")
    .not("published_at", "is", null).gt("published_at", sevenDaysAgo).lte("published_at", nowIso);
  if (error) return [{ trigger_id: trigger.id, org_id: trigger.org_id, kind: "game_recap", error: error.message }];
  const orgRows = (rows || []).filter((r: any) => r.events?.teams?.org_id === trigger.org_id);
  const out: HandlerResult[] = [];
  for (const r of orgRows as any[]) {
    const anchorTime = r.events?.start_at ? new Date(r.events.start_at) : null;
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
  const { data: rows = [], error } = await sb.from("tournaments")
    .select("id, start_date, org_id")
    .eq("org_id", trigger.org_id).gte("start_date", today).lte("start_date", windowEnd);
  if (error) return [{ trigger_id: trigger.id, org_id: trigger.org_id, kind: "tournament_prelim", error: error.message }];
  const out: HandlerResult[] = [];
  for (const t of rows || []) {
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
  const { data: rows = [], error } = await sb.from("tournaments")
    .select("id, end_date").eq("org_id", trigger.org_id).gte("end_date", fourteenAgo).lt("end_date", today);
  if (error) return [{ trigger_id: trigger.id, org_id: trigger.org_id, kind: "tournament_recap", error: error.message }];
  const out: HandlerResult[] = [];
  for (const t of rows || []) {
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
  const { data: rows = [], error } = await sb.from("event_change_audit")
    .select("id, event_id, changed_at, events!inner(team_id)")
    .eq("org_id", trigger.org_id).gt("changed_at", cutoff).is("dispatch_email_id", null);
  if (error) return [{ trigger_id: trigger.id, org_id: trigger.org_id, kind: "schedule_change", error: error.message }];
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

export async function handleRsvpLow24h(sb: SupabaseClient, trigger: Trigger, now: Date): Promise<HandlerResult[]> {
  const nowIso = now.toISOString();
  const in24h = new Date(now.getTime() + 24 * 3600000).toISOString();
  // Per-org RSVP coverage threshold from organization_settings.nudge_rules.
  // Default 0.7 = nudge any event with under 70% of active roster responded.
  const { data: orgSettings } = await sb.from("organization_settings")
    .select("nudge_rules").eq("organization_id", trigger.org_id).maybeSingle();
  const threshold = (orgSettings?.nudge_rules as { rsvp_coverage_threshold?: number } | null)?.rsvp_coverage_threshold ?? 0.7;
  const { data: events = [], error } = await sb.from("events")
    .select("id, team_id, start_at, teams!inner(org_id)").gt("start_at", nowIso).lte("start_at", in24h);
  if (error) return [{ trigger_id: trigger.id, org_id: trigger.org_id, kind: "rsvp_nudge", error: error.message }];
  const orgEvents = (events || []).filter((e: any) => e.teams?.org_id === trigger.org_id);
  const out: HandlerResult[] = [];
  for (const e of orgEvents as any[]) {
    const { count: total } = await sb.from("team_players")
      .select("*", { count: "exact", head: true }).eq("team_id", e.team_id).eq("status", "active");
    if (!total || total === 0) {
      out.push({ trigger_id: trigger.id, org_id: trigger.org_id, kind: "rsvp_nudge", anchor_id: e.id, skipped: "no_active_roster" });
      continue;
    }
    const { data: respRows, error: respErr } = await sb.from("event_rsvps").select("player_id").eq("event_id", e.id);
    if (respErr) throw respErr;
    const responded = new Set((respRows || []).map((r: any) => r.player_id)).size;
    const coverage = responded / total;
    if (responded > 0 && coverage >= threshold) {
      out.push({ trigger_id: trigger.id, org_id: trigger.org_id, kind: "rsvp_nudge", anchor_id: e.id, skipped: "coverage_met" });
      continue;
    }
    const anchorTime = e.start_at ? new Date(e.start_at) : null;
    const expiresAt = computeExpiryForKind("rsvp_nudge", anchorTime, now);
    const row = placeholderDraft(trigger, "rsvp_nudge", "event", e.id, e.team_id, "event_attendees", expiresAt, now);
    out.push(await tryInsert(sb, trigger, "rsvp_nudge", e.id, row));
  }
  return out;
}
