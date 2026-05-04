import { useEffect, useMemo, useState } from 'react';
import BroadcastHeroHeader from '../components/broadcast/BroadcastHeroHeader';
import StatHeroBar from '../components/broadcast/StatHeroBar';
import TeamIdentityCard from '../components/broadcast/TeamIdentityCard';
import TournamentCard from '../components/broadcast/TournamentCard';
import GameLogRow from '../components/broadcast/GameLogRow';
import { useTeams } from '../hooks/useTeams';
import { useTeamRecords } from '../hooks/useTeamRecords';
import { useOrgTeamRecords } from '../hooks/useOrgTeamRecords';
import { usePublicTournaments } from '../hooks/usePublicTournaments';
import { useLastPublishedAt } from '../hooks/useLastPublishedAt';
import { EMPTY_SUMMARY } from '../lib/teamRecords';
import { formatRelativeTime } from '../lib/formatters';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
function buildTeamMeta(team) {
  if (team.circuit === 'aau') return 'AAU · Zero Gravity';
  if (team.circuit === 'league_play') return 'League Play';
  return team.age_group || '';
}
function formatGameDate(iso) {
  if (!iso) return '';
  // Anchor to venue TZ — both pilot orgs are Northeast US. TODO Phase 6+: derive from event/venue.
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
}
export default function RecordsPreview() {
  const { orgId, org } = useAuth();
  const { loading: teamsLoading, error: teamsError, teams } = useTeams(orgId);
  const { data: tournaments, loading: tournamentsLoading, error: tournamentsError } = usePublicTournaments(orgId);
  const { byTeamId: recordsByTeam } = useOrgTeamRecords(orgId);
  const { lastPublishedAt } = useLastPublishedAt();
  const lastUpdated = formatRelativeTime(lastPublishedAt);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const activeTeam = selectedTeam ? teams.find((t) => t.id === selectedTeam) : null;
  const displayTeams = selectedTeam ? teams.filter((t) => t.id === selectedTeam) : teams;
  const gameLogTeam = activeTeam || teams.find((t) => t.sort_order === 1) || teams[0];
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `Records — ${org?.display_name || org?.name || 'Records'}`;
    return () => { document.title = previousTitle; };
  }, []);
  // Total published game count across all org teams (via public RLS — Migrations 025/028).
  const [totalGames, setTotalGames] = useState(0);
  useEffect(() => {
    let cancelled = false;
    supabase.from('game_results').select('*', { count: 'exact', head: true }).not('published_at', 'is', null)
      .then(({ count }) => { if (!cancelled) setTotalGames(count || 0); });
    return () => { cancelled = true; };
  }, []);
  const tournamentStats = useMemo(() => ({
    champs: tournaments.reduce((s, t) => s + (t.participants?.filter((p) => p.final_place === 'Champions').length || 0), 0),
    nationalsQualified: tournaments.filter((t) => /nationals/i.test(t.name)).reduce((s, t) => s + (t.participants?.length || 0), 0),
  }), [tournaments]);
  return (
    <div className="bc-root">
      <BroadcastHeroHeader
        eyebrow="Spring 2026 · Legacy Hoopers"
        headline="THE"
        accent="RECORDS"
        sub="Five teams. One season. Every result, every streak, every stat."
        tags={['Spring 2026', `${teams.length} Teams`, `${totalGames} Games`]}
        lastUpdated={lastUpdated}
      />
      <StatHeroBar
        items={[
          { value: String(tournamentStats.champs),             label: 'Tournament Champs',   variant: 'gold' },
          { value: String(tournamentStats.nationalsQualified), label: 'Nationals Qualified', variant: 'green' },
          { value: String(teams.length),                       label: 'Active Teams' },
        ]}
      />
      <div className="bc-page">
        <div className="flex gap-2 overflow-x-auto sf-no-scrollbar" style={{ padding: '16px 24px 8px' }}>
          <button type="button" onClick={() => setSelectedTeam(null)} className="sf-press" style={{ flexShrink: 0, minHeight: 32, padding: '0 12px', borderRadius: 999, fontSize: 13, fontWeight: !selectedTeam ? 600 : 400, border: `1.5px solid ${!selectedTeam ? 'rgba(74,143,212,0.6)' : 'rgba(255,255,255,0.15)'}`, backgroundColor: !selectedTeam ? 'rgba(74,143,212,0.15)' : 'transparent', color: !selectedTeam ? '#4a8fd4' : 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}>All Teams</button>
          {teams.map((t) => (
            <button key={t.id} type="button" onClick={() => setSelectedTeam(selectedTeam === t.id ? null : t.id)} className="sf-press" style={{ flexShrink: 0, minHeight: 32, padding: '0 12px', borderRadius: 999, fontSize: 13, fontWeight: selectedTeam === t.id ? 600 : 400, border: `1.5px solid ${selectedTeam === t.id ? t.team_color : 'rgba(255,255,255,0.15)'}`, backgroundColor: selectedTeam === t.id ? `${t.team_color}20` : 'transparent', color: selectedTeam === t.id ? t.team_color : 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}>{t.name}</button>
          ))}
        </div>
        <section className="bc-section">
          <div className="bc-sec-eye">{selectedTeam ? activeTeam?.name : 'By Team'}</div>
          <h2 className="bc-sec-h2">SEASON <b>SNAPSHOT</b></h2>
          {teamsError && <div className="bc-empty">Could not load teams. {teamsError.message}</div>}
          {teamsLoading && Array.from({ length: 5 }).map((_, i) => <div key={i} className="bc-team-skeleton" />)}
          {!teamsLoading && !teamsError && displayTeams.map((team, idx) => (
            <TeamCardWithStats key={team.id} team={team} number={idx + 1} summary={recordsByTeam[team.id]} />
          ))}
        </section>
        <section className="bc-section">
          <div className="bc-sec-eye">Tournaments</div>
          <h2 className="bc-sec-h2">RUN OF <b>PLAY</b></h2>
          {tournamentsError && (
            <div className="bc-empty">Could not load tournaments. Refresh to retry.</div>
          )}
          {!tournamentsLoading && tournaments.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </section>
        <section className="bc-section" style={{ paddingBottom: 64 }}>
          <div className="bc-sec-eye">Recent Results · {gameLogTeam?.name || ''}</div>
          <h2 className="bc-sec-h2">GAME <b>LOG</b></h2>
          {gameLogTeam ? <FeaturedGameLog teamId={gameLogTeam.id} /> : <div className="bc-empty">Loading featured team…</div>}
        </section>
      </div>
    </div>
  );
}
function TeamCardWithStats({ team, number, summary }) {
  const s = summary || EMPTY_SUMMARY;
  return (
    <TeamIdentityCard
      number={number}
      name={team.name}
      meta={buildTeamMeta(team)}
      teamColor={team.team_color}
      record={s.record}
      streak={s.streak}
      stats={s}
    />
  );
}
function FeaturedGameLog({ teamId }) {
  const { loading, error, games } = useTeamRecords(teamId);
  if (error)   return <div className="bc-empty">Could not load games. {error.message}</div>;
  if (loading) return <>{Array.from({ length: 4 }).map((_, i) => <div key={i} className="bc-glog-skeleton" />)}</>;
  if (games.length === 0) return <div className="bc-empty">No games published yet for this team.</div>;
  return (
    <>
      {games.map((g) => (
        <GameLogRow
          key={g.id}
          result={g.result}
          date={formatGameDate(g.event?.start_at)}
          opponent={g.event?.opponent}
          score={`${g.our_score}-${g.opponent_score}`}
          isChampionship={g.event?.is_championship_final === true}
        />
      ))}
    </>
  );
}
