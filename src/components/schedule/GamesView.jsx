import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useOrgTeamRecords } from '../../hooks/useOrgTeamRecords';
import { useTeams } from '../../hooks/useTeams';
import { useSeason } from '../../context/SeasonContext';
import { useNow } from '../../hooks/useNow';
import StandingsTable from './StandingsTable';
import MatchupCard from './MatchupCard';
import Chip from '../shared/Chip';
import Label from '../shared/Label';

function useGameResults(eventIds) {
  const [byEventId, setByEventId] = useState({});
  useEffect(() => {
    if (!eventIds.length) return;
    let cancelled = false;
    Promise.resolve().then(async () => {
      const { data, error } = await supabase.from('game_results')
        .select('event_id, result, our_score, opponent_score, published_at')
        .in('event_id', eventIds)
        .not('published_at', 'is', null);
      if (error) console.error('useGameResults:', error.message);
      if (cancelled) return;
      const map = {};
      for (const r of (data || [])) map[r.event_id] = r;
      setByEventId(map);
    });
    return () => { cancelled = true; };
  }, [eventIds]);
  return byEventId;
}

export default function GamesView({ activities, orgId }) {
  const { byTeamId: recordsByTeamId } = useOrgTeamRecords(orgId);
  const { teams: allTeams } = useTeams(orgId);
  const { activeSeason } = useSeason();
  const seasonStartDate = activeSeason?.start_date;
  const now = useNow();
  const [selectedTeam, setSelectedTeam] = useState(null);

  const gameEvents = useMemo(() =>
    activities
      .filter((a) => (a.event_type === 'game' || a.event_type === 'tournament') && a.status !== 'cancelled')
      .sort((a, b) => new Date(a.start_at) - new Date(b.start_at)),
    [activities]
  );

  const gameTeams = useMemo(() => {
    const seen = new Set();
    const result = [];
    for (const e of gameEvents) {
      if (e.team_id && !seen.has(e.team_id) && e.teams) {
        seen.add(e.team_id);
        result.push({ id: e.team_id, name: e.teams.name, team_color: e.teams.team_color, sort_order: e.teams.sort_order ?? 999 });
      }
    }
    return result.sort((a, b) => a.sort_order - b.sort_order);
  }, [gameEvents]);

  const filtered = useMemo(() => selectedTeam ? gameEvents.filter((e) => e.team_id === selectedTeam) : gameEvents, [gameEvents, selectedTeam]);
  const upcoming = useMemo(() => filtered.filter((e) => new Date(e.start_at).getTime() >= now), [filtered, now]);
  const past = useMemo(() => filtered.filter((e) => new Date(e.start_at).getTime() < now), [filtered, now]);
  const pastIds = useMemo(() => past.map((e) => e.id), [past]);
  const gameResultsMap = useGameResults(pastIds);

  const totalGames = useMemo(() => {
    let count = 0;
    for (const s of Object.values(recordsByTeamId)) count += s.gamesPlayed || 0;
    return count;
  }, [recordsByTeamId]);

  const weekGroups = useMemo(() => {
    const seasonStart = seasonStartDate ? new Date(seasonStartDate).getTime() : null;
    const groups = [];
    let currentKey = null;
    let currentGroup = null;
    for (const e of upcoming) {
      const d = new Date(e.start_at);
      const weekNum = seasonStart ? Math.max(1, Math.ceil((d.getTime() - seasonStart) / (7 * 86400000))) : null;
      const dateLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' });
      const key = `${weekNum || 'x'}-${d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })}`;
      if (key !== currentKey) {
        currentKey = key;
        currentGroup = { weekNum, dateLabel, events: [] };
        groups.push(currentGroup);
      }
      currentGroup.events.push(e);
    }
    return groups;
  }, [upcoming, seasonStartDate]);

  return (
    <div style={{ marginTop: 12 }}>
      <StandingsTable teams={allTeams} recordsByTeamId={recordsByTeamId} totalGames={totalGames} />

      {gameTeams.length > 1 && (
        <div className="flex gap-2 flex-wrap" style={{ paddingBottom: 6, marginBottom: 8 }}>
          <Chip label="All" active={!selectedTeam} onClick={() => setSelectedTeam(null)} />
          {gameTeams.map((t) => (
            <Chip key={t.id} label={t.name} active={selectedTeam === t.id} color={t.team_color} onClick={() => setSelectedTeam(selectedTeam === t.id ? null : t.id)} />
          ))}
        </div>
      )}

      {weekGroups.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--em-text-tertiary)' }}>
          <div style={{ fontSize: 15, fontWeight: 500 }}>No upcoming games</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Check back when the schedule is posted.</div>
        </div>
      )}

      {weekGroups.map((group, i) => (
        <div key={i} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            {group.weekNum && (
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                backgroundColor: 'var(--em-bg-tertiary)', color: 'var(--em-text-secondary)',
              }}>
                WEEK {group.weekNum}
              </span>
            )}
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--em-text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {group.dateLabel}
            </span>
          </div>
          {group.events.map((e) => <MatchupCard key={e.id} event={e} />)}
        </div>
      ))}

      {past.length > 0 && (
        <>
          <Label style={{ marginTop: 24 }}>RESULTS</Label>
          {past.slice(-10).reverse().map((e) => <MatchupCard key={e.id} event={e} gameResult={gameResultsMap[e.id]} />)}
        </>
      )}
    </div>
  );
}
