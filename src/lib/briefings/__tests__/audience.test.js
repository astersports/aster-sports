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

describe('audienceCopy', () => {
  it('pilot_zero copy mentions Settings → Communications', () => {
    const copy = audienceCopy({ filtered: 0, total: 21, mode: 'pilot_zero' });
    expect(copy).toContain('21 families on roster');
    expect(copy).toContain('Pilot mode is ON');
    expect(copy).toContain('Settings → Communications');
    expect(copy).toContain('send to all 21');
  });

  it('pilot_partial copy mentions both numbers', () => {
    const copy = audienceCopy({ filtered: 2, total: 24, mode: 'pilot_partial' });
    expect(copy).toContain('24 families on roster');
    expect(copy).toContain('sending to 2 pilot guardians');
  });

  it('standard copy is the simple Will send line', () => {
    expect(audienceCopy({ filtered: 5, mode: 'standard' })).toBe('Will send to 5 families.');
    expect(audienceCopy({ filtered: 1, mode: 'standard' })).toBe('Will send to 1 family.');
  });

  it('null filtered → Computing audience…', () => {
    expect(audienceCopy({ filtered: null, mode: 'standard' })).toBe('Computing audience…');
  });
});
