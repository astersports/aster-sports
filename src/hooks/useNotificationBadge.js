import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useHomeRole } from './useHomeRole';
import { fetchParentBadgeCount, fetchStaffBadgeCount } from './notificationBadgeQueries';

/**
 * useNotificationBadge
 * Returns {count, severity, loading} for the header bell badge, scoped to activeRole.
 *
 * Semantics by activeRole:
 *   parent: events 48h out for my children with no RSVP (warning <24h, danger <4h)
 *   coach:  events 24h out on my teams with <50% RSVP coverage (warning <12h, danger <4h)
 *   admin:  events 24h out across the org with <50% RSVP coverage (warning <12h, danger <4h)
 *
 * Tonight uses logged-in user's data even when admin views-as-X. Bell tap is a no-op
 * tonight per Frank decision B1: visible badge with count, no list yet.
 *
 * Query bodies live in ./notificationBadgeQueries.js (split for line-cap).
 */
export function useNotificationBadge() {
  const { user, orgId, myChildren, myTeamIds } = useAuth();
  const { activeRole, loading: roleLoading } = useHomeRole();
  const [count, setCount] = useState(0);
  const [severity, setSeverity] = useState('info');
  const [loading, setLoading] = useState(true);

  const userId = user?.id;
  const childIdsKey = (myChildren ?? []).map((c) => c.playerId).join(',');
  const teamIdsKey = (myTeamIds ?? []).join(',');

  useEffect(() => {
    let cancelled = false;

    if (!userId || !orgId || !activeRole || roleLoading) {
      Promise.resolve().then(() => {
        if (cancelled) return;
        setCount(0);
        setSeverity('info');
        setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }

    Promise.resolve().then(() => {
      if (cancelled) return;
      setLoading(true);
    });

    (async () => {
      const now = new Date();
      const nowMs = now.getTime();
      const nowIso = now.toISOString();
      const in24hIso = new Date(nowMs + 24 * 60 * 60 * 1000).toISOString();
      const in48hIso = new Date(nowMs + 48 * 60 * 60 * 1000).toISOString();

      const teams = myTeamIds ?? [];
      const kids = (myChildren ?? []).map((c) => c.playerId);

      let result = { count: 0, severity: 'info' };

      try {
        if (activeRole === 'parent') {
          result = await fetchParentBadgeCount(supabase, { teams, kids, nowMs, nowIso, in48hIso });
        } else {
          result = await fetchStaffBadgeCount(supabase, { activeRole, teams, nowMs, nowIso, in24hIso });
        }
      } catch {
        // Swallow — badge is non-critical; defaults to 0
      }

      if (cancelled) return;
      setCount(result.count);
      setSeverity(result.severity);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, orgId, activeRole, roleLoading, childIdsKey, teamIdsKey, myChildren, myTeamIds]);

  return { count, severity, loading };
}
