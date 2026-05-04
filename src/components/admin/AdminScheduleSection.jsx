import { useMemo, useState } from 'react';
import { useNow } from '../../hooks/useNow';
import { formatCountdown } from '../../lib/formatters';
import DateGroupedList from '../schedule/DateGroupedList';
import CollapsibleSection from '../shared/CollapsibleSection';
import Chip from '../shared/Chip';

export default function AdminScheduleSection({ activities }) {
  const now = useNow();
  const weekEnd = now + 7 * 24 * 60 * 60 * 1000;
  const [selectedTeam, setSelectedTeam] = useState(null);

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
      return t >= now - 48 * 60 * 60 * 1000 && t <= weekEnd;
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
      <div className="flex gap-2 overflow-x-auto sf-no-scrollbar" style={{ paddingBottom: 8 }}>
        <Chip label="All Teams" active={!selectedTeam} onClick={() => setSelectedTeam(null)} />
        {teams.map((t) => {
          const next = teamNextEvent[t.id];
          const countdown = next ? formatCountdown(next.start_at) : null;
          return (
            <Chip key={t.id} label={`${t.name}${countdown ? ` · ${countdown}` : ''}`} active={selectedTeam === t.id} color={t.team_color} onClick={() => setSelectedTeam(selectedTeam === t.id ? null : t.id)} />
          );
        })}
      </div>
      {filtered.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--em-text-tertiary)', fontSize: 13 }}>
          No events this week{selectedTeam ? ' for this team' : ''}.
        </div>
      ) : (
        <DateGroupedList events={filtered} />
      )}
    </div>
  );
}
