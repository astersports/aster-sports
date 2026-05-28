// Stream A event-reminder pure logic (Deno mirror).
//
// AP #30 mirror: byte-near-identical to src/lib/cron/eventReminders.js (the
// vitest-covered source of truth). When you change one, change BOTH in the
// same commit. Logic uses only standard ES + Intl so the two stay in sync.
//
// Stream A (§16.5): automatic "don't forget your event" reminders at a
// 3-day / 1-day / 4-hour cadence. These are transactional, direct-send
// (push + email) — NOT the editorial briefing pipeline.

export const REMINDER_OFFSETS = [
  { bucket: "72h", ms: 72 * 3600000 },
  { bucket: "24h", ms: 24 * 3600000 },
  { bucket: "4h", ms: 4 * 3600000 },
];

const ET = "America/New_York";

export function isQuietHoursET(now: Date, tz = ET): boolean {
  const hh = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "2-digit", hour12: false }).format(now);
  const h = Number(hh) % 24;
  return h >= 21 || h < 7;
}

export function decideReminder(
  startAtMs: number, nowMs: number, loggedBuckets: string[] = [],
): { sendBucket: string; supersededBuckets: string[] } | null {
  if (nowMs >= startAtMs) return null;
  const logged = new Set(loggedBuckets);
  const passed = REMINDER_OFFSETS
    .filter((o) => !logged.has(o.bucket) && nowMs >= startAtMs - o.ms)
    .sort((a, b) => a.ms - b.ms);
  if (passed.length === 0) return null;
  return { sendBucket: passed[0].bucket, supersededBuckets: passed.slice(1).map((o) => o.bucket) };
}

const WHEN_PHRASE: Record<string, string> = { "72h": "in 3 days", "24h": "tomorrow", "4h": "in 4 hours" };

export function composeReminder(event: any, sendBucket: string, tz = ET) {
  const start = new Date(event.start_at);
  const day = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric" }).format(start);
  const time = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(start);
  const when = WHEN_PHRASE[sendBucket] || "soon";
  const matchup = event.opponent ? `vs ${event.opponent}` : (event.title || "Game");
  const place = [event.location, event.sub_location].filter(Boolean).join(" · ");
  const arrive = event.arrival_minutes_before ? `Arrive ${event.arrival_minutes_before} min early.` : "";
  const jersey = event.jersey ? `Jersey: ${event.jersey}.` : "";

  const title = `Reminder: ${matchup} ${when}`;
  const whenLine = `${day} · ${time}${place ? " · " + place : ""}`;
  const tail = [arrive, jersey].filter(Boolean).join(" ");
  const pushBody = [whenLine, tail].filter(Boolean).join(" — ");
  const subject = `${matchup} ${when} — ${time}`;
  const plain = [title, whenLine, tail].filter(Boolean).join("\n");
  const html = reminderHtml(title, whenLine, tail);
  return { title, pushBody, subject, plain, html };
}

function reminderHtml(title: string, whenLine: string, tail: string): string {
  const c = "#4a8fd4";
  return `<div style="max-width:480px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;border:2px solid ${c};border-radius:6px;overflow:hidden;background:#ffffff;">`
    + `<div style="background:${c};padding:14px 16px;"><span style="font-size:16px;font-weight:700;color:#ffffff;">${esc(title)}</span></div>`
    + `<div style="padding:14px 16px;"><div style="font-size:15px;font-weight:700;color:#1a1a2e;">${esc(whenLine)}</div>`
    + (tail ? `<div style="font-size:13px;color:#555555;margin-top:6px;">${esc(tail)}</div>` : "")
    + `</div></div>`;
}

function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
