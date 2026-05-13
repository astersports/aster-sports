// Wave 4.2-A-8d (P0 hotfix) — pure mapping function unit tests.
// Split from sendWeeklyDigestFromWizard.test.js for the 150-line cap.

import { describe, expect, it } from 'vitest';
import { mapWizardStateToDigestArgs } from '../sendWeeklyDigestFromWizard';
import { baseState, COACHES, ev, period, recip } from './_sendWizardFixtures';

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

// Wave 4.3-K — anchor enforcement + pilot test scope picker.
describe('Wave 4.3-K — audience anchor + pilot scope picker', () => {
  it('audience_type=team narrows events to anchor team only (multi-team family)', () => {
    // Family has kids on both 11U Girls and 8U Boys. Anchor = team:11U Girls.
    // Pre-4.3-K the recipient kept BOTH teams' events. Post-fix the audience
    // anchor restricts the attached events to the 11U Girls slice only.
    const args = mapWizardStateToDigestArgs({
      state: baseState({ audience_type: 'team', anchor_id: 't-11u', audience_filter: { team_id: 't-11u' } }),
      orgId: 'o-1', period,
      recipients: [recip('g1', ['t-11u', 't-8u'])],
      events: [ev('e1', 't-11u'), ev('e2', 't-8u')],
      tournaments: [], teams: [], coaches: COACHES, rsvpCountsByEvent: new Map(),
    });
    expect(args.audienceTeamIds).toEqual(['t-11u']);
    expect(args.recipients).toHaveLength(1);
    expect(args.recipients[0].events.map((e) => e.id)).toEqual(['e1']);
  });

  it('audience_type=org_all passes audienceTeamIds=null and keeps all team events', () => {
    const args = mapWizardStateToDigestArgs({
      state: baseState({ audience_type: 'org_all' }),
      orgId: 'o-1', period,
      recipients: [recip('g1', ['t-11u', 't-8u'])],
      events: [ev('e1', 't-11u'), ev('e2', 't-8u')],
      tournaments: [], teams: [], coaches: COACHES, rsvpCountsByEvent: new Map(),
    });
    expect(args.audienceTeamIds).toBeNull();
    expect(args.recipients[0].events.map((e) => e.id).sort()).toEqual(['e1', 'e2']);
  });

  it('pilot_test_scope_team_id narrows synthetic recipients to one team', () => {
    // 5 synthetic per-team rows. Picker scope = 11U Girls only.
    const synthetics = ['t-11u', 't-10b', 't-10u', 't-9u', 't-8u'].map((tid) =>
      ({ guardian_id: null, email: 'admin@x', team_ids: [tid] }));
    const args = mapWizardStateToDigestArgs({
      state: baseState({ pilot_test_scope_team_id: 't-11u' }),
      orgId: 'o-1', period,
      recipients: synthetics,
      events: [ev('e1', 't-11u'), ev('e2', 't-10b'), ev('e3', 't-10u'), ev('e4', 't-9u'), ev('e5', 't-8u')],
      tournaments: [], teams: [], coaches: COACHES, rsvpCountsByEvent: new Map(),
    });
    expect(args.recipients).toHaveLength(1);
    expect(args.recipients[0].team_ids).toEqual(['t-11u']);
  });

  it('pilot test scope picker leaves real guardians alone', () => {
    // Mixed: 5 synthetic + 2 real. Picker scope = 11U Girls.
    // Synthetics filtered to 1 (11U Girls). Real guardians always survive.
    const synthetics = ['t-11u', 't-10b'].map((tid) => ({ guardian_id: null, email: 'admin@x', team_ids: [tid] }));
    const reals = [recip('g1', ['t-11u']), recip('g2', ['t-10b'])];
    const args = mapWizardStateToDigestArgs({
      state: baseState({ pilot_test_scope_team_id: 't-11u' }),
      orgId: 'o-1', period,
      recipients: [...synthetics, ...reals],
      events: [ev('e1', 't-11u'), ev('e2', 't-10b')],
      tournaments: [], teams: [], coaches: COACHES, rsvpCountsByEvent: new Map(),
    });
    // synthetic survivor + 2 real guardians = 3 (no anchor filter)
    expect(args.recipients).toHaveLength(3);
    expect(args.recipients.filter((r) => r.guardian_id == null)).toHaveLength(1);
  });
});
