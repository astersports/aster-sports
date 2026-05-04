import { useEffect, useMemo, useState } from 'react';
import BroadcastHeroHeader from '../components/broadcast/BroadcastHeroHeader';
import StatHeroBar from '../components/broadcast/StatHeroBar';
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

function formatGameDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
}

export default function RecordsPreview() {
  const { orgId, org } = useAuth();
  const { loading: teamsLoading, teams } = useTeams(orgId);
  const { data: tournaments, loading: tournamentsLoading } = usePublicTournaments(orgId);
  const { byTeamId: recordsByTeam } = useOrgTeamRecords(orgId);
  const { lastPublishedAt } = useLastPublishedAt();
  const lastUpdated = formatRelativeTime(lastPublishedAt);
  const [expandedTeam, setExpandedTeam] = useState(null);
  useEffect(() => {
    const prev = document.title;
    document.title = `Records — ${org?.display_name || org?.name || 'Records'}`;
    return () => { document.title = prev; };
  }, [org]);
  const [totalGames, setTotalGames] = useState(0);
  useEffect(() => {
    let c = false;
    supabase.from('game_results').select('*', { count: 'exact', head: true }).not('published_at', 'is', null)
      .then(({ count }) => { if (!c) setTotalGames(count || 0); });
    return () => { c = true; };
  }, []);
  const tournamentStats = useMemo(() => ({
    champs: tournaments.reduce((s, t) => s + (t.participants?.filter((p) => p.final_place === 'Champions').length || 0), 0),
    nationalsQualified: tournaments.filter((t) => /nationals/i.test(t.name)).reduce((s, t) => s + (t.participants?.length || 0), 0),
  }), [tournaments]);
  return (
    <div className="bc-root">
      <BroadcastHeroHeader
        eyebrow={`Spring 2026 · ${org?.display_name || org?.name || ''}`}
        headline="THE" accent="RECORDS"
        sub="Every game. Every score. Every stat."
        tags={['Spring 2026', `${teams.length} Teams`, `${totalGames} Games`]}
        lastUpdated={lastUpdated}
      />
      <StatHeroBar items={[
        { value: String(tournamentStats.champs), label: 'Championships', variant: 'gold' },
        { value: String(tournamentStats.nationalsQualified), label: 'Nationals Qualified', variant: 'green' },
        { value: String(teams.length), label: 'Active Teams' },
      ]} />
      <div className="bc-page">
        <section className="bc-section">
          <div className="bc-sec-eye">All Teams</div>
          <h2 className="bc-sec-h2">SEASON <b>RECORDS</b></h2>
          {teamsLoading && Array.from({ length: 5 }).map((_, i) => <div key={i} className="bc-team-skeleton" />)}
          {teams.map((team) => (
            <TeamAccordion key={team.id} team={team} summary={recordsByTeam[team.id]} expanded={expandedTeam === team.id} onToggle={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)} />
          ))}
        </section>
        {!tournamentsLoading && tournaments.length > 0 && (
          <section className="bc-section" style={{ paddingBottom: 80 }}>
            <div className="bc-sec-eye">Tournaments</div>
            <h2 className="bc-sec-h2">RUN OF <b>PLAY</b></h2>
            {tournaments.map((t) => <TournamentCard key={t.id} tournament={t} />)}
          </section>
        )}
      </div>
    </div>
  );
}

function TeamAccordion({ team, summary, expanded, onToggle }) {
  const s = summary || EMPTY_SUMMARY;
  const meta = team.circuit === 'aau' ? 'AAU · Zero Gravity' : team.circuit === 'league_play' ? 'League Play' : team.age_group || '';
  return (
    <div style={{ marginBottom: 12 }}>
      <button type="button" onClick={onToggle} className="sf-press" style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
        background: 'var(--sf-bc-card, #0e1e33)', border: `1px solid ${expanded ? team.team_color : 'rgba(74,143,212,0.18)'}`,
        borderLeft: `4px solid ${team.team_color}`, borderRadius: 10, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
        transition: 'border-color 200ms',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 800, textTransform: 'uppercase', color: '#fff' }}>{team.name}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{meta}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 800, color: team.team_color, textShadow: `0 0 14px ${team.team_color}40` }}>{s.record}</div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff' }}>{s.streak !== '—' ? s.streak : ''}</div>
        </div>
        <span style={{ fontSize: 15, color: team.team_color, transition: 'transform 200ms', transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
      </button>
      {expanded && <TeamDetail team={team} summary={s} />}
    </div>
  );
}

function TeamDetail({ team, summary }) {
  const s = summary;
  return (
    <div style={{ padding: '12px 20px 20px', background: 'rgba(14,30,51,0.5)', borderLeft: `4px solid ${team.team_color}`, borderRadius: '0 0 10px 10px', marginTop: -1 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, textAlign: 'center', marginBottom: 16, background: '#0e1e33', borderRadius: 10, padding: '12px 8px', border: '1px solid rgba(74,143,212,0.18)' }}>
        <Stat n={s.ppg} l="PPG" color={team.team_color} />
        <Stat n={s.allowed} l="Allowed" color="var(--em-success)" />
        <Stat n={s.diff > 0 ? `+${s.diff}` : s.diff} l="Diff" color={s.diff >= 0 ? 'var(--em-success)' : 'var(--em-danger)'} />
        <Stat n={`${s.winPct}%`} l="Win %" color="#fff" />
        <Stat n={s.gamesPlayed} l="Games" color="#fff" />
      </div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: team.team_color, marginBottom: 8 }}>Game Log</div>
      <TeamGameLog teamId={team.id} />
    </div>
  );
}

function Stat({ n, l, color }) {
  return (
    <div>
      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 800, color, display: 'block' }}>{n}</span>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff', display: 'block', marginTop: 2 }}>{l}</span>
    </div>
  );
}

function TeamGameLog({ teamId }) {
  const { loading, games } = useTeamRecords(teamId);
  if (loading) return <div style={{ padding: 12, color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Loading games…</div>;
  if (games.length === 0) return <div style={{ padding: 12, color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>No games published yet.</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {games.map((g) => (
        <GameLogRow key={g.id} result={g.result} date={formatGameDate(g.event?.start_at)} opponent={g.event?.opponent} score={`${g.our_score}-${g.opponent_score}`} isChampionship={g.event?.is_championship_final === true} />
      ))}
    </div>
  );
}
