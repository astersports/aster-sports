import { describe, expect, it } from 'vitest';
import { dependencySummary } from '../programDelete';

describe('dependencySummary (F14 delete confirm)', () => {
  it('pluralizes each count independently', () => {
    expect(dependencySummary({ teams: 1, players: 32, events: 0 })).toBe('1 team, 32 roster rows, 0 events');
    expect(dependencySummary({ teams: 5, players: 1, events: 8 })).toBe('5 teams, 1 roster row, 8 events');
  });
  it('defaults missing counts to zero', () => {
    expect(dependencySummary()).toBe('0 teams, 0 roster rows, 0 events');
    expect(dependencySummary({ teams: 2 })).toBe('2 teams, 0 roster rows, 0 events');
  });
});
