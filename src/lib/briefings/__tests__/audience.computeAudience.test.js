import { describe, expect, it } from 'vitest';
import { computeAudience } from '../audience';
import { FULL_RECIPIENTS, PILOT_RECIPIENTS, team10UBlack, team10UBlue } from './_audienceFixtures';

describe('computeAudience pilot mode states', () => {
  it('pilot_zero — pilot ON, 0 pilot recipients, total > 0', () => {
    const result = computeAudience({
      recipientsFiltered: [],
      recipientsTotal: [{ guardian_id: 'g1', team_ids: [team10UBlue] }],
      audienceType: 'org_all',
      pilotModeOn: true,
    });
    expect(result.mode).toBe('pilot_zero');
    expect(result.filtered).toBe(0);
    expect(result.total).toBe(1);
  });

  it('pilot_partial — pilot ON, filtered < total, both > 0', () => {
    const result = computeAudience({
      recipientsFiltered: PILOT_RECIPIENTS,
      recipientsTotal: FULL_RECIPIENTS,
      audienceType: 'org_all',
      pilotModeOn: true,
    });
    expect(result.mode).toBe('pilot_partial');
    expect(result.filtered).toBe(2);
    expect(result.total).toBe(5);
  });

  it('standard — pilot OFF', () => {
    const result = computeAudience({
      recipientsFiltered: FULL_RECIPIENTS,
      recipientsTotal: FULL_RECIPIENTS,
      audienceType: 'org_all',
      pilotModeOn: false,
    });
    expect(result.mode).toBe('standard');
    expect(result.filtered).toBe(5);
  });

  it('standard — pilot ON but filtered === total (everyone is a pilot guardian)', () => {
    const result = computeAudience({
      recipientsFiltered: FULL_RECIPIENTS,
      recipientsTotal: FULL_RECIPIENTS,
      audienceType: 'org_all',
      pilotModeOn: true,
    });
    expect(result.mode).toBe('standard');
  });

  it('empty roster — filtered=0, total=0 → standard mode (no pilot trap)', () => {
    const result = computeAudience({
      recipientsFiltered: [],
      recipientsTotal: [],
      audienceType: 'org_all',
      pilotModeOn: true,
    });
    expect(result.mode).toBe('standard');
    expect(result.filtered).toBe(0);
    expect(result.total).toBe(0);
  });

  // Wave 4.3-I: pilot_test_recipient_email override.
  // RPC emits a single synthetic row with guardian_id=null when override
  // is configured + p_pilot_only=true. Surfaces as 'pilot_test_override'
  // mode. Distinct from pilot_partial (real pilot families) and standard
  // (production sends).
  it('Wave 4.3-L — pilot_test_override detection handles N synthetic rows (post-4.3-J fan-out)', () => {
    // RPC emits one row per team when override active. Before 4.3-L the
    // detection checked length === 1 — N rows fell through to pilot_partial
    // mode and the wizard rendered "1 pilot guardians (out of 22)" copy on
    // the Body step instead of "Pilot test mode — sending to admin@".
    const synthetic5 = ['t1', 't2', 't3', 't4', 't5'].map((tid) => ({
      guardian_id: null, email: 'admin@legacyhoopers.org', team_ids: [tid],
    }));
    const result = computeAudience({
      recipientsFiltered: synthetic5,
      recipientsTotal: FULL_RECIPIENTS,
      audienceType: 'org_all',
      pilotModeOn: true,
    });
    expect(result.mode).toBe('pilot_test_override');
    expect(result.filtered).toBe(5);
    expect(result.testRecipientEmail).toBe('admin@legacyhoopers.org');
  });

  it('Wave 4.3-L — mixed synthetic + real does NOT trigger pilot_test_override', () => {
    // Defense in depth: if a future flow accidentally mixes a synthetic row
    // into a real-guardian list, the every() predicate fails and we fall
    // back to standard/pilot_partial. Prevents accidental admin@ routing.
    const mixed = [
      { guardian_id: null, email: 'admin@x', team_ids: ['t1'] },
      { guardian_id: 'g1', email: 'g1@x', team_ids: ['t1'] },
    ];
    const result = computeAudience({
      recipientsFiltered: mixed,
      recipientsTotal: FULL_RECIPIENTS,
      audienceType: 'org_all',
      pilotModeOn: true,
    });
    expect(result.mode).not.toBe('pilot_test_override');
  });

  it('pilot_test_override — single synthetic row with guardian_id=null', () => {
    const synthetic = [{ guardian_id: null, email: 'admin@legacyhoopers.org', team_ids: ['t1', 't2', 't3', 't4', 't5'] }];
    const result = computeAudience({
      recipientsFiltered: synthetic,
      recipientsTotal: FULL_RECIPIENTS,
      audienceType: 'org_all',
      pilotModeOn: true,
    });
    expect(result.mode).toBe('pilot_test_override');
    expect(result.filtered).toBe(1);
    expect(result.total).toBe(5);
    expect(result.testRecipientEmail).toBe('admin@legacyhoopers.org');
  });

  it('pilot_test_override — passes team-scoped audience filter', () => {
    // Synthetic row has team_ids covering ALL org teams so any audience
    // scope (org_all, team, multi_team) still resolves filtered=1.
    const synthetic = [{ guardian_id: null, email: 'admin@legacyhoopers.org', team_ids: [team10UBlue, team10UBlack] }];
    const result = computeAudience({
      recipientsFiltered: synthetic,
      recipientsTotal: FULL_RECIPIENTS,
      audienceType: 'team',
      anchorId: team10UBlue,
      pilotModeOn: true,
    });
    expect(result.mode).toBe('pilot_test_override');
    expect(result.filtered).toBe(1);
  });

  it('Bug B reality — 21 total guardians on 10U Blue, 0 pilot', () => {
    const total = Array.from({ length: 21 }, (_, i) => ({ guardian_id: `g${i}`, team_ids: [team10UBlue] }));
    const result = computeAudience({
      recipientsFiltered: [],
      recipientsTotal: total,
      audienceType: 'team',
      anchorId: team10UBlue,
      pilotModeOn: true,
    });
    expect(result.mode).toBe('pilot_zero');
    expect(result.filtered).toBe(0);
    expect(result.total).toBe(21);
  });
});
