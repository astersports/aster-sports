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
function prescope(event, isPast, opts) {
  const url = new URL(composeFromEvent(event, isPast, opts), 'https://app.test');
  const { composerInit } = parseBriefingDeepLink(url.pathname, url.searchParams);
  return buildInitial({
    initialKind: composerInit.kind,
    initialAnchorKind: composerInit.anchor_kind,
    initialAnchorId: composerInit.anchor_id,
  });
}

const GAME = { id: 'evt-game-1', event_type: 'game', opponent: 'Rivals', team_id: 'team-7' };
const TOURNEY_EVENT = { id: 'evt-tourn-1', event_type: 'tournament', tournament_id: 'tour-9', team_id: 'team-7' };

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

  // "Notify families" (intent=notify) — general event-scoped announcement
  // (changed 2026-06-05). The kind+TEAM-anchor pair skips the cold picker and
  // lands at the Body step PRE-SCOPED to the event's team families (audience
  // 'team' + team_ids=[event.team_id]) — NOT org_all. This reuses the
  // "Message this team" entry point machinery (audienceFromAnchor +
  // reconcileAudienceForKind honoring the team pre-fill for announcement).
  it('NOTIFY upcoming game → announcement, Body step, team-scoped audience (not org_all)', () => {
    const s = prescope(GAME, false, { intent: 'notify' });
    expect(s.kind).toBe('announcement');
    expect(s.step).toBe(3); // not the cold Kind step
    expect(s.anchor_kind).toBe('team');
    expect(s.anchor_id).toBe('team-7');
    // The load-bearing assertion: audience pre-scopes to THIS team's families,
    // not the org_all default (announcement's KIND_METADATA default).
    expect(s.audience_type).toBe('team');
    expect(s.audience_type).not.toBe('org_all');
    expect(s.audience_filter).toEqual({ team_ids: ['team-7'] });
  });

  it('NOTIFY tournament event → announcement on the event TEAM (not the tournament)', () => {
    const s = prescope(TOURNEY_EVENT, false, { intent: 'notify' });
    expect(s.kind).toBe('announcement');
    expect(s.step).toBe(3);
    expect(s.anchor_kind).toBe('team');
    expect(s.anchor_id).toBe('team-7'); // the event's team, NOT tour-9
    expect(s.audience_type).toBe('team');
    expect(s.audience_filter).toEqual({ team_ids: ['team-7'] });
  });

  it('NOTIFY event WITHOUT team_id → announcement pre-selected, Kind step (admin picks scope)', () => {
    const noTeam = { id: 'evt-multi-1', event_type: 'tournament' };
    const s = prescope(noTeam, false, { intent: 'notify' });
    expect(s.kind).toBe('announcement');
    expect(s.step).toBe(1); // no anchor id → cannot skip to Body; admin scopes
    expect(s.audience_type).toBe('org_all'); // announcement's default when no anchor
  });
});
