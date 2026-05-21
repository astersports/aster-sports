// Wave 4.3-A — auto-draft engine helpers (Deno mirror).
//
// LOGICAL MIRROR of `src/lib/cron/briefingCronHelpers.js`. The .js
// file is the vitest-covered source of truth; this .ts file ships
// inside the Supabase Edge Function deploy bundle (cross-tree
// imports from src/ aren't guaranteed to resolve in Deno deploys).
// Both files MUST stay in sync. See CLAUDE.md anti-pattern #30.
//
// Logic uses only standard ES + Intl, so the two files are
// near-identical apart from TypeScript annotations.

const ORG_TIMEZONE_DEFAULT = 'America/New_York';

// Wave 4.8 6c — kind-scoped expiry windows for the Active queue.
// MUST stay in sync with the SQL CASE branches in
// 20260512162843_wave_4_8_6c_1_comms_messages_expires_at.sql + the
// future briefing_active_queue RPC (PR #119).
// game_recap        14d post-event
// tournament_prelim until tournament starts (or +14d fallback)
// tournament_recap  30d post-end_date
// schedule_change   7d post-edit
// weekly_digest     7d post-edit
// announcement      30d post-edit
// rsvp_nudge        until event starts (or +3d fallback)
// custom_message    30d post-edit
// academy_callup    7d post-edit
export function computeExpiryForKind(kind: string, anchorTime: Date | null, fallbackEdit: Date): Date {
  const fallback = fallbackEdit ?? new Date();
  switch (kind) {
    case 'game_recap':
      return new Date((anchorTime ?? fallback).getTime() + 14 * 86400000);
    case 'tournament_prelim':
      return anchorTime ?? new Date(fallback.getTime() + 14 * 86400000);
    case 'tournament_recap':
      return new Date((anchorTime ?? fallback).getTime() + 30 * 86400000);
    case 'schedule_change':
    case 'weekly_digest':
      return new Date(fallback.getTime() + 7 * 86400000);
    case 'announcement':
    case 'custom_message':
      return new Date(fallback.getTime() + 30 * 86400000);
    case 'rsvp_nudge':
      return anchorTime ?? new Date(fallback.getTime() + 3 * 86400000);
    case 'academy_callup_notice':
      return new Date(fallback.getTime() + 7 * 86400000);
    default:
      return new Date(fallback.getTime() + 14 * 86400000);
  }
}

export interface DateParts {
  weekday: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

// Parts of a date in the org timezone. Output is plain integers + a
// weekday string ('Sunday' etc.). Avoids any Date.getDay() drift.
export function partsInTimeZone(date: Date, timeZone = ORG_TIMEZONE_DEFAULT) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone, weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    weekday: parts.weekday,
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour === '24' ? '00' : parts.hour),
    minute: Number(parts.minute),
  };
}

// Returns the local date (YYYY-MM-DD) for `date` in the given timezone.
export function localDateIso(date: Date, timeZone = ORG_TIMEZONE_DEFAULT) {
  const p = partsInTimeZone(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

// Adds N days to a YYYY-MM-DD string, returns YYYY-MM-DD.
export function addDaysIso(dateIso: string, days: number) {
  // Anchor at noon UTC to dodge DST boundary drift; the date arithmetic
  // only needs day-precision, so the time-of-day is irrelevant.
  const d = new Date(`${dateIso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// TZ gate for weekly_sunday triggers: fire when local time is Sunday
// between 08:00:00 and 08:59:59 in the org timezone. Returns boolean.
export function isWeeklySundayWindow(now: Date, timeZone = ORG_TIMEZONE_DEFAULT) {
  const p = partsInTimeZone(now, timeZone);
  return p.weekday === 'Sunday' && p.hour === 8;
}

export interface WeeklyDigestPeriod {
  period_start: string;
  period_end: string;
}

// Compute the [period_start, period_end] for a weekly_digest anchored
// at `now`. period_start = today's local date (Sunday), period_end =
// Saturday 6 days later. Both YYYY-MM-DD.
export function weeklyDigestPeriod(now: Date, timeZone = ORG_TIMEZONE_DEFAULT) {
  const start = localDateIso(now, timeZone);
  const end = addDaysIso(start, 6);
  return { period_start: start, period_end: end };
}

// Shape of the draft row inserted into comms_messages for a
// weekly_digest auto-draft. Subject stays NULL so admin preview shows
// the resolver-rendered subject fresh at send time per the
// wave-4.2-A-8a locked behavior. body_html + body_plain are NOT NULL
// on comms_messages with no default — empty strings are placeholders
// until admin previews. content_sections gets [] to satisfy its NOT
// NULL constraint (default is '[]'::jsonb). last_edited_by is NULL:
// the cron service has no user identity.
export function buildWeeklyDigestDraftRow({ orgId, period, now, triggerId = null }: { orgId: string; period: WeeklyDigestPeriod; now: Date; triggerId?: string | null }) {
  return {
    org_id: orgId,
    created_by_trigger: triggerId,
    kind: 'weekly_digest',
    anchor_kind: 'org',
    anchor_id: orgId,
    period_start: period.period_start,
    period_end: period.period_end,
    status: 'draft',
    subject: null,
    body_html: '',
    body_plain: '',
    content_sections: [],
    audience_type: 'org_all',
    audience_filter: null,
    delivery_method: 'queued',
    last_edited_at: now.toISOString(),
    last_edited_by: null,
    expires_at: computeExpiryForKind('weekly_digest', null, now).toISOString(),
  };
}

// Idempotency check args for a weekly_digest auto-draft. Returns the
// (org_id, kind, period_start) tuple a caller uses to look up an
// existing row before inserting.
export function weeklyDigestIdempotencyKey(orgId: string, periodStart: string) {
  return { org_id: orgId, kind: 'weekly_digest', period_start: periodStart };
}

export const ORG_TIMEZONE = ORG_TIMEZONE_DEFAULT;
