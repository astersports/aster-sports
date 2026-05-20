import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useSeasonFinancials } from './useSeasonFinancials';

// HOME_DESIGN_SPEC §3.1.5 PROGRAM HEALTH metrics aggregator.
// Bundles four signals for the admin home card:
//   - paymentPct           via useSeasonFinancials (single source per #42)
//   - rsvpPct              going / total event_rsvps in active season
//   - attendancePct        check_ins / past event_rsvps (null when no
//                          check-ins recorded yet — render '—' honestly)
//   - newRegistrationsCount financial_accounts created in last 7d
//
// PR #311 (2026-05-20) — closes the three deferrals from PR #307's
// v1 (Attendance, RSVP rate, Registration pipeline).
//
// Per anti-pattern #36 (data + error destructured) + #37 (org_id
// filter via FK chain through teams!inner or direct on accounts).

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function useProgramHealthMetrics(orgId, seasonId) {
  const [rsvpPct, setRsvpPct] = useState(null);
  const [attendancePct, setAttendancePct] = useState(null);
  const [newRegistrationsCount, setNewRegistrationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Payment slice via shared hook — same source of truth as KPI grid
  // + admin home payment-overdue lane + parent payment reminder +
  // financial dashboard. Per anti-pattern #42.
  const { stats: financial, loading: financialLoading } = useSeasonFinancials(orgId, seasonId);

  const refetch = useCallback(async () => {
    if (!orgId || !seasonId) {
      setRsvpPct(null);
      setAttendancePct(null);
      setNewRegistrationsCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();
    const [rsvpRes, checkinRes, regRes] = await Promise.all([
      supabase
        .from('event_rsvps')
        .select('response, events!inner(id, teams!inner(id, season_id))')
        .eq('events.teams.season_id', seasonId),
      supabase
        .from('check_ins')
        .select('id, events!inner(id, start_at, teams!inner(id, season_id))')
        .eq('events.teams.season_id', seasonId),
      supabase
        .from('financial_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('season_id', seasonId)
        .gte('created_at', sevenDaysAgo),
    ]);
    const firstErr = rsvpRes.error || checkinRes.error || regRes.error;
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

    // Attendance = check-ins / total (going) RSVPs on past events.
    // No check-ins recorded → null (caller renders '—').
    const checkins = checkinRes.data || [];
    if (checkins.length === 0) {
      setAttendancePct(null);
    } else {
      const pastGoing = rsvps.filter((r) => r.response === 'going').length || 0;
      setAttendancePct(pastGoing > 0 ? Math.round((checkins.length / pastGoing) * 100) : null);
    }

    setNewRegistrationsCount(regRes.count || 0);
    setError(null);
    setLoading(false);
  }, [orgId, seasonId]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  return {
    paymentPct: financial?.pct ?? 0,
    rsvpPct,
    attendancePct,
    newRegistrationsCount,
    loading: loading || financialLoading,
    error,
    refetch,
  };
}
