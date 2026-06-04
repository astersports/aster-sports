// AI-2 facts extraction (option i). Locks the resolver-context -> flat facts
// mapping + the narrative override field per anchored kind.

import { describe, expect, it } from 'vitest';
import { AI_DRAFT_FIELD, anchoredFacts } from '../anchoredAiFacts';

describe('anchoredAiFacts', () => {
  it('game_recap narrative fills coach_note', () => {
    expect(AI_DRAFT_FIELD.game_recap).toBe('coach_note');
  });

  it('extracts game_recap facts from resolver context (trims, formats final)', () => {
    const ctx = {
      team: { name: '11U Girls' },
      event: { opponent: ' Storm Blue ' },
      game_result: { our_score: 42, opponent_score: 38, result: 'W' },
      player_of_game: { first_name: 'Sara' },
      location: { name: 'WCC' },
    };
    expect(anchoredFacts('game_recap', ctx)).toEqual({
      Team: '11U Girls', Opponent: 'Storm Blue', Final: '42-38 (W)',
      'Player of the game': 'Sara', Venue: 'WCC',
    });
  });

  it('omits missing facts rather than inventing them', () => {
    expect(anchoredFacts('game_recap', { team: { name: '10U' }, game_result: {} })).toEqual({ Team: '10U' });
  });

  it('unknown kind or null context -> empty', () => {
    expect(anchoredFacts('weekly_digest', { x: 1 })).toEqual({});
    expect(anchoredFacts('game_recap', null)).toEqual({});
  });
});
