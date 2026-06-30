// dedupeTeams / aauTeamLabel — Hub search helpers (R1·PR-A). Locks the
// one-card-per-team dedup (the tap-cancellation fix) and the distinguishing label.

import { describe, expect, it } from 'vitest';
import { aauTeamLabel, dedupeTeams } from '../aauSearch';

describe('dedupeTeams', () => {
  it('collapses the same teamKey across tournaments into one entry with a count', () => {
    const teams = [
      { teamKey: 'legacy hoopers:F:5th', name: 'Legacy Hoopers', tournamentName: 'A' },
      { teamKey: 'legacy hoopers:F:5th', name: 'Legacy Hoopers', tournamentName: 'B' },
      { teamKey: 'legacy hoopers:M:4th', name: 'Legacy Hoopers', tournamentName: 'A' },
    ];
    const out = dedupeTeams(teams);
    expect(out).toHaveLength(2);
    expect(out[0].teamKey).toBe('legacy hoopers:F:5th');
    expect(out[0].tournamentCount).toBe(2);
    expect(out[1].tournamentCount).toBe(1);
    expect(out[0].tournamentName).toBe('A'); // first occurrence kept
  });

  it('keeps keyless rows individually and tolerates empty/non-array input', () => {
    expect(dedupeTeams([{ name: 'X' }, { name: 'Y' }])).toHaveLength(2);
    expect(dedupeTeams(null)).toEqual([]);
  });
});

describe('aauTeamLabel', () => {
  it('appends gender + grade to distinguish same-club teams', () => {
    expect(aauTeamLabel({ name: 'Legacy Hoopers', gender: 'F', gradeLabel: '5th' })).toBe('Legacy Hoopers · Girls 5th');
    expect(aauTeamLabel({ name: 'Legacy Hoopers', gender: 'M', gradeLabel: '4th' })).toBe('Legacy Hoopers · Boys 4th');
  });

  it('falls back to the bare name when gender/grade are absent', () => {
    expect(aauTeamLabel({ name: 'Legacy Hoopers 3AB' })).toBe('Legacy Hoopers 3AB');
    expect(aauTeamLabel({})).toBe('Team');
  });
});
