// Wave 3.15 — aggregate RSVP counts across all events in a
// tournament. Returns total counts per response + per-team
// breakdown for the expandable drawer.
//
// Query path uses PostgREST inner join: pulls event_rsvps where
// the joined event has tournament_id matching the target. Aggregate
// client-side so we keep a single round-trip.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

function emptyTotals() { return { going: 0, maybe: 0, not_going: 0 }; }

function aggregate(rows, teamMap) {
  const totals = emptyTotals();
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

export function useTournamentAggregateRsvp({ tournamentId } = {}) {
  const [rows, setRows] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!tournamentId) return;
    setLoading(true); setError(null);
    const [rsvpsRes, teamsRes] = await Promise.all([
      supabase.from('event_rsvps').select('response,guardian_id,player_id,events!inner(id,team_id,tournament_id)').eq('events.tournament_id', tournamentId),
      supabase.from('tournament_teams').select('team_id,teams(name)').eq('tournament_id', tournamentId),
    ]);
    Promise.resolve().then(() => {
      if (rsvpsRes.error) { setError(rsvpsRes.error); setLoading(false); return; }
      if (teamsRes.error) console.error('useTournamentAggregateRsvp teams:', teamsRes.error.message);
      setRows(rsvpsRes.data || []);
      setTeams((teamsRes.data || []).map((t) => ({ id: t.team_id, name: t.teams?.name || '' })));
      setLoading(false);
    });
  }, [tournamentId]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t.name])), [teams]);
  const summary = useMemo(() => aggregate(rows, teamMap), [rows, teamMap]);

  return { ...summary, loading, error, refetch };
}
