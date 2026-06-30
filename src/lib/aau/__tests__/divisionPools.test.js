import { describe, expect, it } from 'vitest';
import { groupTeamsByPool } from '../divisionPools';

describe('groupTeamsByPool', () => {
  it('splits teams into pools, preserving first-seen pool order and within-pool order', () => {
    const teams = [
      { name: 'Pelham Hustle', pool: 'National Orange', wins: 2 },
      { name: 'High Rise - Will', pool: 'National Orange', wins: 0 },
      { name: 'LI All Stars', pool: 'One Day Only', wins: 2 },
    ];
    const groups = groupTeamsByPool(teams);
    expect(groups.map((g) => g.pool)).toEqual(['National Orange', 'One Day Only']);
    expect(groups[0].teams.map((t) => t.name)).toEqual(['Pelham Hustle', 'High Rise - Will']);
    expect(groups[1].teams).toHaveLength(1);
  });

  it('collapses pool-less teams into a single null-pool group', () => {
    const groups = groupTeamsByPool([{ name: 'A' }, { name: 'B' }]);
    expect(groups).toHaveLength(1);
    expect(groups[0].pool).toBeNull();
    expect(groups[0].teams).toHaveLength(2);
  });

  it('tolerates empty / non-array input', () => {
    expect(groupTeamsByPool([])).toEqual([]);
    expect(groupTeamsByPool(null)).toEqual([]);
  });
});
