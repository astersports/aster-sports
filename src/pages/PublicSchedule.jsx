import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { EventCard, SeasonBar, Pill } from './Schedule';
import { useWeather } from '../components/EventInteractions';
import { FILTER_TYPES as EVENT_TYPES, TYPE_LABELS } from '../lib/constants';
import { formatDate } from '../lib/formatters';

export default function PublicSchedule() {
  const { orgSlug, teamSlug } = useParams();
  const [org, setOrg] = useState(null);
  const [season, setSeason] = useState(null);
  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const weatherMap = useWeather(events);

  useEffect(() => {
    async function load() {
      setLoading(true);

      // Fetch org by slug
      const { data: orgData, error: orgErr } = await supabase.from('organizations').select('id, name, slug, brand_colors').eq('slug', orgSlug).single();
      if (orgErr || !orgData) { setError('Organization not found.'); setLoading(false); return; }
      setOrg(orgData);

      // Apply brand colors
      if (orgData.brand_colors) {
        const c = orgData.brand_colors;
        const root = document.documentElement;
        if (c.header) root.style.setProperty('--sf-header', c.header);
        if (c.accent) root.style.setProperty('--sf-accent', c.accent);
        if (c.accent_hover) root.style.setProperty('--sf-accent-hover', c.accent_hover);
        if (c.text_on_dark) root.style.setProperty('--sf-text-on-dark', c.text_on_dark);
      }

      // Season
      const { data: seasonData } = await supabase.from('seasons').select('id, name, start_date, end_date').eq('org_id', orgData.id).eq('status', 'active').single();
      setSeason(seasonData);

      if (!seasonData) { setEvents([]); setTeams([]); setLoading(false); return; }

      // Teams
      const { data: teamsData } = await supabase.from('teams').select('id, name, sort_order, team_color').eq('season_id', seasonData.id).order('sort_order', { ascending: true });
      setTeams(teamsData || []);

      // Find team by slug if specified
      let teamId = null;
      if (teamSlug && teamsData) {
        const match = teamsData.find((t) => t.name.toLowerCase().replace(/\s+/g, '-') === teamSlug);
        if (match) teamId = match.id;
      }

      // Events — full data for interactive components
      let query = supabase.from('events').select('*, teams(id, name, sort_order, team_color), event_changes(id, field_name, old_value, new_value, changed_at), event_duties(id, duty_name, slots_needed, guardian_id, claimed_by_name, claimed_at), event_rsvps(id, player_id, response, comment), event_rides(id, ride_type, seats, name, phone, pickup_location, departure_time, notes, guardian_id), event_comments(id, author_name, body, pinned, created_at)').gte('start_at', new Date().toISOString()).order('start_at', { ascending: true });
      if (teamId) query = query.eq('team_id', teamId);

      const { data: eventsData, error: evErr } = await query;
      if (evErr) { setError('Failed to load schedule.'); }
      else {
        const all = eventsData || [];
        const parentMap = {};
        for (const ev of all) { if (ev.parent_event_id) { (parentMap[ev.parent_event_id] = parentMap[ev.parent_event_id] || []).push(ev); } }
        for (const ev of all) { ev._children = parentMap[ev.id] || []; }
        setEvents(all.filter((ev) => !ev.parent_event_id));
      }

      setLoading(false);
    }
    load();
  }, [orgSlug, teamSlug]);

  const filtered = useMemo(() => {
    return events.filter((e) => typeFilter === 'all' || e.event_type === typeFilter);
  }, [events, typeFilter]);

  const grouped = useMemo(() => {
    const groups = [];
    let currentDate = null;
    for (const event of filtered) {
      const date = new Date(event.start_at).toDateString();
      if (date !== currentDate) { currentDate = date; groups.push({ dateStr: date, date: event.start_at, events: [event] }); }
      else groups[groups.length - 1].events.push(event);
    }
    return groups;
  }, [filtered]);

  if (loading) return <div className="min-h-screen flex items-center justify-center" role="status"><p className="text-(--color-text-secondary)">Loading...</p></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center"><p className="text-red-600">{error}</p></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-(--color-text-primary)">{org?.name}</h1>
        {teamSlug && teams.length > 0 && (
          <p className="text-(--color-text-secondary) text-sm">{teams.find((t) => t.name.toLowerCase().replace(/\s+/g, '-') === teamSlug)?.name || ''}</p>
        )}
      </div>

      <SeasonBar season={season} />

      {/* Type filter only */}
      <div className="flex flex-wrap gap-2 mb-6" role="radiogroup" aria-label="Filter by event type">
        {EVENT_TYPES.map((type) => <Pill key={type} active={typeFilter === type} onClick={() => setTypeFilter(type)} role="radio" aria-checked={typeFilter === type}>{TYPE_LABELS[type]}</Pill>)}
      </div>

      {/* Events */}
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-(--color-text-secondary) text-lg">No upcoming events</p>
        </div>
      )}

      {grouped.map((group) => (
        <div key={group.dateStr} className="mb-6">
          <h2 className="text-sm font-semibold text-(--color-text-secondary) uppercase tracking-wide mb-3">{formatDate(group.date)}</h2>
          <div className="flex flex-col gap-3">
            {group.events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                expanded={expandedId === event.id}
                onToggle={() => setExpandedId(expandedId === event.id ? null : event.id)}
                isNew={false}
                isUpdated={false}
                userRole={null}
                isStaff={false}
                weather={weatherMap[event.id]}
                isPublic={true}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Footer */}
      <p className="text-center text-xs text-(--color-text-secondary) mt-12 pt-4 border-t border-(--color-border-tertiary)">
        Powered by Skyfire
      </p>
    </div>
  );
}
