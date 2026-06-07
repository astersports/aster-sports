import { describe, expect, it } from 'vitest';
import { groupPrograms, programBadge } from '../programGrouping';

const today = new Date('2026-06-06T12:00:00Z');

describe('groupPrograms (PR-3 index)', () => {
  const programs = [
    { id: 's', name: 'Spring 2026', status: 'active', startDate: '2026-03-23' },
    { id: 'c', name: 'Summer Day Camp', status: 'active', startDate: '2026-07-27' },
    { id: 'a', name: 'Fall 2025', status: 'archived', startDate: '2025-09-01' },
  ];
  it('splits into active / upcoming / archived by status + start date', () => {
    const groups = groupPrograms(programs, today);
    expect(groups.map((g) => g.key)).toEqual(['active', 'upcoming', 'archived']);
    expect(groups[0].programs.map((p) => p.id)).toEqual(['s']);   // running now
    expect(groups[1].programs.map((p) => p.id)).toEqual(['c']);   // starts Jul 27
    expect(groups[2].programs.map((p) => p.id)).toEqual(['a']);   // archived
  });
  it('puts draft-status programs in their own Draft group (Fork 1)', () => {
    const groups = groupPrograms([
      { id: 'd', name: 'Fall Tryouts', status: 'draft', startDate: '2026-08-01' },
      { id: 's', name: 'Spring 2026', status: 'active', startDate: '2026-03-23' },
    ], today);
    expect(groups.map((g) => g.key)).toEqual(['active', 'draft']);
    expect(groups.find((g) => g.key === 'draft').programs.map((p) => p.id)).toEqual(['d']);
  });

  it('drops empty groups', () => {
    const groups = groupPrograms([programs[0]], today);
    expect(groups.map((g) => g.key)).toEqual(['active']);
  });
  it('treats a started active program (null/past start) as running now', () => {
    const groups = groupPrograms([{ id: 'x', status: 'active', startDate: null }], today);
    expect(groups[0].key).toBe('active');
  });
  it('returns [] for no programs', () => {
    expect(groupPrograms([], today)).toEqual([]);
  });
});

describe('programBadge', () => {
  it('season is info; every non-season type is academy', () => {
    expect(programBadge('season')).toEqual({ label: 'Season', variant: 'info' });
    for (const t of ['camp', 'clinic', 'tryout', 'evaluation', 'interest_list']) {
      expect(programBadge(t).variant).toBe('academy');
    }
  });
});
