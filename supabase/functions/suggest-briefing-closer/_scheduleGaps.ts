// Wave 5 PR 3b — Deno mirror of src/lib/briefings/scheduleGaps.js
// per anti-pattern #30. Used by index.ts to build prompt context
// describing same-day gaps in the tournament schedule.
//
// CRITICAL: keep this file in sync with the .js source. Tests live
// in src/lib/briefings/__tests__/scheduleGaps.test.js.

type EvRow = { start_at?: string; end_at?: string | null; opponent?: string | null };

const DEFAULT_GAME_MINUTES = 60;
const MIN_GAP_MINUTES = 30;

function pad2(n: number) { return String(n).padStart(2, '0'); }

function formatClock(date: Date) {
  let h = date.getUTCHours(); const m = date.getUTCMinutes();
  const am = h < 12; if (h === 0) h = 12; else if (h > 12) h -= 12;
  return `${h}:${pad2(m)} ${am ? 'AM' : 'PM'}`;
}

function dayKey(date: Date) {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

function humanGap(minutes: number) {
  if (minutes < 60) return `${minutes}-min gap`;
  const h = Math.floor(minutes / 60); const m = minutes % 60;
  if (m === 0) return `${h}-hour gap`;
  return `${h}h ${m}m gap`;
}

// Convert ISO timestamp → a Date whose UTC fields hold the ET wall-clock
// (so the getUTC* readers in formatClock/dayKey below yield ET parts).
// For prompt-context use, the hour-of-day is what matters; we render the
// ET wall-clock so the LLM closer can reference "lunch at 11" naturally.
// DST-correct: derives the ET offset for the given instant via Intl
// (America/New_York) instead of a literal -4h, so EST (winter) is right.
const ET_PARTS_FMT = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
});
function toEt(iso: string) {
  const parts = ET_PARTS_FMT.formatToParts(new Date(iso));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  let hour = get('hour'); if (hour === 24) hour = 0;
  return new Date(Date.UTC(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second')));
}

export function describeScheduleGaps(events: EvRow[], { minGapMinutes = MIN_GAP_MINUTES }: { minGapMinutes?: number } = {}) {
  const valid = (events || []).filter((e) => e && e.start_at).slice()
    .sort((a, b) => new Date(a.start_at!).getTime() - new Date(b.start_at!).getTime());
  if (!valid.length) return '';

  const byDay = new Map<string, { ev: EvRow; startEt: Date }[]>();
  for (const ev of valid) {
    const startEt = toEt(ev.start_at!);
    const key = dayKey(startEt);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push({ ev, startEt });
  }

  const lines: string[] = [];
  for (const [, dayEvents] of byDay) {
    if (dayEvents.length === 0) continue;
    const dayLabel = dayEvents[0].startEt.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
    const segments: string[] = [];
    for (let i = 0; i < dayEvents.length; i++) {
      const { ev, startEt } = dayEvents[i];
      const opp = ev.opponent ? ` vs ${ev.opponent}` : '';
      segments.push(`${formatClock(startEt)}${opp}`);
      const next = dayEvents[i + 1];
      if (next) {
        const endMs = ev.end_at ? new Date(ev.end_at).getTime() : new Date(ev.start_at!).getTime() + DEFAULT_GAME_MINUTES * 60 * 1000;
        const gap = Math.round((new Date(next.ev.start_at!).getTime() - endMs) / 60000);
        if (gap >= minGapMinutes) segments.push(`[${humanGap(gap)}]`);
      }
    }
    lines.push(`${dayLabel}: ${segments.join(' → ')}`);
  }
  return lines.join('\n');
}
