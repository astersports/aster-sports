import { describe, expect, it } from 'vitest';
import {
  buildGameResultRow,
  computePointDifferential,
  computeResult,
  EVENT_MATCH_WINDOW_MS,
  matchEvent,
  normalizeName,
  withinWindow,
} from '../ingestGameResultsHelpers.js';

describe('computeResult', () => {
  it('returns W/L/T from scores', () => {
    expect(computeResult(40, 31)).toBe('W');
    expect(computeResult(20, 33)).toBe('L');
    expect(computeResult(30, 30)).toBe('T');
  });
  it('returns null when a score is missing (unscored game)', () => {
    expect(computeResult(null, 10)).toBeNull();
    expect(computeResult(10, undefined)).toBeNull();
  });
});

describe('computePointDifferential', () => {
  it('is our − opponent, null when missing', () => {
    expect(computePointDifferential(40, 31)).toBe(9);
    expect(computePointDifferential(20, 33)).toBe(-13);
    expect(computePointDifferential(null, 5)).toBeNull();
  });
});

describe('withinWindow', () => {
  it('true within window, false outside, false on bad input', () => {
    const a = '2026-05-30T10:00:00Z';
    expect(withinWindow(a, '2026-05-30T12:00:00Z')).toBe(true); // 2h < 3h
    expect(withinWindow(a, '2026-05-30T14:30:00Z')).toBe(false); // 4.5h > 3h
    expect(withinWindow(a, 'not-a-date')).toBe(false);
  });
});

describe('normalizeName', () => {
  it('trims, collapses whitespace, lowercases', () => {
    expect(normalizeName('  Rim   Rattlers ')).toBe('rim rattlers');
    expect(normalizeName(null)).toBe('');
  });
});

describe('matchEvent (match-only, B2)', () => {
  const scraped = { opponent: 'Rim Rattlers', start_at: '2026-05-30T10:00:00Z' };
  it('matches on opponent + start within window', () => {
    const events = [
      { id: 'e1', opponent: 'Rim Rattlers', start_at: '2026-05-30T10:30:00Z' },
    ];
    expect(matchEvent(scraped, events)).toBe('e1');
  });
  it('returns null when no opponent matches (→ caller review-flags)', () => {
    const events = [{ id: 'e1', opponent: 'Other Team', start_at: '2026-05-30T10:00:00Z' }];
    expect(matchEvent(scraped, events)).toBeNull();
  });
  it('returns null when opponent matches but time is outside window', () => {
    const events = [{ id: 'e1', opponent: 'Rim Rattlers', start_at: '2026-05-30T20:00:00Z' }];
    expect(matchEvent(scraped, events)).toBeNull();
  });
  it('picks the closest event when several match', () => {
    const events = [
      { id: 'far', opponent: 'Rim Rattlers', start_at: '2026-05-30T12:30:00Z' },
      { id: 'near', opponent: 'Rim Rattlers', start_at: '2026-05-30T10:15:00Z' },
    ];
    expect(matchEvent(scraped, events)).toBe('near');
  });
});

describe('buildGameResultRow', () => {
  it('assembles the upsert row with derived result + differential', () => {
    const row = buildGameResultRow(
      { external_game_id: 'tm-123', opponent: 'Rim Rattlers', start_at: '2026-05-30T10:00:00Z', our_score: 38, opponent_score: 31 },
      'event-1',
      'org-1',
    );
    expect(row).toEqual({
      org_id: 'org-1',
      event_id: 'event-1',
      external_game_id: 'tm-123',
      our_score: 38,
      opponent_score: 31,
      result: 'W',
      point_differential: 7,
    });
  });
});

describe('constants', () => {
  it('event match window is 3h', () => {
    expect(EVENT_MATCH_WINDOW_MS).toBe(3 * 60 * 60 * 1000);
  });
});
