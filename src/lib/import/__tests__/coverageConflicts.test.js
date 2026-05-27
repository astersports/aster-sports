import { describe, expect, it } from 'vitest';
import {
  ASSUMED_GAME_MINUTES,
  buildAssignmentRows,
  buildConflictItems,
  busyWindow,
  detectCoverageConflicts,
  effectiveCoach,
} from '../coverageConflicts';

const T = (h, m = 0) => `2026-05-16T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00-04:00`;

describe('busyWindow', () => {
  it('uses 90 min when end_at is null', () => {
    const { start, end } = busyWindow(T(10), null);
    expect(end - start).toBe(ASSUMED_GAME_MINUTES * 60000);
  });
  it('uses real end_at when present', () => {
    const { start, end } = busyWindow(T(10), T(11, 30));
    expect(end - start).toBe(90 * 60000);
  });
});

describe('effectiveCoach', () => {
  const maps = { assignmentMap: new Map([['e1', 'asg-coach']]), teamHeadCoachMap: new Map([['t1', 'head-coach']]) };
  it('delegation wins over everything', () => {
    expect(effectiveCoach({ delegated_coach_user_id: 'deleg', event_id: 'e1', team_id: 't1' }, maps)).toBe('deleg');
  });
  it('assignment wins over team head coach', () => {
    expect(effectiveCoach({ event_id: 'e1', team_id: 't1' }, maps)).toBe('asg-coach');
  });
  it('falls back to team head coach', () => {
    expect(effectiveCoach({ event_id: 'e9', team_id: 't1' }, maps)).toBe('head-coach');
  });
  it('returns null when no coach resolvable', () => {
    expect(effectiveCoach({ team_id: 'unknown' }, maps)).toBeNull();
  });
});

describe('detectCoverageConflicts', () => {
  const maps = { assignmentMap: new Map(), teamHeadCoachMap: new Map([['black', 'kenny'], ['boys', 'kenny'], ['girls', 'darien']]) };

  it('flags two overlapping games for the same coach', () => {
    const items = [
      { key: 'a', team_id: 'black', start_at: T(10), end_at: null, label: 'Black' },
      { key: 'b', team_id: 'boys', start_at: T(10, 30), end_at: null, label: 'Boys' },
    ];
    const clusters = detectCoverageConflicts(items, maps);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].coach_user_id).toBe('kenny');
    expect(clusters[0].events.map((e) => e.key).sort()).toEqual(['a', 'b']);
  });

  it('does NOT flag back-to-back games (end === next start)', () => {
    const items = [
      { key: 'a', team_id: 'black', start_at: T(10), end_at: T(11, 30) },
      { key: 'b', team_id: 'boys', start_at: T(11, 30), end_at: null },
    ];
    expect(detectCoverageConflicts(items, maps)).toHaveLength(0);
  });

  it('does NOT flag overlap across DIFFERENT coaches', () => {
    const items = [
      { key: 'a', team_id: 'black', start_at: T(10), end_at: null },
      { key: 'b', team_id: 'girls', start_at: T(10, 15), end_at: null },
    ];
    expect(detectCoverageConflicts(items, maps)).toHaveLength(0);
  });

  it('delegation resolves a conflict', () => {
    const items = [
      { key: 'a', team_id: 'black', start_at: T(10), end_at: null },
      { key: 'b', team_id: 'boys', start_at: T(10, 30), end_at: null, delegated_coach_user_id: 'darien' },
    ];
    expect(detectCoverageConflicts(items, maps)).toHaveLength(0);
  });

  it('clusters three transitively-overlapping games into one', () => {
    const items = [
      { key: 'a', team_id: 'black', start_at: T(10), end_at: null },
      { key: 'b', team_id: 'boys', start_at: T(11), end_at: null },
      { key: 'c', team_id: 'black', start_at: T(12), end_at: null },
    ];
    const clusters = detectCoverageConflicts(items, maps);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].events).toHaveLength(3);
  });

  it('skips events with no resolvable coach', () => {
    const items = [
      { key: 'a', team_id: 'ghost', start_at: T(10), end_at: null },
      { key: 'b', team_id: 'ghost', start_at: T(10, 10), end_at: null },
    ];
    expect(detectCoverageConflicts(items, maps)).toHaveLength(0);
  });
});

describe('buildConflictItems', () => {
  it('skips error rows + excludes the import own matched event', () => {
    const rows = [
      { status: 'ok', team: 'Black', opponent: 'CT', dedup: 'updated', matched_event_id: 'e1', resolved: { team_id: 'black', start_at: T(10) } },
      { status: 'error', resolved: null },
    ];
    const existing = [
      { id: 'e1', team_id: 'black', start_at: T(10), end_at: null, opponent: 'CT' }, // the matched one — excluded
      { id: 'e2', team_id: 'black', start_at: T(14), end_at: null, opponent: 'Other' },
    ];
    const items = buildConflictItems(rows, existing);
    const keys = items.map((i) => i.key);
    expect(keys).toContain('import-0');
    expect(keys).toContain('existing-e2');
    expect(keys).not.toContain('existing-e1'); // self-match excluded
    expect(items.find((i) => i.key === 'import-0').event_id).toBe('e1');
  });

  it('carries staged delegation onto the import item', () => {
    const rows = [{ status: 'ok', team: 'Boys', opponent: 'X', dedup: 'new', matched_event_id: null, delegated_coach_user_id: 'darien', resolved: { team_id: 'boys', start_at: T(10) } }];
    const items = buildConflictItems(rows, []);
    expect(items[0].delegated_coach_user_id).toBe('darien');
  });
});

describe('buildAssignmentRows', () => {
  it('maps new-row delegations positionally to inserted ids', () => {
    const newRows = [
      { delegated_coach_user_id: null },
      { delegated_coach_user_id: 'darien' },
    ];
    const rows = buildAssignmentRows({ newRows, insertedIds: ['evt-A', 'evt-B'], userId: 'admin' });
    expect(rows).toEqual([{ event_id: 'evt-B', coach_user_id: 'darien', assigned_by: 'admin' }]);
  });

  it('uses matched_event_id for updated-row delegations', () => {
    const updatedRows = [{ delegated_coach_user_id: 'darien', matched_event_id: 'evt-X' }];
    const rows = buildAssignmentRows({ updatedRows, userId: 'admin' });
    expect(rows).toEqual([{ event_id: 'evt-X', coach_user_id: 'darien', assigned_by: 'admin' }]);
  });

  it('emits nothing when no rows staged a delegation', () => {
    const newRows = [{ delegated_coach_user_id: null }];
    expect(buildAssignmentRows({ newRows, insertedIds: ['evt-A'] })).toEqual([]);
  });

  it('skips a new-row delegation with no matching inserted id', () => {
    const newRows = [{ delegated_coach_user_id: 'darien' }];
    expect(buildAssignmentRows({ newRows, insertedIds: [] })).toEqual([]);
  });
});
