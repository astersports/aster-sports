import { describe, expect, it } from 'vitest';
import { assembleFamily, eligibleChildNames, programWindowOpen } from '../familyPrograms';

const kids = [
  { id: 'c', first_name: 'Charlie', last_name: 'S', grade: 5 },
  { id: 'm', first_name: 'Milo', last_name: 'S', grade: 2 },
];
const teams = [
  { id: 't1', name: '11U Girls', team_color: '#a78bfa', season_id: 'spring' },
  { id: 't2', name: '8U Boys', team_color: '#f59e0b', season_id: 'spring' },
];
const programs = [
  { id: 'spring', name: 'Spring 2026', program_type: 'season', is_published: false },
  { id: 'fall', name: 'Fall 2026 Tryouts', program_type: 'tryout', is_published: true,
    reg_opens_at: '2026-01-01T00:00:00Z', reg_closes_at: '2099-01-01T00:00:00Z',
    public_slug: 'fall-tryouts', divisions: [{ grade_min: 4, grade_max: 6 }] },
];

describe('assembleFamily', () => {
  it('shows the family balance as ONE number when the parent owns the account', () => {
    const out = assembleFamily({
      kids, teams, programs,
      roster: [{ player_id: 'c', team_id: 't1' }, { player_id: 'm', team_id: 't2' }],
      balances: [{ season_id: 'spring', balance_cents: 0, billed_cents: 107500, net_paid_cents: 107500 }],
    });
    // both kids in Spring 2026 -> ONE family balance row (deduped across children)
    const spring = out.familyBalances.filter((b) => b.programId === 'spring');
    expect(spring).toHaveLength(1);
    expect(spring[0].managed).toBe(false);
    expect(spring[0].balance.balance_cents).toBe(0);
  });

  it('renders the SEASON managed-by treatment when the parent has no own balance row (co-guardian gap)', () => {
    const out = assembleFamily({
      kids, teams, programs,
      roster: [{ player_id: 'c', team_id: 't1' }],
      balances: [], // co-guardian: account held by the other parent -> 0 rows
    });
    const spring = out.familyBalances.find((b) => b.programId === 'spring');
    expect(spring.managed).toBe(true);
    expect(spring.balance).toBeNull();
  });

  it('does NOT show a managed-by balance for a non-season program with no own balance (avoids false managed-by)', () => {
    const camp = { id: 'camp', name: 'Camp', program_type: 'camp', is_published: false };
    const out = assembleFamily({
      kids: [kids[0]], programs: [camp],
      teams: [{ id: 'tc', name: 'Camp Team', team_color: '#0f9d8c', season_id: 'camp' }],
      roster: [{ player_id: 'c', team_id: 'tc' }], balances: [],
    });
    expect(out.familyBalances).toHaveLength(0);
  });

  it('discovers open programs the family is not in, naming only grade-eligible children', () => {
    const out = assembleFamily({
      kids, teams, programs,
      roster: [{ player_id: 'c', team_id: 't1' }, { player_id: 'm', team_id: 't2' }],
      balances: [],
    });
    const fall = out.openPrograms.find((p) => p.id === 'fall');
    expect(fall).toBeTruthy();
    // grade band 4-6 -> Charlie (5) eligible, Milo (2) not
    expect(fall.eligibleChildren).toEqual(['Charlie']);
  });
});

describe('eligibleChildNames', () => {
  it('returns all children when the program has no grade bands', () => {
    expect(eligibleChildNames(kids, { divisions: [] })).toEqual(['Charlie', 'Milo']);
  });
});

describe('programWindowOpen', () => {
  it('is open inside the window and closed after it', () => {
    const now = new Date('2026-06-10T00:00:00Z');
    expect(programWindowOpen({ reg_opens_at: '2026-06-01T00:00:00Z', reg_closes_at: '2026-06-26T00:00:00Z' }, now)).toBe(true);
    expect(programWindowOpen({ reg_opens_at: '2026-01-01T00:00:00Z', reg_closes_at: '2026-06-01T00:00:00Z' }, now)).toBe(false);
  });
});
