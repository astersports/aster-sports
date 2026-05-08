import { useMemo, useState } from 'react';
import { useNow } from '../../hooks/useNow';
import { useEventRsvpCounts } from '../../hooks/useEventRsvpCounts';
import { useEventRideCounts } from '../../hooks/useEventRideCounts';
import { useGameResultsMap } from '../../hooks/useGameResultsMap';
import { useWeather } from '../../hooks/useWeather';
import { useDensity } from '../../hooks/useDensity';
import { formatCountdown } from '../../lib/formatters';
import DateGroupedList from '../schedule/DateGroupedList';
import FilterSelect from '../shared/FilterSelect';

export default function AdminScheduleSection({ activities }) {
  const { counts: rsvpCounts, refetch: refetchRsvpCounts } = useEventRsvpCounts(activities);
  const { counts: rideCounts } = useEventRideCounts(activities);
  const gameResults = useGameResultsMap(activities);
  const weather = useWeather(41.03, -73.76);
  const now = useNow();
  const weekEnd = now + 7 * 24 * 60 * 60 * 1000;
  const [selectedTeam, setSelectedTeam] = useState(null);
  const { density } = useDensity('admin-schedule');

  const teams = useMemo(() => {
    const map = new Map();
    for (const a of activities) {
      if (a.team_id && !map.has(a.team_id) && a.teams) {
        map.set(a.team_id, { id: a.team_id, name: a.teams.name, team_color: a.teams.team_color, sort_order: a.teams.sort_order ?? 999 });
      }
    }
    return [...map.values()].sort((a, b) => a.sort_order - b.sort_order);
  }, [activities]);

  const upcoming = useMemo(() => activities
    .filter((a) => {
      if (!a.start_at || a.status === 'cancelled') return false;
      const t = new Date(a.start_at).getTime();
      return t >= now && t <= weekEnd;
    })
    .sort((a, b) => new Date(a.start_at) - new Date(b.start_at)),
    [activities, now, weekEnd]);

  const filtered = selectedTeam ? upcoming.filter((a) => a.team_id === selectedTeam) : upcoming;

  const teamNextEvent = useMemo(() => {
    const map = {};
    for (const a of upcoming) {
      if (!a.team_id || map[a.team_id]) continue;
      if (new Date(a.start_at).getTime() >= now) map[a.team_id] = a;
    }
    return map;
  }, [upcoming, now]);

  return (
    <div>
      <div style={{ paddingBottom: 8 }}>
        <FilterSelect
          value={selectedTeam}
          onChange={setSelectedTeam}
          options={[{ value: null, label: 'All Teams' }, ...teams.map((t) => {
            const next = teamNextEvent[t.id];
            const countdown = next ? formatCountdown(next.start_at) : null;
            return { value: t.id, label: `${t.name}${countdown ? ` · ${countdown}` : ''}`, color: t.team_color };
          })]}
          ariaLabel="Filter by team"
        />
      </div>
      {filtered.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--em-text-tertiary)', fontSize: 13 }}>
          No events this week{selectedTeam ? ' for this team' : ''}.
        </div>
      ) : (
        <DateGroupedList events={filtered} rsvpCounts={rsvpCounts} rideCounts={rideCounts} density={density} gameResults={gameResults} weather={weather} onRsvpChange={refetchRsvpCounts} />
      )}
    </div>
  );
}
