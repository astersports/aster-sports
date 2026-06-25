import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

// Given a list of activities, fetches RSVP counts per event and team
// sizes per team in two queries, then computes a summary object per
// event: { going, not_going, maybe, noResponse, total }.
// noResponse is inferred from (teamSize − sum of responses).
//
// L99 TIER 3 PATTERN A: stableKey encodes per-activity (id, team_id)
// pairs in a sorted comma-joined string so the effect can recover
// everything it needs (eventIds, teamIds, and the id→team_id mapping
// for the merge) WITHOUT depending on the activities array reference.
// This avoids re-firing the effect on upstream array-reference churn
// when the underlying pairs haven't changed, and avoids the
// "ref-during-render" lint pitfall by not needing activitiesRef at all.
export function useEventRsvpCounts(activities) {
  const [summary, setSummary] = useState({});
  const [version, setVersion] = useState(0);

  const stableKey = useMemo(() => {
    return (activities || [])
      .filter((a) => a.id)
      .map((a) => `${a.id}:${a.team_id || ''}`)
      .sort()
      .join(',');
  }, [activities]);

  useEffect(() => {
    let cancelled = false;
    if (!stableKey) {
      Promise.resolve().then(() => { if (!cancelled) setSummary({}); });
      return () => { cancelled = true; };
    }
    const pairs = stableKey.split(',').map((p) => {
      const idx = p.indexOf(':');
      return { eventId: p.slice(0, idx), teamId: p.slice(idx + 1) || null };
    });
    const eventIds = [...new Set(pairs.map((p) => p.eventId))];
    const teamIds = [...new Set(pairs.map((p) => p.teamId).filter(Boolean))];

    // CLAUDE.md §11.5 historical-window exception (Wave 4.8 hygiene
    // PR #124): RSVP-coverage counts compare "responded" against "team
    // size on the activity's date". `team_players` only reflects
    // present-tense membership; `roster_members.left_at IS NULL` is the
    // canonical date-windowed eligibility check per §11.5 line 417.
    // Stay on roster_members.
    Promise.all([
      supabase.from('event_rsvps').select('event_id, response').in('event_id', eventIds),
      supabase.from('roster_members').select('team_id').in('team_id', teamIds).is('left_at', null),
    ]).then(([rsvpRes, rosterRes]) => {
      if (cancelled) return;
      if (rsvpRes.error) { console.warn('useEventRsvpCounts (rsvps):', rsvpRes.error.message); }
      if (rosterRes.error) { console.warn('useEventRsvpCounts (roster):', rosterRes.error.message); }
      // F-9 (audit 2026-06-12): EITHER failure aborts — computing counts
      // from one good + one empty result rendered "0 going · N no reply".
      if (rsvpRes.error || rosterRes.error) return;
      const counts = {};
      (rsvpRes.data || []).forEach((r) => {
        if (!counts[r.event_id]) counts[r.event_id] = { going: 0, not_going: 0, maybe: 0 };
        if (counts[r.event_id][r.response] !== undefined) counts[r.event_id][r.response] += 1;
      });

      const sizes = {};
      (rosterRes.data || []).forEach((rm) => {
        sizes[rm.team_id] = (sizes[rm.team_id] || 0) + 1;
      });

      const next = {};
      pairs.forEach((p) => {
        const c = counts[p.eventId] || { going: 0, not_going: 0, maybe: 0 };
        const size = (p.teamId && sizes[p.teamId]) || 0;
        const noResponse = Math.max(0, size - c.going - c.not_going - c.maybe);
        next[p.eventId] = { ...c, noResponse, total: c.going + c.not_going + c.maybe + noResponse };
      });
      setSummary(next);
    });
    return () => { cancelled = true; };
  }, [stableKey, version]);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  return { counts: summary, refetch };
}
