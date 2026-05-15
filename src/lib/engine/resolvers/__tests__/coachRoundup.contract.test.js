// Wave 5 PR 4a — coach_roundup resolver skeleton contract test.
// 4a only ships discoverability + the resolver pipeline wiring; the
// real multi-team aggregation lands in 4b. This test verifies the
// two-stage contract holds against an in-memory supabase mock.

import { describe, expect, it } from 'vitest';
import { composeCoachRoundup, resolveCoachRoundup } from '../coachRoundup';

function mockSupabase(coachRow) {
  return {
    from(table) {
      return {
        select() { return this; },
        eq() { return this; },
        async maybeSingle() {
          if (table !== 'staff_profiles') return { data: null, error: new Error(`unexpected table ${table}`) };
          return { data: coachRow, error: null };
        },
      };
    },
  };
}

describe('resolveCoachRoundup (PR 4a skeleton)', () => {
  it('throws when coachUserId is missing', async () => {
    await expect(resolveCoachRoundup({}, { supabase: mockSupabase(null) }))
      .rejects.toThrow(/Missing coachUserId/);
  });

  it('throws when supabase client is missing', async () => {
    await expect(resolveCoachRoundup({ coachUserId: 'c1' }, {}))
      .rejects.toThrow(/Missing supabase client/);
  });

  it('throws when coach is not in staff_profiles', async () => {
    await expect(resolveCoachRoundup({ coachUserId: 'c1' }, { supabase: mockSupabase(null) }))
      .rejects.toThrow(/Coach c1 not found/);
  });

  it('returns context + single slice on success', async () => {
    const coach = { user_id: 'c1', display_name: 'Coach Kenny', org_id: 'org-1', phone: '555', title: 'Coaching Director' };
    const result = await resolveCoachRoundup(
      { coachUserId: 'c1', dateRange: { start: '2026-05-18', end: '2026-05-24' } },
      { supabase: mockSupabase(coach) },
    );
    expect(result.context.coach).toEqual(coach);
    expect(result.context.dateRange).toEqual({ start: '2026-05-18', end: '2026-05-24' });
    expect(result.context.teams).toEqual([]);
    expect(result.context.events_by_team).toEqual({});
    expect(result.slices).toHaveLength(1);
    expect(result.slices[0]).toEqual({ recipient_user_id: 'c1', coach_name: 'Coach Kenny' });
  });
});

describe('composeCoachRoundup (PR 4a stub)', () => {
  it('throws on missing context or slice', () => {
    expect(() => composeCoachRoundup(null, { coach_name: 'X' })).toThrow();
    expect(() => composeCoachRoundup({}, null)).toThrow();
  });

  it('returns placeholder content_sections (4a stub)', () => {
    const out = composeCoachRoundup({ coach: { display_name: 'Coach K' } }, { coach_name: 'Coach K' });
    expect(out.subject).toContain('Coach K');
    expect(out.content_sections).toHaveLength(1);
    expect(out.content_sections[0].kind).toBe('ops_notes');
    expect(out.content_sections[0].title).toContain('COACH ROUNDUP');
    expect(out.content_sections[0].items.some((i) => /PR 4b/.test(i))).toBe(true);
  });
});
