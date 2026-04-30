import React, { useMemo } from 'react';
import BroadcastHeroHeader from '../components/broadcast/BroadcastHeroHeader';
import StatHeroBar from '../components/broadcast/StatHeroBar';
import TeamIdentityCard from '../components/broadcast/TeamIdentityCard';
import TournamentCard from '../components/broadcast/TournamentCard';
import GameLogRow from '../components/broadcast/GameLogRow';
import { useTeams } from '../hooks/useTeams';
import { useTeamRecords } from '../hooks/useTeamRecords';
import { usePublicTournaments } from '../hooks/usePublicTournaments';
import { LEGACY_HOOPERS_ORG_ID } from '../lib/constants';

const FEATURED_TEAM_NAME = '11U Girls';

function buildTeamMeta(team) {
  if (team.circuit === 'aau') return 'AAU · Zero Gravity';
  if (team.circuit === 'league_play') return 'League Play';
  return team.age_group || '';
}

function formatGameDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function RecordsPreview() {
  const { loading: teamsLoading, error: teamsError, teams } = useTeams();
  const { data: tournaments, loading: tournamentsLoading } = usePublicTournaments(LEGACY_HOOPERS_ORG_ID);
  const featured = useMemo(
    () => teams.find((t) => t.name === FEATURED_TEAM_NAME),
    [teams]
  );

  return (
    <div className="bc-root">
      <BroadcastHeroHeader
        eyebrow="Spring 2026 · Legacy Hoopers"
        headline="THE <b>RECORDS</b>"
        sub="Five teams. One season. Every result, every streak, every stat."
        tags={['Spring 2026', '5 Teams', '27 Games']}
        lastUpdated="Apr 29, 2026"
      />

      <StatHeroBar
        items={[
          { value: 2, label: 'Tournament Champs',   variant: 'gold' },
          { value: 2, label: 'Nationals Qualified', variant: 'green' },
          { value: 5, label: 'Active Teams' },
        ]}
      />

      <div className="bc-page">
        <section className="bc-section">
          <div className="bc-sec-eye">By Team</div>
          <h2 className="bc-sec-h2">SEASON <b>SNAPSHOT</b></h2>
          {teamsError && <div className="bc-empty">Could not load teams. {teamsError.message}</div>}
          {teamsLoading && Array.from({ length: 5 }).map((_, i) => <div key={i} className="bc-team-skeleton" />)}
          {!teamsLoading && !teamsError && teams.map((team, idx) => (
            <TeamCardWithStats key={team.id} team={team} number={idx + 1} />
          ))}
        </section>

        <section className="bc-section">
          <div className="bc-sec-eye">Tournaments</div>
          <h2 className="bc-sec-h2">RUN OF <b>PLAY</b></h2>
          {!tournamentsLoading && tournaments.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </section>

        <section className="bc-section" style={{ paddingBottom: 64 }}>
          <div className="bc-sec-eye">Recent Results · {FEATURED_TEAM_NAME}</div>
          <h2 className="bc-sec-h2">GAME <b>LOG</b></h2>
          {featured ? <FeaturedGameLog teamId={featured.id} /> : <div className="bc-empty">Loading featured team…</div>}
        </section>
      </div>
    </div>
  );
}

function TeamCardWithStats({ team, number }) {
  const { summary } = useTeamRecords(team.id);
  return (
    <TeamIdentityCard
      number={number}
      name={team.name}
      meta={buildTeamMeta(team)}
      teamColor={team.team_color}
      record={summary.record}
      streak={summary.streak}
      stats={summary}
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
