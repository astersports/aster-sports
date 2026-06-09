// Stream B RSVP-nudge threshold pure logic (Deno mirror).
//
// AP #30 mirror: byte-near-identical to src/lib/cron/rsvpNudgeThreshold.js (the
// vitest-covered source of truth). When you change one, change BOTH in the
// same commit. Logic uses only standard ES so the two stay in sync.
//
// Stream B (§16.5): the rsvp_nudge auto-draft fires when an upcoming game
// within the proximity window has fewer than N confirmed "going" RSVPs
// ("you need 5 to field a game"). Operator-locked 2026-06-05: replaced the
// prior "<70% coverage of active roster" model with this absolute "going
// floor". The draft lands in the Radar for admin review — NOTHING auto-sends
// to families.

// Event-proximity window: only games starting within this many hours of now
// are eligible for a short-roster nudge. Operator-widened 2026-06-05 from 24h
// to 48h — more lead time to rally players for a short-rostered game.
export const RSVP_NUDGE_WINDOW_HOURS = 48;

// Default floor: 5 confirmed going to field a game. Used when
// organizations.auto_notifications.rsvp_min_going is unset.
export const RSVP_MIN_GOING_DEFAULT = 5;

// Read the per-org minimum-going floor from the organizations.auto_notifications
// JSONB. Mirrors the `reminders_enabled !== false` default-when-unset pattern
// the same column already uses: an unset / null / non-positive-integer value
// falls back to RSVP_MIN_GOING_DEFAULT. Accepts the parsed JSONB object (or
// null/undefined on a read miss).
export function rsvpMinGoingThreshold(autoNotifications) {
  const raw = autoNotifications?.rsvp_min_going;
  return Number.isInteger(raw) && raw > 0 ? raw : RSVP_MIN_GOING_DEFAULT;
}

// Stream B master on/off switch. UNLIKE Stream A reminders (which fail-OPEN /
// default-ON via `reminders_enabled !== false`), Stream B nudges default OFF:
// they draft ONLY when an admin has explicitly opted in via
// auto_notifications.rsvp_nudges_enabled === true. Operator-ratified 2026-06-09
// (FORK A): an auto-draft nudge stream needs an explicit operator opt-in, so
// an empty {} / unset / read-miss org config means OFF (fail-closed).
export function rsvpNudgesEnabled(autoNotifications) {
  return autoNotifications?.rsvp_nudges_enabled === true;
}

// The draft decision: nudge when fewer than `threshold` players have confirmed
// going. A game with exactly `threshold` going does NOT nudge.
export function shouldNudgeLowGoing(goingCount, threshold) {
  return goingCount < threshold;
}

// The upper bound (ISO string) of the event-proximity window: now +
// RSVP_NUDGE_WINDOW_HOURS. Games with start_at > now and <= this bound are
// eligible. Keeping it pure here lets vitest cover the window edge without the
// edge function's Supabase client.
export function nudgeWindowEndIso(now) {
  return new Date(now.getTime() + RSVP_NUDGE_WINDOW_HOURS * 3600000).toISOString();
}
