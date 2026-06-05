// Stream A event-reminder pure logic (vitest source of truth).
//
// AP #30 mirror: byte-near-identical to
// supabase/functions/briefing-auto-draft-tick/_reminderLogic.ts (the Deno
// mirror the edge function imports). When you change one, change BOTH in the
// same commit. Logic uses only standard ES + Intl so the two stay in sync.
//
// Stream A (§16.5 + D1 lock): automatic "don't forget your event"
// reminders at a 3-day / 2-day / 1-day / 4-hour cadence (72h/48h/24h/4h).
// These are transactional, direct-send (push + email) — NOT the editorial
// briefing pipeline.

export const REMINDER_OFFSETS = [
  { bucket: '72h', ms: 72 * 3600000 },
  { bucket: '48h', ms: 48 * 3600000 },
  { bucket: '24h', ms: 24 * 3600000 },
  { bucket: '4h', ms: 4 * 3600000 },
];

const ET = 'America/New_York';

// Quiet hours: 21:00–06:59 ET. A reminder whose threshold passes overnight
// holds until the 07:00 ET tick (the dedup log keeps it from double-firing).
export function isQuietHoursET(now, tz = ET) {
  const hh = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', hour12: false }).format(now);
  const h = Number(hh) % 24;
  return h >= 21 || h < 7;
}

// Decide which single offset to SEND now for one event, collapsing a burst
// (e.g. an event created already inside the window) down to the most-urgent
// passed offset. Older passed offsets are returned as `superseded` so the
// caller logs them as already-handled and they never fire late.
//
// Returns null when nothing is due (event already started, or no offset
// threshold reached yet, or all passed offsets already logged).
export function decideReminder(startAtMs, nowMs, loggedBuckets = []) {
  if (nowMs >= startAtMs) return null;
  const logged = new Set(loggedBuckets);
  const passed = REMINDER_OFFSETS
    .filter((o) => !logged.has(o.bucket) && nowMs >= startAtMs - o.ms)
    .sort((a, b) => a.ms - b.ms);
  if (passed.length === 0) return null;
  return { sendBucket: passed[0].bucket, supersededBuckets: passed.slice(1).map((o) => o.bucket) };
}

const WHEN_PHRASE = { '72h': 'in 3 days', '48h': 'in 2 days', '24h': 'tomorrow', '4h': 'in 4 hours' };

// Build the reminder content for one event + offset. Pure: same input ->
// deeply-equal output. All time formatting is timeZone-pinned (AP #43).
export function composeReminder(event, sendBucket, tz = ET) {
  const start = new Date(event.start_at);
  const day = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' }).format(start);
  const time = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(start);
  const when = WHEN_PHRASE[sendBucket] || 'soon';
  const matchup = event.opponent ? `vs ${event.opponent}` : (event.title || 'Game');
  const place = [event.location, event.sub_location].filter(Boolean).join(' · ');
  const arrive = event.arrival_minutes_before ? `Arrive ${event.arrival_minutes_before} min early.` : '';
  const jersey = event.jersey ? `Jersey: ${event.jersey}.` : '';

  const title = `Reminder: ${matchup} ${when}`;
  const whenLine = `${day} · ${time}${place ? ' · ' + place : ''}`;
  const tail = [arrive, jersey].filter(Boolean).join(' ');
  const pushBody = [whenLine, tail].filter(Boolean).join(' — ');
  const subject = `${matchup} ${when} — ${time}`;
  const plain = [title, whenLine, tail].filter(Boolean).join('\n');
  const html = reminderHtml(title, whenLine, tail);
  return { title, pushBody, subject, plain, html };
}

function reminderHtml(title, whenLine, tail) {
  const c = '#4a8fd4';
  return `<div style="max-width:480px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;border:2px solid ${c};border-radius:6px;overflow:hidden;background:#ffffff;">`
    + `<div style="background:${c};padding:14px 16px;"><span style="font-size:16px;font-weight:700;color:#ffffff;">${esc(title)}</span></div>`
    + `<div style="padding:14px 16px;"><div style="font-size:15px;font-weight:700;color:#1a1a2e;">${esc(whenLine)}</div>`
    + (tail ? `<div style="font-size:13px;color:#555555;margin-top:6px;">${esc(tail)}</div>` : '')
    + `</div></div>`;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
