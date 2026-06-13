import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const NOW = Date.now();
import { ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { usePlayerSeasonStats } from '../hooks/usePlayerSeasonStats';
import { useGoBack } from '../hooks/useGoBack';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import Label from '../components/shared/Label';

export default function PlayerProfilePage() {
  const { teamId, playerId } = useParams();
  const goBack = useGoBack(`/teams/${teamId}`);
  const [player, setPlayer] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const { stats, loading: statsLoading } = usePlayerSeasonStats(teamId);
  const playerStats = stats?.[playerId];

  useEffect(() => {
    if (!playerId || !teamId) return;
    let cancelled = false;
    Promise.all([
      supabase.from('players').select('id, first_name, last_name, grade, dob').eq('id', playerId).maybeSingle(),
      supabase.from('team_players').select('jersey_number, roster_type, status').eq('team_id', teamId).eq('player_id', playerId).maybeSingle(),
      supabase.from('teams').select('id, name, team_color').eq('id', teamId).maybeSingle(),
    ]).then(([pRes, tpRes, tmRes]) => {
      if (cancelled) return;
      if (pRes.data && tpRes.data) setPlayer({ ...pRes.data, ...tpRes.data });
      if (tmRes.data) setTeam(tmRes.data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [playerId, teamId]);

  const dob = player?.dob;
  const age = dob ? Math.floor((NOW - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;

  if (loading) return <div style={{ padding: 24 }}><LoadingSkeleton variant="card" count={2} /></div>;
  if (!player) return <div style={{ padding: 24, color: 'var(--as-text-tertiary)' }}>Player not found.</div>;

  const teamColor = team?.team_color || 'var(--as-accent)';
  const s = playerStats;

  return (
    <div style={{ padding: 16, minHeight: '100%' }}>
      <button type="button" onClick={goBack} className="flex items-center as-press mb-3" style={{ minHeight: 44, background: 'none', border: 'none', color: 'var(--as-accent)', fontSize: 15, fontWeight: 500 }}>
        <ChevronLeft size={20} strokeWidth={1.75} /> Back
      </button>

      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: teamColor, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 28, fontWeight: 800, color: 'var(--as-text-inverse)' }}>
          {player.jersey_number || '—'}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--as-text-primary)' }}>{player.first_name} {player.last_name}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 6 }}>
          {team && <span style={{ fontSize: 13, color: teamColor, fontWeight: 600 }}>{team.name}</span>}
          {player.grade && <span style={{ fontSize: 13, color: 'var(--as-text-tertiary)' }}>Grade {player.grade}</span>}
          {age != null && <span style={{ fontSize: 13, color: 'var(--as-text-tertiary)' }}>{age}y</span>}
          {player.roster_type === 'futures' && <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4, backgroundColor: 'var(--as-academy-soft)', color: 'var(--as-academy)' }}>Academy</span>}
        </div>
      </div>

      {statsLoading ? <LoadingSkeleton variant="card" count={1} /> : s ? (
        <div>
          <Label>Season Stats</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
            {[['PTS', s.pts], ['REB', s.reb], ['AST', s.ast], ['GP', s.games_played]].map(([label, val]) => (
              <div key={label} style={{ padding: 12, backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--as-text-primary)' }}>{val || 0}</div>
                <div style={{ fontSize: 11, color: 'var(--as-text-tertiary)', fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)', padding: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 13 }}>
              {[['FG', `${s.fg_made || 0}/${s.fg_att || 0}`], ['3PT', `${s.three_made || 0}/${s.three_att || 0}`], ['FT', `${s.ft_made || 0}/${s.ft_att || 0}`],
                ['STL', s.stl], ['BLK', s.blk], ['TO', s.to_count], ['PF', s.pf]].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--as-text-tertiary)' }}>{label}</span>
                  <span style={{ fontWeight: 600, color: 'var(--as-text-primary)' }}>{val || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--as-text-tertiary)', fontSize: 14 }}>No stats recorded yet this season.</div>
      )}
    </div>
  );
}
