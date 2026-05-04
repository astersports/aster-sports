import { useTeamGamesByTournament } from '../../hooks/useTeamGamesByTournament';
import GameLogRow from '../broadcast/GameLogRow';

function formatGameDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
}

function formatDateRange(start, end) {
  if (!start) return '';
  const s = new Date(start + 'T12:00:00');
  const sm = s.toLocaleDateString('en-US', { month: 'short' });
  const sd = s.getDate();
  if (!end) return `${sm} ${sd}`;
  const e = new Date(end + 'T12:00:00');
  const em = e.toLocaleDateString('en-US', { month: 'short' });
  const ed = e.getDate();
  if (sm === em) return `${sm} ${sd}–${ed}`;
  return `${sm} ${sd}–${em} ${ed}`;
}

function tourneyRecord(games) {
  let w = 0, l = 0;
  games.forEach((g) => { if (g.result === 'W') w++; else if (g.result === 'L') l++; });
  return `${w}-${l}`;
}

export default function TeamGameLog({ teamId, teamColor }) {
  const { loading, grouped } = useTeamGamesByTournament(teamId);
  if (loading) return <>{Array.from({ length: 3 }).map((_, i) => <div key={i} className="bc-glog-skeleton" />)}</>;
  if (grouped.tournaments.length === 0 && grouped.standalone.length === 0) {
    return <div style={{ padding: 12, color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>No games published yet.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {grouped.tournaments.map(({ tournament, games }) => (
        <div key={tournament.id}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: teamColor }}>{tournament.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{formatDateRange(tournament.start_date, tournament.end_date)}</div>
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 800, color: 'var(--sf-bc-text)' }}>{tourneyRecord(games)}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {games.map((g) => (
              <GameLogRow key={g.id} result={g.result} date={formatGameDate(g.event?.start_at)} opponent={g.event?.opponent} score={`${g.our_score}-${g.opponent_score}`} isChampionship={g.event?.is_championship_final === true} />
            ))}
          </div>
        </div>
      ))}
      {grouped.standalone.length > 0 && (
        <div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: teamColor, marginBottom: 8 }}>
            {grouped.tournaments.length > 0 ? 'Other Games' : 'Game Log'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {grouped.standalone.map((g) => (
              <GameLogRow key={g.id} result={g.result} date={formatGameDate(g.event?.start_at)} opponent={g.event?.opponent} score={`${g.our_score}-${g.opponent_score}`} isChampionship={g.event?.is_championship_final === true} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
