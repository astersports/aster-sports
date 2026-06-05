// composeFromEvent — event-type × timing → compose deep-link mapping.
// Locks the contextual pre-scope so the event-detail hero "Compose briefing"
// action never dumps the admin on the cold kind picker.

import { describe, expect, it } from 'vitest';
import { composeFromEvent } from '../composeFromEvent';

const GAME = { id: 'evt-game-1', event_type: 'game', opponent: 'Rivals', team_id: 'team-7' };
const TOURNEY_EVENT = { id: 'evt-tourn-1', event_type: 'tournament', tournament_id: 'tour-9', team_id: 'team-7' };

describe('composeFromEvent — event-type × timing default kind', () => {
  it('PAST tournament event → tournament_recap anchored on the tournament', () => {
    expect(composeFromEvent(TOURNEY_EVENT, true))
      .toBe('/admin/briefings/compose?anchor=tournament&id=tour-9&kind=tournament_recap');
  });

  it('UPCOMING tournament event → tournament_prelim anchored on the tournament', () => {
    expect(composeFromEvent(TOURNEY_EVENT, false))
      .toBe('/admin/briefings/compose?anchor=tournament&id=tour-9&kind=tournament_prelim');
  });

  it('PAST regular game → game_recap anchored on the event', () => {
    expect(composeFromEvent(GAME, true))
      .toBe('/admin/briefings/compose?anchor=event&id=evt-game-1&kind=game_recap');
  });

  it('UPCOMING regular game → event anchor, NO kind (ambiguous — chips drive)', () => {
    // Flagged-ambiguous case: pre-scope the anchor, do not force a kind.
    expect(composeFromEvent(GAME, false))
      .toBe('/admin/briefings/compose?anchor=event&id=evt-game-1');
  });

  it('tournament event WITHOUT tournament_id falls back to the event anchor (no kind)', () => {
    const orphan = { id: 'evt-tourn-2', event_type: 'tournament' };
    expect(composeFromEvent(orphan, false))
      .toBe('/admin/briefings/compose?anchor=event&id=evt-tourn-2');
    expect(composeFromEvent(orphan, true))
      .toBe('/admin/briefings/compose?anchor=event&id=evt-tourn-2');
  });

  it('null / id-less event → null (no link)', () => {
    expect(composeFromEvent(null, false)).toBeNull();
    expect(composeFromEvent({ event_type: 'game' }, true)).toBeNull();
  });
});

describe('composeFromEvent — intent=notify → team-scoped announcement', () => {
  // Changed 2026-06-05: "Notify families" is now a general event-scoped
  // announcement (works immediately, no edit-diff), anchored on the event's
  // TEAM so the audience pre-scopes to that team's families (not org_all).
  it('UPCOMING game + notify → announcement anchored on the event team', () => {
    expect(composeFromEvent(GAME, false, { intent: 'notify' }))
      .toBe('/admin/briefings/compose?anchor=team&id=team-7&kind=announcement');
  });

  it('PAST game + notify → announcement anchored on the event team (kind not past-dependent)', () => {
    expect(composeFromEvent(GAME, true, { intent: 'notify' }))
      .toBe('/admin/briefings/compose?anchor=team&id=team-7&kind=announcement');
  });

  it('tournament event + notify → announcement on the event TEAM (not the tournament)', () => {
    // Notify scopes to the event's families; the team anchor carries that
    // scope even when the cold-compose path would anchor the tournament.
    expect(composeFromEvent(TOURNEY_EVENT, false, { intent: 'notify' }))
      .toBe('/admin/briefings/compose?anchor=team&id=team-7&kind=announcement');
  });

  it('event WITHOUT team_id + notify → announcement, no team anchor (admin picks scope)', () => {
    const noTeam = { id: 'evt-multi-1', event_type: 'tournament' };
    expect(composeFromEvent(noTeam, false, { intent: 'notify' }))
      .toBe('/admin/briefings/compose?kind=announcement');
  });

  it('null event + notify → null (no link)', () => {
    expect(composeFromEvent(null, false, { intent: 'notify' })).toBeNull();
  });
});
