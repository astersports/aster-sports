// @vitest-environment jsdom
//
// DB-8 forward gate (SCHEDULE_L99_BUILD_SPEC §1.5 + §8 PR-C'): the
// import path writes a NON-NULL end_at (start + the ONE default
// duration). The legacy NULL-end class stops growing here; the 5
// existing NULL rows are tolerated by eventEnd() (PR-A').

import { describe, expect, it, vi } from 'vitest';
import { EVENT_DEFAULT_DURATION_MS } from '../../lib/eventWindows';

vi.mock('../../lib/supabase', () => ({ supabase: { from: () => ({}) } }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({}) }));

const { buildImportEventRow } = await import('../useImportSchedule');

describe('buildImportEventRow — DB-8 closed forward', () => {
  const row = {
    team: '10U Black', opponent: 'Rye Raiders', court: 'Court 2',
    home_away: 'neutral', is_bonus: false,
    resolved: { team_id: 't-1', start_at: '2026-06-13T13:00:00.000Z', location_id: 'loc-1' },
  };

  it('writes end_at = start_at + EVENT_DEFAULT_DURATION_MS (never null)', () => {
    const built = buildImportEventRow(row, 'tour-1', 'Bergen County');
    expect(built.end_at).not.toBeNull();
    expect(new Date(built.end_at).getTime() - new Date(built.start_at).getTime()).toBe(EVENT_DEFAULT_DURATION_MS);
  });

  it('preserves the rest of the insert contract', () => {
    const built = buildImportEventRow(row, 'tour-1', 'Bergen County');
    expect(built).toMatchObject({
      team_id: 't-1', event_type: 'tournament', title: '10U Black vs Rye Raiders',
      tournament_id: 'tour-1', tournament_name: 'Bergen County',
      sub_location: 'Court 2', opponent: 'Rye Raiders', home_away: 'neutral',
      is_bonus_game: false, status: 'scheduled', publish_status: 'published',
    });
  });
});
