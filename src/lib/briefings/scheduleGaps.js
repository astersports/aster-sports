// Wave 5 PR 3a — pure utility for describing time gaps between
// scheduled events. Used as prompt context for the LLM-suggested
// closer (PR 3b) and is independently consumable by briefing
// bodies that want to call out lunch breaks, rest gaps, etc.
//
// Pure function: same input → same output. No DB, no IO, no clock
// reads. Caller passes events with start_at + end_at (or just
// start_at + a fallback duration).

const DEFAULT_GAME_MINUTES = 60;
const MIN_GAP_MINUTES = 30;

function pad2(n) { return String(n).padStart(2, '0'); }

function formatClock(date) {
  let h = date.getUTCHours(); const m = date.getUTCMinutes();
  const am = h < 12; if (h === 0) h = 12; else if (h > 12) h -= 12;
  return `${h}:${pad2(m)} ${am ? 'AM' : 'PM'}`;
}

function dayKey(date) {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

function humanGap(minutes) {
  if (minutes < 60) return `${minutes}-min gap`;
  const h = Math.floor(minutes / 60); const m = minutes % 60;
  if (m === 0) return `${h}-hour gap`;
  return `${h}h ${m}m gap`;
}

// Convert ISO timestamp → Date in ET (UTC-4 for May 2026, fixed for
// now per scheduleValidation.js). For prompt-context use, the
// hour-of-day is what matters; we render the ET wall-clock so the
// LLM closer can reference "lunch at 11" naturally.
function toEt(iso) {
  const utcMs = new Date(iso).getTime();
  return new Date(utcMs - 4 * 60 * 60 * 1000);
}

export function describeScheduleGaps(events, { minGapMinutes = MIN_GAP_MINUTES } = {}) {
  const valid = (events || []).filter((e) => e && e.start_at).slice()
    .sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  if (!valid.length) return '';

  const byDay = new Map();
  for (const ev of valid) {
    const startEt = toEt(ev.start_at);
    const key = dayKey(startEt);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push({ ev, startEt });
  }

  const lines = [];
  for (const [, dayEvents] of byDay) {
    if (dayEvents.length === 0) continue;
    const dayLabel = dayEvents[0].startEt.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
    const segments = [];
    for (let i = 0; i < dayEvents.length; i++) {
      const { ev, startEt } = dayEvents[i];
      const opp = ev.opponent ? ` vs ${ev.opponent}` : '';
      segments.push(`${formatClock(startEt)}${opp}`);
      const next = dayEvents[i + 1];
      if (next) {
        const endMs = ev.end_at ? new Date(ev.end_at).getTime() : new Date(ev.start_at).getTime() + DEFAULT_GAME_MINUTES * 60 * 1000;
        const gap = Math.round((new Date(next.ev.start_at).getTime() - endMs) / 60000);
        if (gap >= minGapMinutes) segments.push(`[${humanGap(gap)}]`);
      }
    }
    lines.push(`${dayLabel}: ${segments.join(' → ')}`);
  }
  return lines.join('\n');
}
