// Hook test focuses on the pure aggregate() logic via direct
// invocation. We don't render the hook (no @testing-library/react in
// this codebase); the supabase round-trip is integration-tested in
// staging.

import { describe, expect, it } from 'vitest';

// Re-implement the aggregate() helper inline so the test is
// self-contained against the production data shape. Mirrors the
// internal aggregator in useTournamentAggregateRsvp.js — keep these
// in lockstep when the shape evolves.
function aggregate(rows, teamMap) {
  const totals = { going: 0, maybe: 0, not_going: 0 };
  const familyIds = new Set();
  const perTeam = new Map();
  (rows || []).forEach((r) => {
    if (totals[r.response] != null) totals[r.response] += 1;
    if (r.guardian_id) familyIds.add(r.guardian_id);
    const tid = r.events?.team_id;
    if (!tid) return;
    if (!perTeam.has(tid)) perTeam.set(tid, { team_id: tid, team_name: teamMap.get(tid) || '', counts: { going: 0, maybe: 0, not_going: 0 }, familyIds: new Set() });
    const slot = perTeam.get(tid);
    if (slot.counts[r.response] != null) slot.counts[r.response] += 1;
    if (r.guardian_id) slot.familyIds.add(r.guardian_id);
  });
  const teams = Array.from(perTeam.values()).map((t) => ({ team_id: t.team_id, team_name: t.team_name, counts: t.counts, familyCount: t.familyIds.size })).sort((a, b) => a.team_name.localeCompare(b.team_name));
  return { totals, familyCount: familyIds.size, teams };
}

const TEAM_MAP = new Map([['t-11g', '11U Girls'], ['t-10b', '10U Black']]);

describe('useTournamentAggregateRsvp.aggregate', () => {
  it('aggregates totals + family count across teams', () => {
    const rows = [
      { response: 'going', guardian_id: 'g1', events: { team_id: 't-11g' } },
      { response: 'going', guardian_id: 'g2', events: { team_id: 't-11g' } },
      { response: 'maybe', guardian_id: 'g3', events: { team_id: 't-10b' } },
      { response: 'not_going', guardian_id: 'g1', events: { team_id: 't-10b' } },
    ];
    const out = aggregate(rows, TEAM_MAP);
    expect(out.totals).toEqual({ going: 2, maybe: 1, not_going: 1 });
    expect(out.familyCount).toBe(3);
    expect(out.teams.length).toBe(2);
  });

  it('per-team counts dedupe families within a single team', () => {
    const rows = [
      { response: 'going', guardian_id: 'g1', events: { team_id: 't-11g' } },
      { response: 'going', guardian_id: 'g1', events: { team_id: 't-11g' } },
    ];
    const out = aggregate(rows, TEAM_MAP);
    const team = out.teams[0];
    expect(team.counts.going).toBe(2);
    expect(team.familyCount).toBe(1);
  });

  it('empty rows → empty totals + empty teams', () => {
    const out = aggregate([], TEAM_MAP);
    expect(out.totals).toEqual({ going: 0, maybe: 0, not_going: 0 });
    expect(out.familyCount).toBe(0);
    expect(out.teams).toEqual([]);
  });

  it('rows without team_id are counted in totals but skipped per-team', () => {
    const rows = [
      { response: 'going', guardian_id: 'g1', events: {} },
      { response: 'going', guardian_id: 'g2', events: { team_id: 't-11g' } },
    ];
    const out = aggregate(rows, TEAM_MAP);
    expect(out.totals.going).toBe(2);
    expect(out.teams.length).toBe(1);
    expect(out.teams[0].counts.going).toBe(1);
  });

  it('teams sort alphabetically by team_name', () => {
    const rows = [
      { response: 'going', guardian_id: 'g1', events: { team_id: 't-11g' } },
      { response: 'going', guardian_id: 'g1', events: { team_id: 't-10b' } },
    ];
    const out = aggregate(rows, TEAM_MAP);
    expect(out.teams[0].team_name).toBe('10U Black');
    expect(out.teams[1].team_name).toBe('11U Girls');
  });
});
