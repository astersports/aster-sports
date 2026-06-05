// Cross-surface invariant (CLAUDE.md AP #43) — composing FROM a game/event
// must land the admin PRE-SCOPED to that event for the defaulted kind, not on
// the cold kind picker.
//
// Walks the full deep-link pipeline the way production does:
//   composeFromEvent(event, isPast)            (EventHeroActions navigates here)
//     -> parseBriefingDeepLink(path, params)   (useBriefingDeepLink on the page)
//       -> buildInitial(composerInit)          (BriefingComposer initial state)
//
// Asserts the resulting reducer state lands on the Body step (step 3) with the
// anchored game/tournament already selected — no re-selecting the game the
// admin came from.

import { describe, expect, it } from 'vitest';
import { composeFromEvent } from '../../../lib/briefings/composeFromEvent';
import { parseBriefingDeepLink } from '../../../hooks/useBriefingDeepLink';
import { buildInitial } from '../briefingComposerHelpers';

// Mirror BriefingsComposePage: feed the deep-link's composerInit into
// buildInitial with the same field names BriefingComposer uses.
function prescope(event, isPast) {
  const url = new URL(composeFromEvent(event, isPast), 'https://app.test');
  const { composerInit } = parseBriefingDeepLink(url.pathname, url.searchParams);
  return buildInitial({
    initialKind: composerInit.kind,
    initialAnchorKind: composerInit.anchor_kind,
    initialAnchorId: composerInit.anchor_id,
  });
}

const GAME = { id: 'evt-game-1', event_type: 'game', opponent: 'Rivals' };
const TOURNEY_EVENT = { id: 'evt-tourn-1', event_type: 'tournament', tournament_id: 'tour-9' };

describe('compose-from-event pre-scope (AP #43)', () => {
  it('PAST game → game_recap, Body step, event anchor pre-selected', () => {
    const s = prescope(GAME, true);
    expect(s.kind).toBe('game_recap');
    expect(s.step).toBe(3); // not the cold Kind step
    expect(s.anchor_kind).toBe('event');
    // GameRecapBody reads anchorId to resolve THIS game — pre-selected, no
    // re-pick.
    expect(s.anchor_id).toBe('evt-game-1');
    expect(s.audience_type).toBe('event_attendees');
  });

  it('UPCOMING tournament event → tournament_prelim, Body step, tournament anchor pre-selected', () => {
    const s = prescope(TOURNEY_EVENT, false);
    expect(s.kind).toBe('tournament_prelim');
    expect(s.step).toBe(3);
    expect(s.anchor_kind).toBe('tournament');
    expect(s.anchor_id).toBe('tour-9');
    expect(s.audience_type).toBe('tournament_attendees');
  });

  it('PAST tournament event → tournament_recap, Body step, tournament anchor pre-selected', () => {
    const s = prescope(TOURNEY_EVENT, true);
    expect(s.kind).toBe('tournament_recap');
    expect(s.step).toBe(3);
    expect(s.anchor_kind).toBe('tournament');
    expect(s.anchor_id).toBe('tour-9');
    expect(s.audience_type).toBe('tournament_attendees');
  });

  it('UPCOMING game (ambiguous) → event anchor pre-set, Kind step with chips (no forced kind)', () => {
    const s = prescope(GAME, false);
    expect(s.kind).toBeNull();        // chips shown, admin picks
    expect(s.step).toBe(1);
    expect(s.anchor_kind).toBe('event');
    expect(s.anchor_id).toBe('evt-game-1'); // anchor still carried, not lost
  });
});
