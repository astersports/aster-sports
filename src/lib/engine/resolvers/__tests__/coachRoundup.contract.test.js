// Wave 5 PR 4b — coach_roundup resolver + composer contract.
// Replaces the 4a skeleton test. Mocks supabase with the full join
// chain (staff_profiles, team_staff, events, organizations) so the
// real aggregation logic + conflict detection are exercised.

import { describe, expect, it } from 'vitest';
import { composeCoachRoundup, resolveCoachRoundup } from '../coachRoundup';
import { detectConflicts, formatDateRange, groupEventsByTeam } from '../coachRoundupHelpers';

function mockSb({ coach = null, staffRows = [], events = [], coaches = [], org = null }) {
  return {
    from(table) {
      const builder = {
        _table: table,
        select() { return this; },
        eq() { return this; },
        in() { return this; },
        gte() { return this; },
        lte() { return this; },
        not() { return this; },
        async maybeSingle() {
          if (this._table === 'staff_profiles') return { data: coach, error: null };
          if (this._table === 'organizations') return { data: org, error: null };
          return { data: null, error: null };
        },
        then(resolve) {
          // Awaiting the builder (without maybeSingle) resolves to the list query.
          if (this._table === 'team_staff') return Promise.resolve({ data: staffRows, error: null }).then(resolve);
          if (this._table === 'events') return Promise.resolve({ data: events, error: null }).then(resolve);
          if (this._table === 'staff_profiles') return Promise.resolve({ data: coaches, error: null }).then(resolve);
          return Promise.resolve({ data: [], error: null }).then(resolve);
        },
      };
      return builder;
    },
  };
}

const COACH = { user_id: 'c1', display_name: 'Coach Kenny', org_id: 'org-1', phone: '555', title: 'Coaching Director' };

describe('resolveCoachRoundup (PR 4b real aggregation)', () => {
  it('throws when coachUserId is missing', async () => {
    await expect(resolveCoachRoundup({}, { supabase: mockSb({}) }))
      .rejects.toThrow(/Missing coachUserId/);
  });

  it('throws when coach is not in staff_profiles', async () => {
    await expect(resolveCoachRoundup({ coachUserId: 'c1' }, { supabase: mockSb({ coach: null }) }))
      .rejects.toThrow(/Coach c1 not found/);
  });

  it('returns empty events when no team_staff rows', async () => {
    const r = await resolveCoachRoundup(
      { coachUserId: 'c1', dateRange: { start: '2026-05-18', end: '2026-05-24' } },
      { supabase: mockSb({ coach: COACH, staffRows: [] }) },
    );
    expect(r.context.teamsWithEvents).toEqual([]);
    expect(r.context.conflicts).toEqual([]);
  });

  it('aggregates events per team and sorts by sort_order', async () => {
    const staffRows = [
      { team_id: 't-2', role: 'head_coach', teams: { id: 't-2', name: '10U Black', team_color: '#000', sort_order: 2 } },
      { team_id: 't-1', role: 'head_coach', teams: { id: 't-1', name: '11U Girls', team_color: '#a78bfa', sort_order: 1 } },
    ];
    const events = [
      { id: 'e1', team_id: 't-1', start_at: '2026-05-18T15:00:00Z', opponent: 'A' },
      { id: 'e2', team_id: 't-2', start_at: '2026-05-18T20:00:00Z', opponent: 'B' },
    ];
    const r = await resolveCoachRoundup(
      { coachUserId: 'c1', dateRange: { start: '2026-05-18', end: '2026-05-24' } },
      { supabase: mockSb({ coach: COACH, staffRows, events }) },
    );
    expect(r.context.teamsWithEvents).toHaveLength(2);
    expect(r.context.teamsWithEvents[0].team_name).toBe('11U Girls');
    expect(r.context.teamsWithEvents[0].events).toHaveLength(1);
    expect(r.context.teamsWithEvents[1].team_name).toBe('10U Black');
  });
});

describe('composeCoachRoundup', () => {
  it('throws on missing context or slice', () => {
    expect(() => composeCoachRoundup(null, {})).toThrow();
    expect(() => composeCoachRoundup({}, null)).toThrow();
  });

  it('emits coach_header → team sections → brand_footer for a non-empty schedule', () => {
    const ctx = {
      coach: COACH,
      teamsWithEvents: [{ team_id: 't-1', team_name: '11U Girls', team_color: '#a78bfa', events: [{ start_at: '2026-05-18T15:00:00-04:00', opponent: 'A' }] }],
      conflicts: [],
      dateRange: { start: '2026-05-18', end: '2026-05-24' },
      coaches: [],
      orgName: 'Legacy Hoopers',
    };
    const out = composeCoachRoundup(ctx, { coach_name: 'Coach Kenny' });
    expect(out.content_sections[0].kind).toBe('coach_header');
    expect(out.content_sections.some((s) => s.kind === 'team_color_pill')).toBe(true);
    expect(out.content_sections.some((s) => s.kind === 'color_striped_row')).toBe(true);
    expect(out.content_sections[out.content_sections.length - 1].kind).toBe('brand_footer');
  });

  it('emits conflict_callout when conflicts exist', () => {
    const ctx = {
      coach: COACH,
      teamsWithEvents: [{ team_id: 't-1', team_name: '11U', team_color: '#000', events: [] }],
      conflicts: [{ date_label: 'SAT 5/18', team_a: '11U', time_a: '11:00 AM', team_b: '10U', time_b: '11:30 AM' }],
      dateRange: { start: '2026-05-18', end: '2026-05-24' },
      coaches: [], orgName: 'LH',
    };
    const out = composeCoachRoundup(ctx, { coach_name: 'Coach' });
    expect(out.content_sections.some((s) => s.kind === 'conflict_callout')).toBe(true);
  });
});

describe('coachRoundupHelpers', () => {
  it('formatDateRange handles ISO date strings', () => {
    expect(formatDateRange({ start: '2026-05-18', end: '2026-05-24' })).toBe('5/18 – 5/24');
    expect(formatDateRange({})).toBe('');
  });

  it('groupEventsByTeam sorts teams by sort_order and events by start_at', () => {
    const teams = [{ team_id: 't-2', sort_order: 2 }, { team_id: 't-1', sort_order: 1 }];
    const events = [
      { team_id: 't-1', start_at: '2026-05-20T15:00:00Z' },
      { team_id: 't-1', start_at: '2026-05-18T15:00:00Z' },
      { team_id: 't-2', start_at: '2026-05-19T15:00:00Z' },
    ];
    const grouped = groupEventsByTeam(teams, events);
    expect(grouped[0].team_id).toBe('t-1');
    expect(grouped[0].events[0].start_at).toBe('2026-05-18T15:00:00Z');
    expect(grouped[1].team_id).toBe('t-2');
  });

  it('detectConflicts surfaces cross-team overlaps only', () => {
    const teamsWithEvents = [
      { team_id: 't-1', team_name: 'A', team_color: '#000', events: [{ start_at: '2026-05-18T15:00:00Z', end_at: '2026-05-18T16:00:00Z' }] },
      { team_id: 't-2', team_name: 'B', team_color: '#fff', events: [{ start_at: '2026-05-18T15:30:00Z', end_at: '2026-05-18T16:30:00Z' }] },
    ];
    const conflicts = detectConflicts(teamsWithEvents);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].team_a).toBe('A');
    expect(conflicts[0].team_b).toBe('B');
  });

  it('detectConflicts skips same-team back-to-backs', () => {
    const teamsWithEvents = [
      { team_id: 't-1', team_name: 'A', team_color: '#000', events: [
        { start_at: '2026-05-18T15:00:00Z', end_at: '2026-05-18T16:00:00Z' },
        { start_at: '2026-05-18T15:30:00Z' },
      ] },
    ];
    expect(detectConflicts(teamsWithEvents)).toEqual([]);
  });
});
