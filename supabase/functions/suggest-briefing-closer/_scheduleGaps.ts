// Wave 5 PR 3b — Deno mirror of src/lib/briefings/scheduleGaps.js
// per anti-pattern #30. Used by index.ts to build prompt context
// describing same-day gaps in the tournament schedule.
//
// CRITICAL: keep this file in sync with the .js source. Tests live
// in src/lib/briefings/__tests__/scheduleGaps.test.js.

type EvRow = { start_at?: string; end_at?: string | null; opponent?: string | null };

const pad2 = (n: number) => String(n).padStart(2, "0");
const toEt = (iso: string) => new Date(new Date(iso).getTime() - 4 * 60 * 60 * 1000);

function fmtClock(d: Date): string {
  let h = d.getUTCHours(); const m = d.getUTCMinutes();
  const am = h < 12; if (h === 0) h = 12; else if (h > 12) h -= 12;
  return `${h}:${pad2(m)} ${am ? "AM" : "PM"}`;
}

function dayKey(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function humanGap(min: number): string {
  if (min < 60) return `${min}-min gap`;
  const h = Math.floor(min / 60); const m = min % 60;
  return m === 0 ? `${h}-hour gap` : `${h}h ${m}m gap`;
}

// Phase 3 audit P0-1 mirror fix — accept the same optional
// { minGapMinutes } parameter as src/lib/briefings/scheduleGaps.js.
// Pre-fix the mirror hardcoded 30; if any future caller passed
// a different threshold, vitest would pass but production would
// silently ignore the override.
const DEFAULT_GAME_MINUTES = 60;
const MIN_GAP_MINUTES = 30;

export function describeScheduleGaps(events: EvRow[], { minGapMinutes = MIN_GAP_MINUTES }: { minGapMinutes?: number } = {}): string {
  const valid = (events || []).filter((e) => e && e.start_at).slice()
    .sort((a, b) => new Date(a.start_at!).getTime() - new Date(b.start_at!).getTime());
  if (!valid.length) return "";
  const byDay = new Map<string, { ev: EvRow; startEt: Date }[]>();
  for (const ev of valid) {
    const startEt = toEt(ev.start_at!); const k = dayKey(startEt);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push({ ev, startEt });
  }
  const lines: string[] = [];
  for (const [, dayEvents] of byDay) {
    const dayLabel = dayEvents[0].startEt.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
    const segments: string[] = [];
    for (let i = 0; i < dayEvents.length; i++) {
      const { ev, startEt } = dayEvents[i];
      segments.push(`${fmtClock(startEt)}${ev.opponent ? ` vs ${ev.opponent}` : ""}`);
      const next = dayEvents[i + 1];
      if (next) {
        const endMs = ev.end_at ? new Date(ev.end_at).getTime() : new Date(ev.start_at!).getTime() + DEFAULT_GAME_MINUTES * 60 * 1000;
        const gap = Math.round((new Date(next.ev.start_at!).getTime() - endMs) / 60000);
        if (gap >= minGapMinutes) segments.push(`[${humanGap(gap)}]`);
      }
    }
    lines.push(`${dayLabel}: ${segments.join(" → ")}`);
  }
  return lines.join("\n");
}
