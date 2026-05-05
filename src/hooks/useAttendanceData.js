import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useAttendanceData(teamId, filter = 'all') {
  const [events, setEvents] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [arrivals, setArrivals] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) { setLoading(false); return; }
    (async () => {
      const now = new Date();
      const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
      const sixEventsAhead = new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000);

      let evtQuery = supabase.from('events').select('id, title, event_type, start_at, status')
        .eq('team_id', teamId).neq('status', 'cancelled')
        .gte('start_at', fourWeeksAgo.toISOString()).lte('start_at', sixEventsAhead.toISOString())
        .order('start_at', { ascending: true }).limit(20);
      if (filter === 'practices') evtQuery = evtQuery.eq('event_type', 'practice');
      else if (filter === 'games') evtQuery = evtQuery.in('event_type', ['game', 'tournament']);

      const [evtRes, plRes] = await Promise.all([
        evtQuery,
        supabase.from('roster_members').select('player_id, players(id, first_name, last_name, jersey_number)')
          .eq('team_id', teamId).is('left_at', null),
      ]);

      const evtIds = (evtRes.data || []).map((e) => e.id);
      const [rsvpRes, arrRes] = await Promise.all([
        evtIds.length > 0 ? supabase.from('event_rsvps').select('event_id, player_id, response').in('event_id', evtIds) : { data: [] },
        evtIds.length > 0 ? supabase.from('event_arrivals').select('event_id, player_id, status').in('event_id', evtIds) : { data: [] },
      ]);

      setEvents(evtRes.data || []);
      setPlayers((plRes.data || []).map((r) => r.players).filter(Boolean));
      setRsvps(rsvpRes.data || []);
      setArrivals(arrRes.data || []);
      setLoading(false);
    })();
  }, [teamId, filter]);

  const grid = useMemo(() => {
    const now = Date.now();
    const rsvpMap = {};
    rsvps.forEach((r) => { rsvpMap[`${r.event_id}-${r.player_id}`] = r.response; });
    const arrMap = {};
    arrivals.forEach((a) => { arrMap[`${a.event_id}-${a.player_id}`] = a.status; });

    return players.map((p) => {
      let attended = 0, expected = 0, streak = 0, streakBroken = false;
      const cells = events.map((e) => {
        const key = `${e.id}-${p.id}`;
        const rsvp = rsvpMap[key];
        const arrival = arrMap[key];
        const isPast = new Date(e.start_at).getTime() < now;
        let state = 'no_response';
        if (isPast) {
          if (arrival === 'arrived') { state = 'attended'; attended++; expected++; }
          else if (rsvp === 'going') { state = 'no_show'; expected++; }
          else if (rsvp === 'not_going') state = 'declined';
          else { state = 'no_response_past'; expected++; }
        } else {
          if (rsvp === 'going') state = 'rsvp_yes';
          else if (rsvp === 'maybe') state = 'rsvp_maybe';
          else if (rsvp === 'not_going') state = 'rsvp_no';
        }
        return { eventId: e.id, state };
      });

      const pastCells = cells.filter((_, i) => new Date(events[i]?.start_at).getTime() < now).reverse();
      for (const c of pastCells) {
        if (c.state === 'attended') { if (!streakBroken) streak++; }
        else { streakBroken = true; }
      }

      const pct = expected > 0 ? Math.round((attended / expected) * 100) : null;
      return { player: p, cells, pct, streak, attended, expected };
    }).sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));
  }, [players, events, rsvps, arrivals]);

  return { grid, events, loading };
}
