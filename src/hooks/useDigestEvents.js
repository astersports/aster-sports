import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { periodIsoBounds } from '../lib/engine/digestPeriod';

// Fetches events in [period.start, period.end] (NY-local day) for any
// team in the org, plus joined locations + tournaments + per-event RSVP
// aggregate counts. The DigestComposer slices events per family by
// team_id intersection.
//
// Wave 3.5: locations come embedded via PostgREST; rsvp counts fetched
// in a separate query and aggregated client-side ({ going, maybe, out }
// per event_id).

const RSVP_KEY = { going: 'going', maybe: 'maybe', not_going: 'out' };

export function useDigestEvents({ orgId, period }) {
  const [data, setData] = useState({ events: [], tournaments: [], teams: [], rsvpCountsByEvent: new Map() });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bounds = useMemo(() => periodIsoBounds(period), [period]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      if (!orgId || !bounds.startIso || !bounds.endIso) {
        setData({ events: [], tournaments: [], teams: [], rsvpCountsByEvent: new Map() });
        setLoading(false); setError(null);
        return;
      }
      setLoading(true); setError(null);
      const { data: rows, error: err } = await supabase
        .from('events')
        .select(`
          id, team_id, event_type, start_at, end_at, location, sub_location, location_id,
          opponent, tournament_id, tournament_name,
          is_bracket_placeholder, bracket_placeholder_label, status,
          teams!inner ( id, name, team_color, sort_order, org_id ),
          locations ( id, name, google_maps_url )
        `)
        .eq('teams.org_id', orgId)
        .neq('status', 'cancelled')
        .gte('start_at', bounds.startIso)
        .lt('start_at', bounds.endIso)
        .order('start_at', { ascending: true });
      if (cancelled) return;
      if (err) { setError(err); setData({ events: [], tournaments: [], teams: [], rsvpCountsByEvent: new Map() }); setLoading(false); return; }

      const teamsMap = new Map();
      for (const ev of rows || []) {
        if (ev.teams && !teamsMap.has(ev.teams.id)) teamsMap.set(ev.teams.id, ev.teams);
      }
      const tournamentIds = [...new Set((rows || []).map((r) => r.tournament_id).filter(Boolean))];
      let tournaments = [];
      if (tournamentIds.length) {
        // Beta B1 audit defense-in-depth — anti-pattern #37.
        const { data: trows, error: tErr } = await supabase
          .from('tournaments')
          .select('id, name, start_date, end_date, rules')
          .eq('org_id', orgId)
          .in('id', tournamentIds);
        if (tErr) console.error('useDigestEvents tournaments:', tErr.message);
        tournaments = trows || [];
      }
      const eventIds = (rows || []).map((r) => r.id);
      const rsvpCountsByEvent = new Map();
      if (eventIds.length) {
        const { data: rsvps, error: rErr } = await supabase
          .from('event_rsvps')
          .select('event_id, response')
          .in('event_id', eventIds);
        if (rErr) console.error('useDigestEvents rsvps:', rErr.message);
        for (const ev of rows || []) {
          rsvpCountsByEvent.set(ev.id, { going: 0, maybe: 0, out: 0 });
        }
        for (const r of rsvps || []) {
          const bucket = RSVP_KEY[r.response];
          if (!bucket) continue;
          const counts = rsvpCountsByEvent.get(r.event_id);
          if (counts) counts[bucket] += 1;
        }
      }
      if (cancelled) return;
      setData({ events: rows || [], tournaments, teams: [...teamsMap.values()], rsvpCountsByEvent });
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [orgId, bounds.startIso, bounds.endIso]);

  return { ...data, loading, error };
}
