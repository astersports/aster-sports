import { describe, expect, it } from 'vitest';
import { composerReducer, INITIAL_STATE } from '../composerReducer';

describe('composerReducer — wave 3.13 anchor + filter actions', () => {
  it('SET_KIND_FILTER stores the filter array', () => {
    const s = composerReducer(INITIAL_STATE, { type: 'SET_KIND_FILTER', payload: ['game_recap', 'announcement'] });
    expect(s.kindFilter).toEqual(['game_recap', 'announcement']);
  });

  it('SET_KIND_FILTER with empty payload clears the filter', () => {
    const a = composerReducer(INITIAL_STATE, { type: 'SET_KIND_FILTER', payload: ['x'] });
    const b = composerReducer(a, { type: 'SET_KIND_FILTER', payload: null });
    expect(b.kindFilter).toBeNull();
  });

  it('CLEAR_ANCHOR resets anchor_kind + anchor_id', () => {
    const seeded = { ...INITIAL_STATE, anchor_kind: 'event', anchor_id: 'evt-1' };
    const s = composerReducer(seeded, { type: 'CLEAR_ANCHOR' });
    expect(s.anchor_kind).toBeNull();
    expect(s.anchor_id).toBeNull();
  });

  it('CLEAR_ANCHOR preserves kind + audience_type so admin can re-anchor without reselecting', () => {
    const seeded = { ...INITIAL_STATE, anchor_kind: 'event', anchor_id: 'evt-1', kind: 'announcement', audience_type: 'team' };
    const s = composerReducer(seeded, { type: 'CLEAR_ANCHOR' });
    expect(s.kind).toBe('announcement');
    expect(s.audience_type).toBe('team');
  });
});
