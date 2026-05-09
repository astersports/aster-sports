import { describe, expect, it } from 'vitest';
import { canAdvance, composerReducer, INITIAL_STATE } from '../composerReducer';

describe('composerReducer', () => {
  it('SET_KIND populates kind + meta defaults', () => {
    const s = composerReducer(INITIAL_STATE, { type: 'SET_KIND', kind: 'weekly_digest', anchor_kind: 'org', audience_type: 'org_all' });
    expect(s.kind).toBe('weekly_digest');
    expect(s.anchor_kind).toBe('org');
    expect(s.audience_type).toBe('org_all');
  });

  it('GO_FORWARD blocked when no kind on step 1', () => {
    const s = composerReducer(INITIAL_STATE, { type: 'GO_FORWARD' });
    expect(s.step).toBe(1);
  });

  it('GO_FORWARD allowed once kind is set', () => {
    const a = composerReducer(INITIAL_STATE, { type: 'SET_KIND', kind: 'announcement', anchor_kind: 'org', audience_type: 'org_all' });
    const b = composerReducer(a, { type: 'GO_FORWARD' });
    expect(b.step).toBe(2);
  });

  it('GO_BACK never below step 1', () => {
    const s = composerReducer(INITIAL_STATE, { type: 'GO_BACK' });
    expect(s.step).toBe(1);
  });

  it('UPDATE_BODY merges patches', () => {
    const a = composerReducer(INITIAL_STATE, { type: 'UPDATE_BODY', patch: { a: 1 } });
    const b = composerReducer(a, { type: 'UPDATE_BODY', patch: { b: 2 } });
    expect(b.body).toEqual({ a: 1, b: 2 });
  });

  it('SET_SCHEDULED also flips send_mode', () => {
    const s = composerReducer(INITIAL_STATE, { type: 'SET_SCHEDULED', value: '2026-05-12T00:00:00Z' });
    expect(s.send_mode).toBe('scheduled');
    expect(s.scheduled_for).toBe('2026-05-12T00:00:00Z');
  });

  it('HYDRATE_DRAFT lands on step 3', () => {
    const s = composerReducer(INITIAL_STATE, { type: 'HYDRATE_DRAFT', payload: { kind: 'announcement', anchor_kind: 'org', audience_type: 'org_all' } });
    expect(s.step).toBe(3);
    expect(s.kind).toBe('announcement');
  });

  it('canAdvance gates step 2 on anchor + audience', () => {
    expect(canAdvance({ step: 2 })).toBe(false);
    expect(canAdvance({ step: 2, anchor_kind: 'team', audience_type: 'team' })).toBe(true);
  });

  it('RESET returns INITIAL_STATE', () => {
    const a = composerReducer(INITIAL_STATE, { type: 'SET_KIND', kind: 'announcement' });
    const b = composerReducer(a, { type: 'RESET' });
    expect(b).toEqual(INITIAL_STATE);
  });
});
