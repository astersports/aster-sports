import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRefetchOnVisible } from './useRefetchOnVisible';

export function useAttendanceData(teamId, filter = 'all', range = 'season') {
  const [events, setEvents] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [arrivals, setArrivals] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [activations, setActivations] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const lastKeyRef = useRef(null);

  useEffect(() => {
    if (!teamId) { setLoading(false); return; }
    const key = `${teamId}-${filter}-${range}-${version}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;
    (async () => {
      setLoading(true);
      const lookbackDays = range === '4weeks' ? 28 : 180;
      const now = new Date();
      const lookbackDate = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
      const sixWeeksAhead = new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000);

      let evtQuery = supabase.from('events').select('id, title, event_type, start_at, status')
        .eq('team_id', teamId).neq('status', 'cancelled')
        .gte('start_at', lookbackDate.toISOString()).lte('start_at', sixWeeksAhead.toISOString())
        .order('start_at', { ascending: false }).limit(100);
      if (filter === 'practices') evtQuery = evtQuery.eq('event_type', 'practice');
      else if (filter === 'games') evtQuery = evtQuery.in('event_type', ['game', 'tournament']);

      // CLAUDE.md §11.5 attendance-view exception (Wave 4.8 hygiene
      // PR #124): the attendance grid is a historical view across a
      // lookback window (28d or 180d). roster_members carries the
      // jersey_number alongside the eligibility date-windowing this
      // hook would need if it ever filters by historical eligibility.
      // Stay on roster_members. One of the 5 attendance views named in
      // §11.5 line 421 ("historical date windows in the 5 attendance views").
      const [evtRes, rmRes] = await Promise.all([
        evtQuery,
        supabase.from('roster_members').select('player_id, jersey_number').eq('team_id', teamId),
      ]);

      const rosterData = rmRes.data || [];
      const playerIds = [...new Set(rosterData.map((r) => r.player_id).filter(Boolean))];
      const jerseyMap = {};
      rosterData.forEach((r) => { jerseyMap[r.player_id] = r.jersey_number; });

      const plRes = playerIds.length > 0
        ? await supabase.from('players').select('id, first_name, last_name, member_type').in('id', playerIds)
        : { data: [] };

      const enrichedPlayers = (plRes.data || []).map((p) => ({
        ...p, jersey_number: jerseyMap[p.id] || null,
      }));

      const evtIds = (evtRes.data || []).map((e) => e.id);
      const [rsvpRes, arrRes, ciRes, actRes] = await Promise.all([
        evtIds.length > 0 ? supabase.from('event_rsvps').select('event_id, player_id, response').in('event_id', evtIds) : { data: [] },
        evtIds.length > 0 ? supabase.from('event_arrivals').select('event_id, player_id, status').in('event_id', evtIds) : { data: [] },
        evtIds.length > 0 ? supabase.from('check_ins').select('event_id, player_id, checked_in').in('event_id', evtIds).eq('checked_in', true) : { data: [] },
        evtIds.length > 0 ? supabase.from('player_activations').select('event_id, player_id').in('event_id', evtIds) : { data: [] },
      ]);

      setEvents(evtRes.data || []);
      setPlayers(enrichedPlayers);
      setRsvps(rsvpRes.data || []);
      setArrivals(arrRes.data || []);
      setCheckIns(ciRes.data || []);
      setActivations(actRes.data || []);
      setLoading(false);
    })();
  }, [teamId, filter, range, version]);

  const refetch = useCallback(() => { lastKeyRef.current = null; setVersion((v) => v + 1); setNowMs(Date.now()); }, []);
  useRefetchOnVisible(refetch);

  const grid = useMemo(() => {
    const now = nowMs;
    const rsvpMap = {};
    rsvps.forEach((r) => { rsvpMap[`${r.event_id}-${r.player_id}`] = r.response; });
    const arrMap = {};
    arrivals.forEach((a) => { arrMap[`${a.event_id}-${a.player_id}`] = a.status; });
    const ciMap = {};
    checkIns.forEach((c) => { ciMap[`${c.event_id}-${c.player_id}`] = true; });
    const actSet = new Set();
    activations.forEach((a) => { actSet.add(`${a.event_id}-${a.player_id}`); });

    return players.map((p) => {
      let goingCount = 0, maybeCount = 0, declinedCount = 0, noResponseCount = 0, totalPast = 0;
      let streak = 0, streakBroken = false;
      const isAcademy = p.member_type === 'futures_academy';
      const isGameEvent = (e) => e.event_type === 'game' || e.event_type === 'tournament';

      const cells = events.map((e) => {
        const key = `${e.id}-${p.id}`;
        const rsvp = rsvpMap[key];
        const arrival = arrMap[key];
        const checkedIn = ciMap[key];
        const isPast = new Date(e.start_at).getTime() < now;
        const activated = actSet.has(key);

        if (isAcademy && isGameEvent(e) && !activated) return { eventId: e.id, state: 'not_applicable' };

        if (isPast) {
          totalPast++;
          if (arrival === 'arrived' || checkedIn || rsvp === 'going') { goingCount++; return { eventId: e.id, state: 'attended' }; }
          if (rsvp === 'maybe') { maybeCount++; return { eventId: e.id, state: 'no_response_past' }; }
          if (rsvp === 'not_going') { declinedCount++; return { eventId: e.id, state: 'declined' }; }
          noResponseCount++;
          return { eventId: e.id, state: 'no_response_past' };
        }
        if (rsvp === 'going') return { eventId: e.id, state: 'rsvp_yes' };
        if (rsvp === 'maybe') return { eventId: e.id, state: 'rsvp_maybe' };
        if (rsvp === 'not_going') return { eventId: e.id, state: 'rsvp_no' };
        return { eventId: e.id, state: 'no_response' };
      });

      // Streak: count consecutive attended from most recent past event
      const pastCells = cells.filter((c) => c.state === 'attended' || c.state === 'no_response_past' || c.state === 'declined' || c.state === 'no_show');
      for (const c of pastCells) {
        if (c.state === 'attended') { if (!streakBroken) streak++; }
        else { streakBroken = true; }
      }

      const pct = totalPast > 0 ? Math.round((goingCount / totalPast) * 100) : null;
      const responseRate = totalPast > 0 ? Math.round(((goingCount + declinedCount + maybeCount) / totalPast) * 100) : null;
      return {
        player: p, cells, pct, streak,
        attended: goingCount, expected: totalPast,
        goingCount, maybeCount, declinedCount, noResponseCount, totalPast, responseRate,
      };
    }).sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));
  }, [players, events, rsvps, arrivals, checkIns, activations, nowMs]);

  return { grid, events, loading, refetch };
}
