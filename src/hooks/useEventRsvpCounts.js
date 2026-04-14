import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Given a list of activities, fetches RSVP counts per event and team
// sizes per team in two queries, then computes a summary object per
// event: { going, not_going, maybe, noResponse, total }.
// noResponse is inferred from (teamSize − sum of responses).
export function useEventRsvpCounts(activities) {
  const [summary, setSummary] = useState({});

  useEffect(() => {
    if (!activities || activities.length === 0) { setSummary({}); return; }
    const eventIds = activities.map((a) => a.id);
    const teamIds = [...new Set(activities.map((a) => a.team_id).filter(Boolean))];

    Promise.all([
      supabase.from('event_rsvps').select('event_id, response').in('event_id', eventIds),
      supabase.from('roster_members').select('team_id').in('team_id', teamIds),
    ]).then(([rsvpRes, rosterRes]) => {
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
  }, [activities]);

  return summary;
}
