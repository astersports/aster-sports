import { describe, expect, it } from 'vitest';
import { defaultValue, validate } from '../GamesRecapBody';

describe('GamesRecapBody exports (games_recap G1 PR C)', () => {
  it('defaultValue: empty event_ids + text fields', () => {
    expect(defaultValue).toEqual({ event_ids: [], our_highlights: '', coach_note: '' });
  });

  it('validate requires at least one selected game', () => {
    expect(validate({ event_ids: [] })).toContain('Pick at least one game.');
    expect(validate({})).toHaveLength(1);
    expect(validate(null)).toHaveLength(1);
    expect(validate({ event_ids: ['e1', 'e2'] })).toEqual([]);
  });
});
