import { describe, expect, it } from 'vitest';
import { filterRecipientsByTeams } from '../recipientFilter';

const RECIPIENTS = [
  { guardian_id: 'g1', email: 'a@x', team_ids: ['t-11g', 't-8b'] },
  { guardian_id: 'g2', email: 'b@x', team_ids: ['t-8b'] },
  { guardian_id: 'g3', email: 'c@x', team_ids: ['t-10blue'] },
  { guardian_id: 'g4', email: 'd@x', team_ids: ['t-10blue'] },
  { guardian_id: 'g5', email: 'e@x', team_ids: ['t-10black', 't-11g'] },
];

describe('filterRecipientsByTeams', () => {
  it('null teamIds is pass-through (org_all)', () => {
    expect(filterRecipientsByTeams(RECIPIENTS, null)).toHaveLength(5);
  });
  it('empty teamIds returns no recipients', () => {
    expect(filterRecipientsByTeams(RECIPIENTS, [])).toEqual([]);
  });
  it('single team filters by overlap', () => {
    const out = filterRecipientsByTeams(RECIPIENTS, ['t-10blue']);
    expect(out.map((r) => r.guardian_id)).toEqual(['g3', 'g4']);
  });
  it('multi team unions across overlap', () => {
    const out = filterRecipientsByTeams(RECIPIENTS, ['t-10blue', 't-10black']);
    expect(out.map((r) => r.guardian_id).sort()).toEqual(['g3', 'g4', 'g5']);
  });
  it('guardian on multiple teams matches if any overlap', () => {
    const out = filterRecipientsByTeams(RECIPIENTS, ['t-11g']);
    expect(out.map((r) => r.guardian_id).sort()).toEqual(['g1', 'g5']);
  });
  it('defensive: missing recipients returns empty', () => {
    expect(filterRecipientsByTeams(undefined, ['t-anything'])).toEqual([]);
    expect(filterRecipientsByTeams(null, null)).toEqual([]);
  });
  it('defensive: recipient with no team_ids is excluded', () => {
    const r = [{ guardian_id: 'g0', email: 'z@x' }, ...RECIPIENTS.slice(0, 1)];
    const out = filterRecipientsByTeams(r, ['t-11g']);
    expect(out.map((g) => g.guardian_id)).toEqual(['g1']);
  });
});
