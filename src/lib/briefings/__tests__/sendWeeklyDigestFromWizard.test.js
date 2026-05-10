// Wave 4.2-A-8d (P0 hotfix) — wizard state translator unit tests.

import { describe, expect, it, vi } from 'vitest';

vi.mock('../../digestSend', () => ({ sendWeeklyDigest: vi.fn(() => Promise.resolve({ composedFamilies: 7 })) }));

const { mapWizardStateToDigestArgs, sendWeeklyDigestFromWizard } = await import('../sendWeeklyDigestFromWizard');
const { sendWeeklyDigest } = await import('../../digestSend');

const baseState = (overrides = {}) => ({
  kind: 'weekly_digest', anchor_kind: 'org', anchor_id: 'o-1',
  audience_type: 'org_all', audience_filter: null,
  body: { body_notes: 'have a great week', ops_notes: 'sticker run' },
  signoff_message: 'Go team.', test_only: false, ...overrides,
});
const period = { start: new Date('2026-05-11T00:00:00Z'), end: new Date('2026-05-17T23:59:59Z') };
const recip = (gid, tids) => ({ guardian_id: gid, email: `${gid}@x`, team_ids: tids });
const ev = (id, team_id) => ({ id, team_id });
const COACHES = [{ display_name: 'Frank' }];

describe('mapWizardStateToDigestArgs', () => {
  it('1. body_notes / ops_notes / signoff flow from state to digest args', () => {
    const args = mapWizardStateToDigestArgs({
      state: baseState(), orgId: 'o-1', period,
      recipients: [recip('g1', ['t-1'])],
      events: [ev('e1', 't-1')],
      tournaments: [], teams: [{ id: 't-1' }], coaches: COACHES,
      rsvpCountsByEvent: new Map(),
    });
    expect(args.bodyNotes).toBe('have a great week');
    expect(args.opsNotes).toBe('sticker run');
    expect(args.signoffMessage).toBe('Go team.');
    expect(args.orgId).toBe('o-1');
    expect(args.period).toBe(period);
    expect(args.coaches).toBe(COACHES);
  });

  it('2. test_only flag flows through as testOnly', () => {
    const argsTrue = mapWizardStateToDigestArgs({
      state: baseState({ test_only: true }), orgId: 'o-1', period,
      recipients: [], events: [], tournaments: [], teams: [], coaches: [], rsvpCountsByEvent: new Map(),
    });
    expect(argsTrue.testOnly).toBe(true);
    const argsFalse = mapWizardStateToDigestArgs({
      state: baseState({ test_only: false }), orgId: 'o-1', period,
      recipients: [], events: [], tournaments: [], teams: [], coaches: [], rsvpCountsByEvent: new Map(),
    });
    expect(argsFalse.testOnly).toBe(false);
  });

  it('3. sendable filter drops families with no events on their teams', () => {
    const args = mapWizardStateToDigestArgs({
      state: baseState(), orgId: 'o-1', period,
      recipients: [recip('g1', ['t-1']), recip('g2', ['t-9'])],
      events: [ev('e1', 't-1')],
      tournaments: [], teams: [], coaches: [], rsvpCountsByEvent: new Map(),
    });
    expect(args.recipients).toHaveLength(1);
    expect(args.recipients[0].guardian_id).toBe('g1');
    expect(args.recipients[0].events).toHaveLength(1);
  });

  it('4. throws if state.kind !== weekly_digest', () => {
    expect(() => mapWizardStateToDigestArgs({
      state: baseState({ kind: 'game_recap' }), orgId: 'o-1', period,
      recipients: [], events: [], tournaments: [], teams: [], coaches: [], rsvpCountsByEvent: new Map(),
    })).toThrow(/expected kind=weekly_digest/);
  });

  it('5. throws if state is missing', () => {
    expect(() => mapWizardStateToDigestArgs({ orgId: 'o-1', period })).toThrow(/missing state/);
  });
});

describe('sendWeeklyDigestFromWizard', () => {
  it('6. delegates to sendWeeklyDigest with mapped args', async () => {
    vi.clearAllMocks();
    await sendWeeklyDigestFromWizard({
      state: baseState({ test_only: true }), orgId: 'o-1', period,
      recipients: [recip('g1', ['t-1'])],
      events: [ev('e1', 't-1')],
      tournaments: [], teams: [], coaches: COACHES, rsvpCountsByEvent: new Map(),
    });
    expect(sendWeeklyDigest).toHaveBeenCalledOnce();
    const args = sendWeeklyDigest.mock.calls[0][0];
    expect(args.testOnly).toBe(true);
    expect(args.bodyNotes).toBe('have a great week');
    expect(args.recipients).toHaveLength(1);
  });
});
