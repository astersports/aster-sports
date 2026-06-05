// composeFromEvent — event-type × timing → compose deep-link mapping.
// Locks the contextual pre-scope so the event-detail hero "Compose briefing"
// action never dumps the admin on the cold kind picker.

import { describe, expect, it } from 'vitest';
import { composeFromEvent } from '../composeFromEvent';

const GAME = { id: 'evt-game-1', event_type: 'game', opponent: 'Rivals' };
const TOURNEY_EVENT = { id: 'evt-tourn-1', event_type: 'tournament', tournament_id: 'tour-9' };

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

describe('composeFromEvent — intent=notify forces schedule_change on the event', () => {
  it('UPCOMING game + notify → schedule_change anchored on the event', () => {
    expect(composeFromEvent(GAME, false, { intent: 'notify' }))
      .toBe('/admin/briefings/compose?anchor=event&id=evt-game-1&kind=schedule_change');
  });

  it('PAST game + notify → schedule_change anchored on the event (kind not past-dependent)', () => {
    expect(composeFromEvent(GAME, true, { intent: 'notify' }))
      .toBe('/admin/briefings/compose?anchor=event&id=evt-game-1&kind=schedule_change');
  });

  it('tournament event + notify → schedule_change on the EVENT anchor (not the tournament)', () => {
    // Notify = "this event changed", so the anchor is the event, not the
    // tournament — even though the cold-compose path would anchor the
    // tournament for recap/prelim.
    expect(composeFromEvent(TOURNEY_EVENT, false, { intent: 'notify' }))
      .toBe('/admin/briefings/compose?anchor=event&id=evt-tourn-1&kind=schedule_change');
  });

  it('null event + notify → null (no link)', () => {
    expect(composeFromEvent(null, false, { intent: 'notify' })).toBeNull();
  });
});
