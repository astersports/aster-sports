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

const ORG_TIMEZONE_DEFAULT = "America/New_York";

export interface DateParts {
  weekday: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export function partsInTimeZone(date: Date, timeZone: string = ORG_TIMEZONE_DEFAULT): DateParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone, weekday: "long", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    weekday: parts.weekday,
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour === "24" ? "00" : parts.hour),
    minute: Number(parts.minute),
  };
}

export function localDateIso(date: Date, timeZone: string = ORG_TIMEZONE_DEFAULT): string {
  const p = partsInTimeZone(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function addDaysIso(dateIso: string, days: number): string {
  const d = new Date(`${dateIso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isWeeklySundayWindow(now: Date, timeZone: string = ORG_TIMEZONE_DEFAULT): boolean {
  const p = partsInTimeZone(now, timeZone);
  return p.weekday === "Sunday" && p.hour === 8;
}

export interface WeeklyDigestPeriod {
  period_start: string;
  period_end: string;
}

export function weeklyDigestPeriod(now: Date, timeZone: string = ORG_TIMEZONE_DEFAULT): WeeklyDigestPeriod {
  const start = localDateIso(now, timeZone);
  const end = addDaysIso(start, 6);
  return { period_start: start, period_end: end };
}

export function buildWeeklyDigestDraftRow(
  { orgId, period, now, triggerId = null }: { orgId: string; period: WeeklyDigestPeriod; now: Date; triggerId?: string | null },
) {
  // body_html + body_plain are NOT NULL on comms_messages with no
  // default — empty strings are placeholders until admin previews via
  // the resolver-driven path (wave-4.2-A-8a). content_sections gets
  // [] to satisfy its NOT NULL constraint (default is '[]'::jsonb).
  // Subject stays NULL so admin preview shows the resolver-rendered
  // subject fresh at send time.
  return {
    org_id: orgId,
    created_by_trigger: triggerId,
    kind: "weekly_digest",
    anchor_kind: "org",
    anchor_id: orgId,
    period_start: period.period_start,
    period_end: period.period_end,
    status: "draft",
    subject: null,
    body_html: "",
    body_plain: "",
    content_sections: [],
    audience_type: "org_all",
    audience_filter: null,
    delivery_method: "queued",
    last_edited_at: now.toISOString(),
    last_edited_by: null,
  };
}

export const ORG_TIMEZONE = ORG_TIMEZONE_DEFAULT;
