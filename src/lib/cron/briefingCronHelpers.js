// Wave 4.3-A — auto-draft engine pure helpers.
//
// SOURCE OF TRUTH for the auto-draft logic. This file is vitest-covered
// and runs in Node. A byte-for-byte logical MIRROR lives at
// `supabase/functions/briefing-auto-draft-tick/_helpers.ts` for the
// Deno-deployed edge function. The mirror MUST stay in sync — see
// CLAUDE.md anti-pattern #30.
//
// Why mirrored instead of one canonical import: Supabase Edge Function
// deploys bundle the function directory only. Cross-tree imports from
// the parent src/ tree are not guaranteed to resolve at deploy time.
// Pragmatic split: src/lib/cron/ is the tested source; the function
// dir gets a sibling copy. Both files share the same logic (no Node
// vs Deno API differences — only standard ES + Intl).

const ORG_TIMEZONE_DEFAULT = 'America/New_York';

// Parts of a date in the org timezone. Output is plain integers + a
// weekday string ('Sunday' etc.). Avoids any Date.getDay() drift.
export function partsInTimeZone(date, timeZone = ORG_TIMEZONE_DEFAULT) {
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
export function localDateIso(date, timeZone = ORG_TIMEZONE_DEFAULT) {
  const p = partsInTimeZone(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

// Adds N days to a YYYY-MM-DD string, returns YYYY-MM-DD.
export function addDaysIso(dateIso, days) {
  // Anchor at noon UTC to dodge DST boundary drift; the date arithmetic
  // only needs day-precision, so the time-of-day is irrelevant.
  const d = new Date(`${dateIso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// TZ gate for weekly_sunday triggers: fire when local time is Sunday
// between 08:00:00 and 08:59:59 in the org timezone. Returns boolean.
export function isWeeklySundayWindow(now, timeZone = ORG_TIMEZONE_DEFAULT) {
  const p = partsInTimeZone(now, timeZone);
  return p.weekday === 'Sunday' && p.hour === 8;
}

// Compute the [period_start, period_end] for a weekly_digest anchored
// at `now`. period_start = today's local date (Sunday), period_end =
// Saturday 6 days later. Both YYYY-MM-DD.
export function weeklyDigestPeriod(now, timeZone = ORG_TIMEZONE_DEFAULT) {
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
export function buildWeeklyDigestDraftRow({ orgId, period, now }) {
  return {
    org_id: orgId,
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
    last_edited_at: now.toISOString(),
    last_edited_by: null,
  };
}

// Idempotency check args for a weekly_digest auto-draft. Returns the
// (org_id, kind, period_start) tuple a caller uses to look up an
// existing row before inserting.
export function weeklyDigestIdempotencyKey(orgId, periodStart) {
  return { org_id: orgId, kind: 'weekly_digest', period_start: periodStart };
}

export const ORG_TIMEZONE = ORG_TIMEZONE_DEFAULT;
