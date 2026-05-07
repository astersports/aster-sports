import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { generateTournamentBriefing } from '../lib/tournamentBriefing';

// Two-phase API: loadDraft fetches tournament events + pre-fills coachKeys
// from each game's coach_notes. generate(coachKeys) produces the final
// briefing with admin's edited keys.
//
// Multi-tenant note: Legacy Hoopers is single-org today. When platform goes
// multi-org (M6), scope events query by org_id via team join.

const NY_TZ = 'America/New_York';
const monthDayFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: NY_TZ, month: 'short', day: 'numeric',
});

function formatDateRange(events) {
  if (!events?.length) return '';
  const sorted = [...events].sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  const first = new Date(sorted[0].start_at);
  const last = new Date(sorted[sorted.length - 1].start_at);
  const firstStr = monthDayFmt.format(first);
  const lastStr = monthDayFmt.format(last);
  const year = first.getFullYear();
  if (firstStr === lastStr) return `${firstStr}, ${year}`.toUpperCase();
  const sameMonth = firstStr.split(' ')[0] === lastStr.split(' ')[0];
  if (sameMonth) return `${firstStr}\u2013${lastStr.split(' ')[1]}, ${year}`.toUpperCase();
  return `${firstStr}\u2013${lastStr}, ${year}`.toUpperCase();
}

function buildMapsUrl(ev) {
  if (!ev.location) return null;
  const q = ev.sub_location ? `${ev.location}, ${ev.sub_location}` : ev.location;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function prefillKeys(events) {
  return (events || [])
    .filter((e) => e.coach_notes && e.coach_notes.trim())
    .map((e) => {
      const opp = e.opponent || 'Next game';
      const prefix = e.home_away === 'away' ? `@ ${opp}` : `vs ${opp}`;
      return `${prefix}: ${e.coach_notes.trim()}`;
    })
    .join('\n');
}

export function useTournamentBriefing({ event, team }) {
  const [events, setEvents] = useState(null);
  const [draftKeys, setDraftKeys] = useState('');
  const [survivalText, setSurvivalText] = useState('');
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadDraft = useCallback(async () => {
    if (!event?.tournament_name || !team?.id) {
      setError(new Error('Missing tournament_name or team'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('events')
        .select('id, start_at, end_at, event_type, opponent, home_away, location, sub_location, coach_notes, jersey, arrival_minutes_before, tournament_name')
        .eq('team_id', team.id)
        .eq('tournament_name', event.tournament_name)
        .order('start_at', { ascending: true });
      if (err) throw err;
      if (!data?.length) throw new Error('No events found for this tournament');
      const enriched = data.map((ev) => ({ ...ev, maps_url: buildMapsUrl(ev) }));
      setEvents(enriched);
      setDraftKeys(prefillKeys(enriched));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [event?.tournament_name, team?.id]);

  const generate = useCallback((coachKeys, survival) => {
    if (!events?.length || !team?.name || !event?.tournament_name) return;
    const result = generateTournamentBriefing({
      teamName: team.name,
      tournamentName: event.tournament_name,
      dateLabel: formatDateRange(events),
      events,
      coachKeys: coachKeys ?? draftKeys,
      survivalText: survival ?? survivalText,
      orgName: 'Legacy Hoopers',
    });
    setBriefing(result);
  }, [events, team?.name, event?.tournament_name, draftKeys, survivalText]);

  return { events, draftKeys, setDraftKeys, survivalText, setSurvivalText, briefing, loading, error, loadDraft, generate };
}
