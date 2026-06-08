// Fix B season-to-date helper: scoped record query (reuses computeSummary) +
// the F3b season pill text. Locks the single-team/single-scope contract inputs.

import { describe, expect, it } from 'vitest';
import { fetchSeasonToDate, SCOPE_LABEL, seasonPillText } from '../seasonToDate';

// Minimal thenable Supabase mock: every chain method returns the builder; the
// builder resolves to { data, error } when awaited (after any terminal method).
function mockSb(rows, error = null) {
  const builder = {
    select: () => builder, eq: () => builder, lte: () => builder, not: () => builder,
    then: (resolve) => resolve({ data: rows, error }),
  };
  return { from: () => builder };
}

describe('seasonToDate', () => {
  it('seasonPillText: dashed record + scope label + Season suffix', () => {
    expect(seasonPillText('3-5', 'game')).toBe('3–5 League Play · Season');
    expect(seasonPillText('11-3', 'tournament')).toBe('11–3 Tournament · Season');
  });

  it('SCOPE_LABEL maps event_type to display scope', () => {
    expect(SCOPE_LABEL.game).toBe('League Play');
    expect(SCOPE_LABEL.tournament).toBe('Tournament');
  });

  it('fetchSeasonToDate: computes record + gamesPlayed + scope via computeSummary', async () => {
    const rows = [
      { result: 'L', our_score: 22, opponent_score: 28, events: { start_at: '2026-06-05' } },
      { result: 'W', our_score: 40, opponent_score: 20, events: { start_at: '2026-05-01' } },
      { result: 'L', our_score: 18, opponent_score: 30, events: { start_at: '2026-05-10' } },
    ];
    const s = await fetchSeasonToDate(mockSb(rows), { teamId: 't1', scope: 'game', asOf: '2026-06-05' });
    expect(s).toEqual({ record: '1-2', gamesPlayed: 3, scope: 'game', scopeLabel: 'League Play' });
  });

  it('fetchSeasonToDate: returns null when no qualifying games (no false 0-0 pill)', async () => {
    expect(await fetchSeasonToDate(mockSb([]), { teamId: 't1', scope: 'game', asOf: '2026-06-05' })).toBeNull();
  });

  it('fetchSeasonToDate: returns null when teamId/scope missing (gate not met)', async () => {
    expect(await fetchSeasonToDate(mockSb([]), { teamId: null, scope: 'game' })).toBeNull();
  });

  it('fetchSeasonToDate: throws on query error (AP#36 — callers degrade)', async () => {
    await expect(fetchSeasonToDate(mockSb(null, { message: 'boom' }), { teamId: 't1', scope: 'game', asOf: 'x' }))
      .rejects.toThrow('boom');
  });
});
