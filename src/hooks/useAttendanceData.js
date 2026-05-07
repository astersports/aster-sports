import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useAttendanceData(teamId, filter = 'all', range = 'season') {
  const [events, setEvents] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [arrivals, setArrivals] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [activations, setActivations] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!teamId) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const now = new Date();
      const lookbackDays = range === '4weeks' ? 28 : 180;
      const seasonStart = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
      const sixWeeksAhead = new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000);

      let evtQuery = supabase.from('events').select('id, title, event_type, start_at, status')
        .eq('team_id', teamId).neq('status', 'cancelled')
        .gte('start_at', seasonStart.toISOString()).lte('start_at', sixWeeksAhead.toISOString())
        .order('start_at', { ascending: false }).limit(100);
      if (filter === 'practices') evtQuery = evtQuery.eq('event_type', 'practice');
      else if (filter === 'games') evtQuery = evtQuery.in('event_type', ['game', 'tournament']);

      const [evtRes, rmRes] = await Promise.all([
        evtQuery,
        supabase.from('roster_members').select('player_id, jersey_number').eq('team_id', teamId),
      ]);
      if (cancelled) return;
      if (evtRes.error) console.warn('useAttendanceData events:', evtRes.error.message);
      if (rmRes.error) console.warn('useAttendanceData roster:', rmRes.error.message);

      const playerIds = [...new Set((rmRes.data || []).map((r) => r.player_id).filter(Boolean))];
      const jerseyMap = {};
      (rmRes.data || []).forEach((r) => { jerseyMap[r.player_id] = r.jersey_number; });

      let playerRows = [];
      if (playerIds.length > 0) {
        const { data: plData, error: plErr } = await supabase
          .from('players').select('id, first_name, last_name, member_type').in('id', playerIds);
        if (cancelled) return;
        if (plErr) console.warn('useAttendanceData players:', plErr.message);
        playerRows = (plData || []).map((p) => ({ ...p, jersey_number: jerseyMap[p.id] ?? null }));
      }

      const evtIds = (evtRes.data || []).map((e) => e.id);
      const [rsvpRes, arrRes, ciRes, actRes] = await Promise.all([
        evtIds.length > 0 ? supabase.from('event_rsvps').select('event_id, player_id, response').in('event_id', evtIds) : { data: [] },
        evtIds.length > 0 ? supabase.from('event_arrivals').select('event_id, player_id, status').in('event_id', evtIds) : { data: [] },
        evtIds.length > 0 ? supabase.from('check_ins').select('event_id, player_id, checked_in').in('event_id', evtIds).eq('checked_in', true) : { data: [] },
        evtIds.length > 0 ? supabase.from('player_activations').select('event_id, player_id').in('event_id', evtIds) : { data: [] },
      ]);
      if (cancelled) return;

      setEvents(evtRes.data || []);
      setPlayers(playerRows);
      setRsvps(rsvpRes.data || []);
      setArrivals(arrRes.data || []);
      setCheckIns(ciRes.data || []);
      setActivations(actRes.data || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [teamId, filter, range, version]);

  useEffect(() => {
    const onFocus = () => setVersion((v) => v + 1);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  const grid = useMemo(() => {
    const now = Date.now();
    const rsvpMap = {};
    rsvps.forEach((r) => { rsvpMap[`${r.event_id}-${r.player_id}`] = r.response; });
    const arrMap = {};
    arrivals.forEach((a) => { arrMap[`${a.event_id}-${a.player_id}`] = a.status; });
    const ciMap = {};
    checkIns.forEach((c) => { ciMap[`${c.event_id}-${c.player_id}`] = true; });
    const actSet = new Set();
    activations.forEach((a) => { actSet.add(`${a.event_id}-${a.player_id}`); });

    return players.map((p) => {
      let attended = 0, expected = 0, streak = 0, streakBroken = false;
      let goingCount = 0, maybeCount = 0, declinedCount = 0, noResponseCount = 0, totalPast = 0;
      const isAcademy = p.member_type === 'futures_academy';
      const cells = events.map((e) => {
        const key = `${e.id}-${p.id}`;
        const rsvp = rsvpMap[key];
        const arrival = arrMap[key];
        const checkedIn = ciMap[key];
        const isPast = new Date(e.start_at).getTime() < now;
        const isGameType = e.event_type === 'game' || e.event_type === 'tournament';
        const isActivated = actSet.has(key);
        let state = 'no_response';
        if (isPast) {
          if (isAcademy && isGameType && !isActivated) {
            state = 'not_applicable';
          } else {
            totalPast++;
            if (arrival === 'arrived' || checkedIn || rsvp === 'going') { state = 'attended'; attended++; expected++; goingCount++; }
            else if (rsvp === 'maybe') { state = 'no_response_past'; maybeCount++; }
            else if (rsvp === 'not_going') { state = 'declined'; declinedCount++; }
            else { state = 'no_response_past'; noResponseCount++; }
          }
        } else {
          if (isAcademy && isGameType && !isActivated) {
            state = 'not_applicable';
          } else {
            if (rsvp === 'going') state = 'rsvp_yes';
            else if (rsvp === 'maybe') state = 'rsvp_maybe';
            else if (rsvp === 'not_going') state = 'rsvp_no';
          }
        }
        return { eventId: e.id, state };
      });

      const pastCells = cells.filter((_, i) => new Date(events[i]?.start_at).getTime() < now).reverse();
      for (const c of pastCells) {
        if (c.state === 'not_applicable') continue;
        if (c.state === 'attended') { if (!streakBroken) streak++; }
        else { streakBroken = true; }
      }

      const pct = totalPast > 0 ? Math.round((goingCount / totalPast) * 100) : null;
      const responded = goingCount + maybeCount + declinedCount;
      const responseRate = totalPast > 0 ? Math.round((responded / totalPast) * 100) : null;
      return { player: p, cells, pct, streak, attended, expected, totalPast, goingCount, maybeCount, declinedCount, noResponseCount, responseRate };
    }).sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));
  }, [players, events, rsvps, arrivals, checkIns, activations]);

  return { grid, events, loading, refetch };
}
