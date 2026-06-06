import { describe, expect, it } from 'vitest';
import { isOffSeason } from '../offSeason';
import { shapeChildRecords } from '../parentHomeData';

// D-D off-season trigger + parent season-wrap shaping. The trigger drives
// all three role homes (parent/coach drop Needs-you + Coming-up; admin swaps
// in the close-out queue), so locking it here is the cross-role guard.
const NOW = new Date('2026-06-20T12:00:00Z').getTime();
const ENDED = { name: 'Spring 2026', start_date: '2026-03-23', end_date: '2026-06-14' };
const LIVE = { name: 'Spring 2026', start_date: '2026-03-23', end_date: '2026-07-30' };

describe('isOffSeason (D-D trigger)', () => {
  it('false when no active season', () => {
    expect(isOffSeason(null, [], NOW)).toBe(false);
  });

  it('false when the season end_date is still in the future', () => {
    expect(isOffSeason(LIVE, [], NOW)).toBe(false);
  });

  it('true when the season has ended AND nothing is upcoming', () => {
    const past = [{ start_at: '2026-06-10T18:00:00Z' }];
    expect(isOffSeason(ENDED, past, NOW)).toBe(true);
  });

  it('false when the season ended but an event is still upcoming', () => {
    const mixed = [{ start_at: '2026-06-10T18:00:00Z' }, { start_at: '2026-06-25T18:00:00Z' }];
    expect(isOffSeason(ENDED, mixed, NOW)).toBe(false);
  });

  it('true when ended and the activities list is empty', () => {
    expect(isOffSeason(ENDED, [], NOW)).toBe(true);
  });
});

describe('shapeChildRecords (parent season-wrap rows)', () => {
  const myChildren = [
    { playerId: 'p1', firstName: 'Charlie', teamId: 't-11ug' },
    { playerId: 'p2', firstName: 'Milo', teamId: 't-8u' },
  ];
  const activities = [
    { team_id: 't-11ug', teams: { age_group: '11U', team_color: '#c026d3' } },
    { team_id: 't-8u', teams: { age_group: '8U', team_color: '#16a34a' } },
  ];
  const records = { 't-11ug': { record: '11-5' }, 't-8u': { record: '3-9' } };

  it('builds a "name · age" label, color, and record per child', () => {
    const rows = shapeChildRecords(myChildren, activities, records, new Set());
    expect(rows[0]).toMatchObject({ key: 'p1', label: 'Charlie · 11U', color: '#c026d3', record: '11-5', gold: false });
    expect(rows[1]).toMatchObject({ key: 'p2', label: 'Milo · 8U', record: '3-9', gold: false });
  });

  it('marks gold only for a team that earned an achievement (§3 gold=achievement-only)', () => {
    const rows = shapeChildRecords(myChildren, activities, records, new Set(['t-11ug']));
    expect(rows[0].gold).toBe(true);
    expect(rows[1].gold).toBe(false);
  });

  it('renders "—" not a fake 0-0 when the team has no published record (AP#27)', () => {
    const rows = shapeChildRecords(myChildren, activities, {}, new Set());
    expect(rows[0].record).toBe('—');
  });
});
