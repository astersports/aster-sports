import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useSeasonFinancials } from './useSeasonFinancials';

// HOME_DESIGN_SPEC §3.1.5 PROGRAM HEALTH metrics aggregator.
// Bundles four signals for the admin home card:
//   - paymentPct            via useSeasonFinancials (single source per #42)
//   - rsvpPct               going / total event_rsvps in active season
//   - activeTeamsCount      count of teams in the active season (count
//                           query, no payload)
//   - newRegistrationsCount financial_accounts created in last 7d
//
// PR #311 (2026-05-20) — closes the three deferrals from PR #307's
// v1 (Attendance, RSVP rate, Registration pipeline).
//
// 2026-05-20 Frank-reported: "Attendance should be replaced by number
// of active programs or teams as this grows and is in line with the
// number of registered pipeline or % of the season completed."
// Swapped attendancePct → activeTeamsCount. The check_ins query is
// gone — attendance was rendering '—' indefinitely because no
// check-ins have been recorded; a static team count is a more honest
// program-health signal at this org's scale.
//
// Per anti-pattern #36 (data + error destructured) + #37 (org_id
// filter via FK chain through teams!inner or direct on accounts).

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function useProgramHealthMetrics(orgId, seasonId) {
  const [rsvpPct, setRsvpPct] = useState(null);
  const [activeTeamsCount, setActiveTeamsCount] = useState(0);
  const [newRegistrationsCount, setNewRegistrationsCount] = useState(0);
  const [playersCount, setPlayersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Payment slice via shared hook — same source of truth as KPI grid
  // + admin home payment-overdue lane + parent payment reminder +
  // financial dashboard. Per anti-pattern #42.
  const { stats: financial, loading: financialLoading } = useSeasonFinancials(orgId, seasonId);

  const refetch = useCallback(async () => {
    if (!orgId || !seasonId) {
      setRsvpPct(null);
      setActiveTeamsCount(0);
      setNewRegistrationsCount(0);
      setPlayersCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();
    const [rsvpRes, teamsRes, regRes, playersRes] = await Promise.all([
      supabase
        .from('event_rsvps')
        .select('response, events!inner(id, teams!inner(id, season_id))')
        .eq('events.teams.season_id', seasonId),
      supabase
        .from('teams')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('season_id', seasonId),
      supabase
        .from('financial_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('season_id', seasonId)
        .gte('created_at', sevenDaysAgo),
      // Distinct active players in the season (a kid on two teams counts once).
      supabase
        .from('team_players')
        .select('player_id, teams!inner(season_id)')
        .eq('teams.season_id', seasonId)
        .eq('status', 'active'),
    ]);
    const firstErr = rsvpRes.error || teamsRes.error || regRes.error || playersRes.error;
    if (firstErr) {
      console.error('useProgramHealthMetrics fetch:', firstErr.message);
      setError(firstErr.message);
      setLoading(false);
      return;
    }
    const rsvps = rsvpRes.data || [];
    const total = rsvps.length;
    const going = rsvps.filter((r) => r.response === 'going').length;
    setRsvpPct(total > 0 ? Math.round((going / total) * 100) : null);
    setActiveTeamsCount(teamsRes.count || 0);
    setNewRegistrationsCount(regRes.count || 0);
    setPlayersCount(new Set((playersRes.data || []).map((r) => r.player_id)).size);
    setError(null);
    setLoading(false);
  }, [orgId, seasonId]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  return {
    paymentPct: financial?.pct ?? 0,
    rsvpPct,
    activeTeamsCount,
    newRegistrationsCount,
    playersCount,
    loading: loading || financialLoading,
    error,
    refetch,
  };
}
