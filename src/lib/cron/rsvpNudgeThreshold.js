// Stream B RSVP-nudge threshold pure logic (vitest source of truth).
//
// AP #30 mirror: byte-near-identical to
// supabase/functions/briefing-auto-draft-tick/_rsvpNudgeThreshold.ts (the Deno
// mirror the edge function imports). When you change one, change BOTH in the
// same commit. Logic uses only standard ES so the two stay in sync.
//
// Stream B (§16.5): the rsvp_nudge auto-draft fires when an upcoming game has
// fewer than N confirmed "going" RSVPs ("you need 5 to field a game").
// Operator-locked 2026-06-05: replaced the prior "<70% coverage of active
// roster" model with this absolute "going floor". The draft lands in the Radar
// for admin review — NOTHING auto-sends to families.

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

// The draft decision: nudge when fewer than `threshold` players have confirmed
// going. A game with exactly `threshold` going does NOT nudge.
export function shouldNudgeLowGoing(goingCount, threshold) {
  return goingCount < threshold;
}
