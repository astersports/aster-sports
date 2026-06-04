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

  it('games_recap narrative fills coach_note; extracts record + per-game lines', () => {
    expect(AI_DRAFT_FIELD.games_recap).toBe('coach_note');
    const ctx = {
      summary: { record: '1-1' },
      games: [
        { day_label: 'Sat', team_name: '10U Blue', our_score: 24, opponent_score: 30, opponent: '6th Boro', result: 'L' },
        { day_label: 'Sun', team_name: '10U Blue', our_score: 40, opponent_score: 20, opponent: 'Storm', result: 'W' },
      ],
    };
    expect(anchoredFacts('games_recap', ctx)).toEqual({
      Record: '1-1',
      Games: 'Sat 10U Blue 24-30 vs 6th Boro (L); Sun 10U Blue 40-20 vs Storm (W)',
    });
  });

  it('tournament_recap narrative fills coach_reflection; extracts placement + records', () => {
    expect(AI_DRAFT_FIELD.tournament_recap).toBe('coach_reflection');
    const ctx = {
      tournament: { name: 'ZG Chase for the Chain NY' },
      tournament_teams: [
        { team_name: '11U Girls', wins: 3, losses: 1, final_place: 2 },
        { team_name: '10U Black', wins: 2, losses: 2, final_place: null },
      ],
    };
    expect(anchoredFacts('tournament_recap', ctx)).toEqual({
      Tournament: 'ZG Chase for the Chain NY',
      Results: '11U Girls 3-1 (2nd); 10U Black 2-2',
    });
  });

  it('unknown kind or null context -> empty', () => {
    expect(anchoredFacts('weekly_digest', { x: 1 })).toEqual({});
    expect(anchoredFacts('game_recap', null)).toEqual({});
  });
});
