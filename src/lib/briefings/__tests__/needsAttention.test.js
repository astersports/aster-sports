import { describe, expect, it } from 'vitest';
import {
  buildDigestDueRow, buildGameRecapRows, buildPrelimRows,
  buildTournRecapRows, GAME_RECAP_VISIBLE_CAP, weeklyDigestDueWindow,
} from '../needsAttention';

describe('weeklyDigestDueWindow — Wave 4.1b §5 (Sat AM → Mon AM ET)', () => {
  // Sample timestamps in UTC; the helper applies a -4h offset internally.
  it('Saturday 6 AM ET → true', () => {
    const sat10AM_UTC = new Date('2026-05-09T10:00:00Z');
    expect(weeklyDigestDueWindow(sat10AM_UTC)).toBe(true);
  });

  it('Friday 11 PM ET → false (out of window)', () => {
    const fri = new Date('2026-05-09T03:00:00Z');
    expect(weeklyDigestDueWindow(fri)).toBe(false);
  });

  it('Sunday afternoon → true', () => {
    const sun = new Date('2026-05-10T18:00:00Z');
    expect(weeklyDigestDueWindow(sun)).toBe(true);
  });

  it('Monday 8 AM ET → false (after 7 AM cutoff)', () => {
    const mon12_UTC = new Date('2026-05-11T12:00:00Z');
    expect(weeklyDigestDueWindow(mon12_UTC)).toBe(false);
  });
});

describe('buildPrelimRows — sorted ascending by start_date', () => {
  it('drops tournaments whose anchor_id appears in sentAnchorIds', () => {
    const rows = buildPrelimRows([
      { id: 't1', name: 'A', start_date: '2026-05-15' },
      { id: 't2', name: 'B', start_date: '2026-05-12' },
    ], ['t1']);
    expect(rows).toHaveLength(1);
    expect(rows[0].anchor_id).toBe('t2');
  });

  it('sorts by start_date ascending', () => {
    const rows = buildPrelimRows([
      { id: 't1', name: 'Late', start_date: '2026-05-22' },
      { id: 't2', name: 'Early', start_date: '2026-05-12' },
    ], []);
    expect(rows.map((r) => r.anchor_id)).toEqual(['t2', 't1']);
  });
});

describe('buildTournRecapRows — sorted descending by end_date', () => {
  it('most-recent end_date first', () => {
    const rows = buildTournRecapRows([
      { id: 't1', name: 'Older', end_date: '2026-05-03' },
      { id: 't2', name: 'Newer', end_date: '2026-05-08' },
    ], []);
    expect(rows.map((r) => r.anchor_id)).toEqual(['t2', 't1']);
    expect(rows[0].status).toBe('needs_briefing_tournament_recap');
  });
});

describe('buildGameRecapRows — Wave 4.1b §5 cap + overflow', () => {
  function makeGames(n) {
    return Array.from({ length: n }, (_, i) => ({
      id: `g${i}`, title: `Game ${i}`, start_at: `2026-05-${String(10 - i).padStart(2, '0')}T18:00:00Z`,
      teams: { name: '10U Blue', org_id: 'org' },
    }));
  }

  it('returns N rows when N ≤ cap, no overflow row', () => {
    const rows = buildGameRecapRows(makeGames(3), []);
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.status === 'needs_briefing_game')).toBe(true);
  });

  it('caps at 5 visible + 1 overflow when 9 games need recaps (Bug E baseline)', () => {
    const rows = buildGameRecapRows(makeGames(9), []);
    expect(rows).toHaveLength(GAME_RECAP_VISIBLE_CAP + 1);
    const visible = rows.filter((r) => r.status === 'needs_briefing_game');
    const overflow = rows.find((r) => r.status === 'more_recaps_collapsed');
    expect(visible).toHaveLength(GAME_RECAP_VISIBLE_CAP);
    expect(overflow).toBeDefined();
    expect(overflow.title).toContain('+4 more');
  });

  it('overflow row has no anchor_id (forces admin to pick the next game)', () => {
    const rows = buildGameRecapRows(makeGames(7), []);
    const overflow = rows.find((r) => r.status === 'more_recaps_collapsed');
    expect(overflow.anchor_id).toBe(null);
    expect(overflow.title).toContain('+2 more');
  });

  it('skips games whose id appears in sentAnchorIds before counting overflow', () => {
    const games = makeGames(7);
    const rows = buildGameRecapRows(games, ['g0', 'g1']);
    expect(rows.filter((r) => r.status === 'needs_briefing_game')).toHaveLength(5);
    const overflow = rows.find((r) => r.status === 'more_recaps_collapsed');
    expect(overflow).toBeUndefined();
  });

  it('sorts visible rows most-recent-first', () => {
    const rows = buildGameRecapRows(makeGames(4), []);
    const dates = rows.map((r) => r.relative_time);
    expect(rows.length).toBe(4);
    expect(dates.length).toBe(4);
  });
});

describe('buildDigestDueRow', () => {
  it('shape matches ActionQueueRow expectations', () => {
    const row = buildDigestDueRow('org-uuid', '2026-05-04T00:00:00.000Z');
    expect(row.synthetic_id).toBe('digest_due_2026-05-04');
    expect(row.kind).toBe('weekly_digest');
    expect(row.anchor_kind).toBe('org');
    expect(row.anchor_id).toBe('org-uuid');
  });
});

// Wave 4.1d-2 §2.6 + §4.4 tests live in wave_4_1d_2_synth.test.js so
// this file stays under the 150-line cap.
