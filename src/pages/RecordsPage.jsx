import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTeams } from '../hooks/useTeams';
import { useOrgTeamRecords } from '../hooks/useOrgTeamRecords';
import { usePublicTournaments } from '../hooks/usePublicTournaments';
import { EMPTY_SUMMARY } from '../lib/teamRecords';
import { supabase } from '../lib/supabase';
import StatHeroBar from '../components/broadcast/StatHeroBar';
import TournamentCard from '../components/broadcast/TournamentCard';
import TeamAccordion from '../components/records/TeamAccordion';

export default function RecordsPage() {
  const { orgId, org } = useAuth();
  const { loading: teamsLoading, teams } = useTeams(orgId);
  const { data: tournaments } = usePublicTournaments(orgId);
  const { byTeamId: recordsByTeam } = useOrgTeamRecords(orgId);
  const [expandedTeam, setExpandedTeam] = useState(null);

  useEffect(() => {
    const prev = document.title;
    document.title = `Records — ${org?.display_name || org?.name || 'Records'}`;
    return () => { document.title = prev; };
  }, [org]);

  const [totalGames, setTotalGames] = useState(0);
  useEffect(() => {
    // May 16 audit P2 #11 (PR #321): pre-fix the count query had no
    // org scope — `game_results` doesn't carry org_id directly, so a
    // bare `count` rolled in every org's published games (RLS may
    // mask via team-scope in some configs, but the application-layer
    // filter is the right discipline per anti-pattern #37). Scope
    // via events!inner → teams!inner → org_id FK chain.
    if (!orgId) return undefined;
    let cancelled = false;
    supabase.from('game_results')
      .select('id, events!inner(id, teams!inner(id, org_id))', { count: 'exact', head: true })
      .eq('events.teams.org_id', orgId)
      .not('published_at', 'is', null)
      .then(({ count }) => { if (!cancelled) setTotalGames(count || 0); });
    return () => { cancelled = true; };
  }, [orgId]);

  const tournamentStats = useMemo(() => ({
    champs: tournaments.reduce((s, t) => s + (t.participants?.filter((p) => p.final_place === 'Champions').length || 0), 0),
    // Broadened from /nationals/i to /national/i 2026-05-20 — Frank's
    // tournament names are "Zero Gravity Boys/Girls National Finals"
    // (singular "National"), so the plural-only regex matched zero.
    nationalsQualified: tournaments.filter((t) => /national/i.test(t.name)).reduce((s, t) => s + (t.participants?.length || 0), 0),
  }), [tournaments]);

  return (
    <div className="bc-root" style={{ minHeight: 'auto', paddingBottom: 80 }}>
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sf-bc-cobalt)', marginBottom: 4 }}>
          Spring 2026 · {org?.display_name || org?.name || ''}
        </div>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 800, textTransform: 'uppercase', color: '#fff', lineHeight: 1, marginBottom: 4 }}>
          THE <span style={{ color: 'var(--sf-bc-cobalt)' }}>RECORDS</span>
        </h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          {[`${teams.length} Teams`, `${totalGames} Games`].map((t) => (
            <span key={t} className="bc-hero-tag">{t}</span>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <StatHeroBar items={[
          { value: String(tournamentStats.champs), label: 'Championships', variant: 'gold' },
          { value: String(tournamentStats.nationalsQualified), label: 'Nationals Qualified', variant: 'green' },
          { value: String(teams.length), label: 'Active Teams' },
        ]} />
      </div>
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sf-bc-cobalt)', marginBottom: 8 }}>All Teams</div>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 800, textTransform: 'uppercase', color: '#fff', lineHeight: 1.05, marginBottom: 16 }}>
          SEASON <span style={{ color: 'var(--sf-bc-cobalt)' }}>RECORDS</span>
        </h2>
        <div role="status" aria-live="polite" aria-atomic="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }}>
          {teamsLoading ? 'Loading records...' : `Loaded ${teams.length} teams.`}
        </div>
        {teamsLoading && Array.from({ length: 5 }).map((_, i) => <div key={i} className="bc-team-skeleton" />)}
        {teams.map((team) => (
          <TeamAccordion
            key={team.id}
            team={team}
            summary={recordsByTeam[team.id] || EMPTY_SUMMARY}
            expanded={expandedTeam === team.id}
            onToggle={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
          />
        ))}
        {tournaments.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sf-bc-cobalt)', marginBottom: 8 }}>Tournaments</div>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 800, textTransform: 'uppercase', color: '#fff', lineHeight: 1.05, marginBottom: 16 }}>
              RUN OF <span style={{ color: 'var(--sf-bc-cobalt)' }}>PLAY</span>
            </h2>
            {tournaments.map((t) => <TournamentCard key={t.id} tournament={t} />)}
          </div>
        )}
      </div>
    </div>
  );
}
