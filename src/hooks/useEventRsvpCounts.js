import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

// Given a list of activities, fetches RSVP counts per event and team
// sizes per team in two queries, then computes a summary object per
// event: { going, not_going, maybe, noResponse, total }.
// noResponse is inferred from (teamSize − sum of responses).
export function useEventRsvpCounts(activities) {
  const [summary, setSummary] = useState({});
  const [version, setVersion] = useState(0);
  const lastKeyRef = useRef(null);

  useEffect(() => {
    if (!activities || activities.length === 0) {
      Promise.resolve().then(() => setSummary({}));
      lastKeyRef.current = '';
      return;
    }
    const eventIds = activities.map((a) => a.id).filter(Boolean);
    const teamIds = [...new Set(activities.map((a) => a.team_id).filter(Boolean))];
    const key = [...eventIds].sort().join(',') + '|' + [...teamIds].sort().join(',');
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

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
      if (rsvpRes.error) { console.warn('useEventRsvpCounts (rsvps):', rsvpRes.error.message); }
      if (rosterRes.error) { console.warn('useEventRsvpCounts (roster):', rosterRes.error.message); }
      if (rsvpRes.error && rosterRes.error) return;
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
      activities.forEach((a) => {
        const c = counts[a.id] || { going: 0, not_going: 0, maybe: 0 };
        const size = sizes[a.team_id] || 0;
        const noResponse = Math.max(0, size - c.going - c.not_going - c.maybe);
        next[a.id] = { ...c, noResponse, total: c.going + c.not_going + c.maybe + noResponse };
      });
      setSummary(next);
    });
  }, [activities, version]);

  const refetch = useCallback(() => { lastKeyRef.current = null; setVersion((v) => v + 1); }, []);

  return { counts: summary, refetch };
}
