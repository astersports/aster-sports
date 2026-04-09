import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const EVENT_TYPES = ['all', 'practice', 'game', 'tournament'];

const TYPE_LABELS = {
  all: 'All',
  practice: 'Practice',
  game: 'Game',
  tournament: 'Tournament',
  other: 'Other',
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function TypeBadge({ type }) {
  const colors = {
    practice: 'bg-emerald-100 text-emerald-800',
    game: 'bg-blue-100 text-blue-800',
    tournament: 'bg-purple-100 text-purple-800',
    other: 'bg-slate-100 text-slate-700',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[type] || colors.other}`}>
      {TYPE_LABELS[type] || type}
    </span>
  );
}

function TeamPill({ name }) {
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-on-dark)' }}
    >
      {name}
    </span>
  );
}

function EventCard({ event }) {
  const team = event.teams;
  return (
    <div className="bg-(--color-background) rounded-lg shadow-sm border border-(--color-border-tertiary) p-4">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-sm font-semibold text-(--color-text-primary)">
          {formatTime(event.start_at)}
          {event.end_at && ` – ${formatTime(event.end_at)}`}
        </span>
        {team && <TeamPill name={team.name} />}
        <TypeBadge type={event.event_type} />
      </div>
      <h3 className="font-medium text-(--color-text-primary)">{event.title}</h3>
      {event.opponent && (
        <p className="text-sm text-(--color-text-secondary) mt-1">vs. {event.opponent}</p>
      )}
      {event.location && (
        <p className="text-sm text-(--color-text-secondary) mt-1">{event.location}</p>
      )}
    </div>
  );
}

export default function Schedule() {
  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamFilter, setTeamFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      // Find the active season first
      const seasonRes = await supabase
        .from('seasons')
        .select('id')
        .eq('status', 'active')
        .single();

      if (seasonRes.error) {
        // No active season — show empty state, not an error
        setEvents([]);
        setTeams([]);
        setLoading(false);
        return;
      }

      const activeSeasonId = seasonRes.data.id;

      const [eventsRes, teamsRes] = await Promise.all([
        supabase
          .from('events')
          .select('*, teams(id, name, sort_order)')
          .gte('start_at', new Date().toISOString())
          .order('start_at', { ascending: true }),
        supabase
          .from('teams')
          .select('id, name, sort_order')
          .eq('season_id', activeSeasonId)
          .order('sort_order', { ascending: true }),
      ]);

      if (eventsRes.error) {
        setError('Failed to load schedule.');
        console.error(eventsRes.error);
      } else {
        setEvents(eventsRes.data);
      }

      if (!teamsRes.error) {
        setTeams(teamsRes.data);
      }

      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (teamFilter !== 'all' && e.team_id !== teamFilter) return false;
      if (typeFilter !== 'all' && e.event_type !== typeFilter) return false;
      return true;
    });
  }, [events, teamFilter, typeFilter]);

  const grouped = useMemo(() => {
    const groups = [];
    let currentDate = null;
    for (const event of filtered) {
      const date = new Date(event.start_at).toDateString();
      if (date !== currentDate) {
        currentDate = date;
        groups.push({ date: event.start_at, events: [event] });
      } else {
        groups[groups.length - 1].events.push(event);
      }
    }
    return groups;
  }, [filtered]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Schedule</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-start gap-4 mb-6">
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          aria-label="Filter by team"
          className="border border-(--color-border-tertiary) rounded px-3 py-2 text-sm bg-(--color-background) text-(--color-text-primary) focus:outline-none focus:ring-2 focus:ring-[var(--sf-accent)]"
        >
          <option value="all">All Teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Filter by event type">
          {EVENT_TYPES.map((type) => {
            const active = typeFilter === type;
            return (
              <button
                key={type}
                role="radio"
                aria-checked={active}
                onClick={() => setTypeFilter(type)}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={active
                  ? { backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-on-dark)' }
                  : { backgroundColor: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)' }
                }
              >
                {TYPE_LABELS[type]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {loading && (
        <p className="text-(--color-text-secondary) py-8 text-center" role="status" aria-live="polite">Loading schedule...</p>
      )}

      {error && (
        <p role="alert" className="text-red-600 py-8 text-center">{error}</p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-(--color-text-secondary) text-lg mb-1">No upcoming events</p>
          <p className="text-(--color-text-secondary) text-sm">
            {teamFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your filters.'
              : 'Events will appear here once they are scheduled.'}
          </p>
        </div>
      )}

      {!loading && !error && grouped.map((group) => (
        <div key={group.date} className="mb-6">
          <h2 className="text-sm font-semibold text-(--color-text-secondary) uppercase tracking-wide mb-3">
            {formatDate(group.date)}
          </h2>
          <div className="flex flex-col gap-3">
            {group.events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
