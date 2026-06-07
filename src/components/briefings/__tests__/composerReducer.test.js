import { describe, expect, it } from 'vitest';
import { composerReducer, INITIAL_STATE, reconcileAnchorForKind } from '../composerReducer';

// The composer is ONE screen — the step machinery (GO_FORWARD / GO_BACK /
// canAdvance / step{2,3}Valid / hydrateTargetStep) was retired in Part A1; its
// tests went with it. What remains is the live reducer behavior + the anchor
// reconcile that SET_KIND depends on.

describe('composerReducer', () => {
  it('SET_KIND populates kind + meta defaults', () => {
    const s = composerReducer(INITIAL_STATE, { type: 'SET_KIND', kind: 'weekly_digest', anchor_kind: 'org', audience_type: 'org_all' });
    expect(s.kind).toBe('weekly_digest');
    expect(s.anchor_kind).toBe('org');
    expect(s.audience_type).toBe('org_all');
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

  it('HYDRATE_DRAFT merges the draft payload (one-screen: no step targeting)', () => {
    const s = composerReducer(INITIAL_STATE, { type: 'HYDRATE_DRAFT', payload: { kind: 'announcement', anchor_kind: 'org', audience_type: 'org_all' } });
    expect(s.kind).toBe('announcement');
    expect(s.anchor_kind).toBe('org');
  });

  it('HYDRATE_DRAFT preserves a null anchor_id (broken draft recovers inline, no step jump)', () => {
    const s = composerReducer(INITIAL_STATE, {
      type: 'HYDRATE_DRAFT',
      payload: { kind: 'schedule_change', anchor_kind: 'event', anchor_id: null, audience_type: 'event_attendees', body: {}, signoff_message: '' },
    });
    expect(s.kind).toBe('schedule_change');
    expect(s.anchor_id).toBe(null);
  });

  // COMPOSE-FRONT P2: stale anchor must be cleared when switching to a kind
  // whose default anchor is org/null (e.g. a "Notify families" event-anchored
  // pre-fill → coach_roundup). Previously the `|| state` preserve kept the
  // mismatched event anchor_id in the draft.
  it('SET_KIND clears a stale event anchor when switching to an org-only kind', () => {
    const withAnchor = { ...INITIAL_STATE, anchor_kind: 'event', anchor_id: 'evt-stale' };
    const s = composerReducer(withAnchor, { type: 'SET_KIND', kind: 'coach_roundup', anchor_kind: 'event' });
    expect(s.kind).toBe('coach_roundup');
    expect(s.anchor_kind).toBe('org');
    expect(s.anchor_id).toBe(null);
  });

  it('SET_KIND preserves a valid anchor when the new kind supports it', () => {
    const withAnchor = { ...INITIAL_STATE, anchor_kind: 'event', anchor_id: 'evt-keep' };
    // custom_message accepts event anchors → keep it.
    const s = composerReducer(withAnchor, { type: 'SET_KIND', kind: 'custom_message', anchor_kind: 'event' });
    expect(s.anchor_kind).toBe('event');
    expect(s.anchor_id).toBe('evt-keep');
  });

  it('reconcileAnchorForKind drops the id for org/null defaults', () => {
    expect(reconcileAnchorForKind('coach_roundup', 'event', 'evt-x')).toEqual({ anchor_kind: 'org', anchor_id: null });
    expect(reconcileAnchorForKind('custom_message', 'team', 'team-x')).toEqual({ anchor_kind: 'team', anchor_id: 'team-x' });
  });

  it('RESET returns INITIAL_STATE', () => {
    const a = composerReducer(INITIAL_STATE, { type: 'SET_KIND', kind: 'announcement' });
    const b = composerReducer(a, { type: 'RESET' });
    expect(b).toEqual(INITIAL_STATE);
  });
});
