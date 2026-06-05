import { describe, expect, it } from 'vitest';
import { canAdvance, composerReducer, hydrateTargetStep, INITIAL_STATE, reconcileAnchorForKind, step2Valid } from '../composerReducer';

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

  it('HYDRATE_DRAFT lands on step 3 for a fully-formed org-anchored draft', () => {
    const s = composerReducer(INITIAL_STATE, { type: 'HYDRATE_DRAFT', payload: { kind: 'announcement', anchor_kind: 'org', audience_type: 'org_all' } });
    expect(s.step).toBe(3);
    expect(s.kind).toBe('announcement');
  });

  it('canAdvance gates step 2 on anchor + audience (org never needs id)', () => {
    expect(canAdvance({ step: 2 })).toBe(false);
    expect(canAdvance({ step: 2, anchor_kind: 'org', audience_type: 'org_all' })).toBe(true);
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

// Wave 4.1b — Bug A: anchor_id is required when anchor_kind is one of
// event / tournament / team. Org never requires an id.
describe('Wave 4.1b §1 — Bug A: step 2 anchor_id validation', () => {
  it.each([
    ['event', 'schedule_change', 'event_attendees'],
    ['tournament', 'tournament_prelim', 'tournament_attendees'],
    ['team', 'announcement', 'team'],
  ])('Next disabled when anchor_kind=%s but anchor_id is null', (anchorKind, kind, audienceType) => {
    const s = { ...INITIAL_STATE, step: 2, kind, anchor_kind: anchorKind, audience_type: audienceType, anchor_id: null };
    expect(canAdvance(s)).toBe(false);
    expect(step2Valid(s)).toBe(false);
  });

  it('Next enabled when anchor_kind requires id AND id is set', () => {
    const s = { ...INITIAL_STATE, step: 2, kind: 'schedule_change', anchor_kind: 'event', audience_type: 'event_attendees', anchor_id: 'evt-uuid' };
    expect(canAdvance(s)).toBe(true);
  });

  it('Next enabled when anchor_kind=org regardless of id', () => {
    const s = { ...INITIAL_STATE, step: 2, kind: 'weekly_digest', anchor_kind: 'org', audience_type: 'org_all', anchor_id: null };
    expect(canAdvance(s)).toBe(true);
  });
});

// Wave 4.1b — Bug C: HYDRATE_DRAFT targets the earliest invalid step
// so admins can recover broken drafts (the d526bbef class) without
// guessing where the missing field is.
describe('Wave 4.1b §3 — Bug C: hydration step targeting', () => {
  it('hydrateTargetStep → 1 when no kind', () => {
    expect(hydrateTargetStep({ kind: null, anchor_kind: 'event', anchor_id: 'x' })).toBe(1);
  });

  it('hydrateTargetStep → 2 when kind set but step2 invalid (anchor_id null)', () => {
    expect(hydrateTargetStep({ kind: 'schedule_change', anchor_kind: 'event', audience_type: 'event_attendees', anchor_id: null })).toBe(2);
  });

  it('hydrateTargetStep → 3 when fully valid', () => {
    expect(hydrateTargetStep({ kind: 'schedule_change', anchor_kind: 'event', audience_type: 'event_attendees', anchor_id: 'evt-uuid' })).toBe(3);
  });

  it('HYDRATE_DRAFT lands on step 2 for the broken d526bbef-style draft', () => {
    const next = composerReducer(INITIAL_STATE, {
      type: 'HYDRATE_DRAFT',
      payload: { kind: 'schedule_change', anchor_kind: 'event', anchor_id: null, audience_type: 'event_attendees', body: {}, signoff_message: '' },
    });
    expect(next.step).toBe(2);
    expect(next.kind).toBe('schedule_change');
    expect(next.anchor_id).toBe(null);
  });
});
