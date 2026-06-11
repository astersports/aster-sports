import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTeams } from '../hooks/useTeams';
import { useOrgTeamRecords } from '../hooks/useOrgTeamRecords';
import { usePublicTournaments } from '../hooks/usePublicTournaments';
import { EMPTY_SUMMARY } from '../lib/teamRecords';
import { isCompetitiveTeam } from '../lib/teamTypes';
import { supabase } from '../lib/supabase';
import StatHeroBar from '../components/broadcast/StatHeroBar';
import TournamentCard from '../components/broadcast/TournamentCard';
import TeamAccordion from '../components/records/TeamAccordion';
import AdminBackHeader from '../components/admin/AdminBackHeader';

const EYEBROW = { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--as-bc-cobalt)' };

export default function RecordsPage() {
  const { orgId, org } = useAuth();
  const { loading: teamsLoading, teams: allTeams } = useTeams(orgId);
  // C-12: standings are AAU-semantics — exclude camp/clinic/academy teams.
  const teams = useMemo(() => allTeams.filter(isCompetitiveTeam), [allTeams]);
  const { data: tournaments } = usePublicTournaments(orgId);
  const { byTeamId: recordsByTeam } = useOrgTeamRecords(orgId);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [picked, setPicked] = useState(null);
  const [seasons, setSeasons] = useState([]);

  // Org seasons (newest-first) — names for the switcher tabs.
  useEffect(() => {
    if (!orgId) return undefined;
    let cancelled = false;
    supabase.from('seasons').select('id, name, status').eq('org_id', orgId)
      .order('start_date', { ascending: false })
      .then(({ data }) => { if (!cancelled) setSeasons(data || []); });
    return () => { cancelled = true; };
  }, [orgId]);

  // Only seasons that actually have competitive teams; useSeasons is newest-first.
  const seasonTabs = useMemo(() => {
    const present = new Set(teams.map((t) => t.season_id).filter(Boolean));
    return seasons.filter((s) => present.has(s.id));
  }, [teams, seasons]);

  // Derived selection: the user's pick, else the active season (else newest with teams).
  const seasonId = picked ?? (seasonTabs.find((s) => s.status === 'active') || seasonTabs[0])?.id ?? null;
  const activeSeason = seasonTabs.find((s) => s.id === seasonId);
  const seasonTeams = useMemo(() => teams.filter((t) => t.season_id === seasonId), [teams, seasonId]);
  const seasonName = activeSeason?.name || '';
  const totalGames = seasonTeams.reduce((s, t) => s + (recordsByTeam[t.id]?.gamesPlayed || 0), 0);
  const showTournaments = activeSeason?.status === 'active';

  useEffect(() => {
    const prev = document.title;
    document.title = `Records — ${org?.display_name || org?.name || 'Records'}`;
    return () => { document.title = prev; };
  }, [org]);

  const tournamentStats = useMemo(() => ({
    champs: tournaments.reduce((s, t) => s + (t.participants?.filter((p) => p.final_place === 'Champions').length || 0), 0),
    nationalsQualified: tournaments.filter((t) => /national/i.test(t.name)).reduce((s, t) => s + (t.participants?.length || 0), 0),
  }), [tournaments]);

  return (
    <div className="bc-root" style={{ minHeight: 'auto', paddingBottom: 80 }}>
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 0' }}>
        <AdminBackHeader />
        <div style={{ ...EYEBROW, marginBottom: 4 }}>
          {seasonName ? `${seasonName} · ` : ''}{org?.display_name || org?.name || ''}
        </div>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 800, textTransform: 'uppercase', color: '#fff', lineHeight: 1, marginBottom: 4 }}>
          THE <span style={{ color: 'var(--as-bc-cobalt)' }}>RECORDS</span>
        </h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          {[`${seasonTeams.length} Teams`, `${totalGames} Games`].map((t) => (
            <span key={t} className="bc-hero-tag">{t}</span>
          ))}
        </div>
        {seasonTabs.length > 1 && (
          <div role="tablist" aria-label="Season" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
            {seasonTabs.map((s) => {
              const on = s.id === seasonId;
              return (
                <button key={s.id} type="button" role="tab" aria-selected={on} className="as-press"
                  onClick={() => { setPicked(s.id); setExpandedTeam(null); }}
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                    border: on ? '1px solid var(--as-bc-cobalt)' : '1px solid rgba(255,255,255,0.15)',
                    background: on ? 'var(--as-bc-cobalt)' : 'rgba(255,255,255,0.05)', color: on ? '#fff' : 'rgba(255,255,255,0.7)' }}>
                  {s.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div style={{ marginTop: 16 }}>
        <StatHeroBar items={[
          { value: String(tournamentStats.champs), label: 'Championships', variant: 'gold' },
          { value: String(tournamentStats.nationalsQualified), label: 'Nationals Qualified', variant: 'green' },
          { value: String(seasonTeams.length), label: 'Teams' },
        ]} />
      </div>
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ ...EYEBROW, fontSize: 14, marginBottom: 8 }}>All Teams</div>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 800, textTransform: 'uppercase', color: '#fff', lineHeight: 1.05, marginBottom: 16 }}>
          SEASON <span style={{ color: 'var(--as-bc-cobalt)' }}>RECORDS</span>
        </h2>
        <div role="status" aria-live="polite" aria-atomic="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }}>
          {teamsLoading ? 'Loading records...' : `Loaded ${seasonTeams.length} teams.`}
        </div>
        {teamsLoading && Array.from({ length: 5 }).map((_, i) => <div key={i} className="bc-team-skeleton" />)}
        {seasonTeams.map((team) => (
          <TeamAccordion
            key={team.id}
            team={team}
            summary={recordsByTeam[team.id] || EMPTY_SUMMARY}
            expanded={expandedTeam === team.id}
            onToggle={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
          />
        ))}
        {showTournaments && tournaments.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div style={{ ...EYEBROW, fontSize: 14, marginBottom: 8 }}>Tournaments</div>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 800, textTransform: 'uppercase', color: '#fff', lineHeight: 1.05, marginBottom: 16 }}>
              RUN OF <span style={{ color: 'var(--as-bc-cobalt)' }}>PLAY</span>
            </h2>
            {tournaments.map((t) => <TournamentCard key={t.id} tournament={t} />)}
          </div>
        )}
      </div>
    </div>
  );
}
