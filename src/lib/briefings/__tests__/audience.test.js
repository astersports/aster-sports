import { describe, expect, it } from 'vitest';
import { audienceCopy, computeAudience, countByAudienceType } from '../audience';

const team10UBlue = 'team-10u-blue';
const team10UBlack = 'team-10u-black';

const PILOT_RECIPIENTS = [
  { guardian_id: 'g1', team_ids: ['team-11u-girls', 'team-8u-boys'] },
  { guardian_id: 'g2', team_ids: ['team-8u-boys'] },
];
const FULL_RECIPIENTS = [
  ...PILOT_RECIPIENTS,
  { guardian_id: 'g3', team_ids: [team10UBlue] },
  { guardian_id: 'g4', team_ids: [team10UBlue] },
  { guardian_id: 'g5', team_ids: [team10UBlack, 'team-11u-girls'] },
];

describe('countByAudienceType', () => {
  it('returns null when audienceType missing', () => {
    expect(countByAudienceType({ recipients: FULL_RECIPIENTS })).toBe(null);
  });
  it('org_all returns recipient count', () => {
    expect(countByAudienceType({ recipients: FULL_RECIPIENTS, audienceType: 'org_all' })).toBe(5);
  });
  it('team filters by anchor when audienceFilter has no team_id', () => {
    expect(countByAudienceType({ recipients: FULL_RECIPIENTS, audienceType: 'team', anchorId: team10UBlue })).toBe(2);
  });
  it('team prefers audienceFilter.team_id when present', () => {
    expect(countByAudienceType({ recipients: FULL_RECIPIENTS, audienceType: 'team', audienceFilter: { team_id: team10UBlack }, anchorId: team10UBlue })).toBe(1);
  });
  it('multi_team unions across teams', () => {
    expect(countByAudienceType({ recipients: FULL_RECIPIENTS, audienceType: 'multi_team', audienceFilter: { team_ids: [team10UBlue, team10UBlack] } })).toBe(3);
  });
  // 5d-b-1 backward-compat shim assertions:
  // TeamGroupedPicker writes audience_filter.team_ids[] (plural). Old
  // drafts saved pre-5d-b-1 carry audience_filter.team_id (singular).
  // countByAudienceType must accept both shapes for the 'team' type.
  it('5d-b-1: team mode reads audienceFilter.team_ids[] (new shape)', () => {
    expect(countByAudienceType({ recipients: FULL_RECIPIENTS, audienceType: 'team', audienceFilter: { team_ids: [team10UBlue] } })).toBe(2);
  });
  it('5d-b-1: team mode falls back to audienceFilter.team_id (legacy singular)', () => {
    expect(countByAudienceType({ recipients: FULL_RECIPIENTS, audienceType: 'team', audienceFilter: { team_id: team10UBlue } })).toBe(2);
  });
  it('5d-b-1: team mode — team_ids[] wins over team_id when both present', () => {
    expect(countByAudienceType({ recipients: FULL_RECIPIENTS, audienceType: 'team', audienceFilter: { team_ids: [team10UBlack], team_id: team10UBlue } })).toBe(1);
  });
});

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

describe('audienceCopy (wave 4.1d-2 §3.1 — direct copy without "Settings → Communications" deeplink, no target route exists yet)', () => {
  it('pilot_zero copy explains 0 filter and how to disable', () => {
    const copy = audienceCopy({ filtered: 0, total: 21, mode: 'pilot_zero' });
    expect(copy).toContain('Pilot Mode is filtering');
    expect(copy).toContain('0 pilot families');
    expect(copy).toContain('out of 21');
    expect(copy).toContain('Disable pilot mode');
    expect(copy).toContain('send to all 21');
  });

  it('pilot_partial copy mentions both numbers', () => {
    const copy = audienceCopy({ filtered: 2, total: 24, mode: 'pilot_partial' });
    expect(copy).toContain('Pilot Mode is ON');
    expect(copy).toContain('sending to 2 pilot families');
    expect(copy).toContain('out of 24');
    expect(copy).toContain('send to all 24');
  });

  it('Wave 4.3-L — noun is "pilot families" not "pilot guardians" in pilot_zero/pilot_partial', () => {
    // Families is the right audience unit; each family has 1-2 guardians.
    // Wave 4.3-L renames the noun in both pilot_zero + pilot_partial.
    const zero = audienceCopy({ filtered: 0, total: 22, mode: 'pilot_zero' });
    const partial = audienceCopy({ filtered: 3, total: 102, mode: 'pilot_partial' });
    expect(zero).not.toContain('pilot guardians');
    expect(partial).not.toContain('pilot guardians');
    expect(zero).toContain('pilot families');
    expect(partial).toContain('pilot families');
  });

  it('Wave 4.3-L — pilot_test_override tail explicitly says "all N families"', () => {
    // Compose · Body banner consistency — total is the dormant-family
    // universe; copy now suffixes "families" so admins don't read "all 102"
    // as ambiguous (could be guardians, families, etc.).
    const copy = audienceCopy({ filtered: 5, total: 102, mode: 'pilot_test_override', testRecipientEmail: 'admin@legacyhoopers.org' });
    expect(copy).toContain('all 102 families');
    expect(copy).not.toContain('pilot guardians');
    expect(copy).not.toContain('out of 102');
  });

  it('Wave 4.1d-2 §3.1 — pilot_zero "Disable pilot mode" guidance is direct, no broken deeplink', () => {
    // No more "Settings → Communications" anchor since the route doesn't
    // exist yet; copy is direct and actionable.
    const copy = audienceCopy({ filtered: 0, total: 12, mode: 'pilot_zero' });
    expect(copy).not.toContain('Settings → Communications');
    expect(copy).toContain('Disable pilot mode');
  });

  it('standard copy is the simple Will send line', () => {
    expect(audienceCopy({ filtered: 5, mode: 'standard' })).toBe('Will send to 5 families.');
    expect(audienceCopy({ filtered: 1, mode: 'standard' })).toBe('Will send to 1 family.');
  });

  it('null filtered → Computing audience…', () => {
    expect(audienceCopy({ filtered: null, mode: 'standard' })).toBe('Computing audience…');
  });

  it('Wave 4.3-K — pilot_test_override copy names the test recipient and dormant family count separately', () => {
    const copy = audienceCopy({ filtered: 5, total: 102, mode: 'pilot_test_override', testRecipientEmail: 'admin@legacyhoopers.org' });
    expect(copy).toContain('Pilot test mode');
    expect(copy).toContain('admin@legacyhoopers.org');
    expect(copy).toContain('5 team views');
    expect(copy).toContain('Disable pilot mode');
    expect(copy).toContain('all 102');
  });

  it('Wave 4.3-K — pilot_test_override singular: 1 team view', () => {
    const copy = audienceCopy({ filtered: 1, total: 102, mode: 'pilot_test_override', testRecipientEmail: 'admin@legacyhoopers.org' });
    expect(copy).toContain('1 team view');
    expect(copy).not.toContain('1 team views');
  });

  it('Wave 4.3-K — pilot_test_override copy falls back to admin@ when email not provided', () => {
    const copy = audienceCopy({ filtered: 1, mode: 'pilot_test_override' });
    expect(copy).toContain('admin@');
  });
});
