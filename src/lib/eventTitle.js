import { TYPE_LABELS } from './constants';

// Cluster 3 (CC §2 ACTIVE BUGS) — single render path for event titles
// across all surfaces. Computed deterministically from event fields
// rather than echoing the free-text `event.title` column.
//
// Why computed-not-stored: the ledger (Cluster 3.1) catalogued ad-hoc
// title appendages in production ("9U Boys Game", "10U Blue · 6th
// Boro 4AB · May Reschedule") that drifted because nothing constrained
// `event.title` to a canonical shape. Every render site composed its
// own fallback chain; some appended team name redundantly, some
// stripped prefixes inconsistently, some didn't.
//
// Contract:
//   - Game / tournament with opponent → "vs. {opponent}" or
//     "@ {opponent}" based on event.home_away.
//   - Otherwise → typeLabel from TYPE_LABELS (Practice, Workout, etc.)
//   - `event.title` is intentionally NOT consulted. Existing free-text
//     titles in DB don't surface through this helper. Migration 021
//     (queued separately) handles data hygiene; this helper prevents
//     regression at the render layer.
//
// Returns { prefix, body } so callers can color-code the prefix
// independently or render a flat string via formatEventTitleString.
//
// Drift-hedge: src/lib/__tests__/eventTitleAudit.test.js asserts no
// JSX file outside this module recomposes the inline `vs. ${opponent}`
// pattern.

export function formatEventTitle(event) {
  if (!event) return { prefix: '', body: '' };
  const typeLabel = TYPE_LABELS[event.event_type] || event.event_type || 'Event';
  const isGameLike = event.event_type === 'game' || event.event_type === 'tournament';
  if (isGameLike && event.opponent) {
    const prefix = event.home_away === 'away' ? '@ ' : 'vs. ';
    return { prefix, body: event.opponent };
  }
  // Tournament anchor (no opponent yet): show the tournament's name, not
  // a bare type label — preserves the MatchupCard treatment (2026-05-20)
  // now that the Games tab rides EventCard (PR-V3).
  if (isGameLike && event.tournament_name) {
    return { prefix: '', body: event.tournament_name };
  }
  return { prefix: '', body: typeLabel };
}

export function formatEventTitleString(event) {
  const { prefix, body } = formatEventTitle(event);
  return `${prefix}${body}`;
}
