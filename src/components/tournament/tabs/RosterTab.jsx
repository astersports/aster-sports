import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import LoadingSkeleton from '../../shared/LoadingSkeleton';

export default function RosterTab({ tournament, teamFilter }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tournament?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('tournament_rosters')
        .select('id, roster_status, player_id, team_id, players(id, first_name, last_name, jersey_number), teams(id, name, team_color, sort_order)')
        .eq('tournament_id', tournament.id);
      if (cancelled) return;
      const byTeam = new Map();
      for (const r of (data || [])) {
        if (!r.teams || !r.players) continue;
        const tid = r.team_id;
        if (!byTeam.has(tid)) byTeam.set(tid, { team: r.teams, players: [] });
        byTeam.get(tid).players.push({ ...r.players, roster_status: r.roster_status });
      }
      const sorted = [...byTeam.values()].sort((a, b) => (a.team.sort_order ?? 999) - (b.team.sort_order ?? 999));
      sorted.forEach((t) => t.players.sort((a, b) => (parseInt(a.jersey_number) || 999) - (parseInt(b.jersey_number) || 999)));
      setTeams(sorted);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [tournament?.id]);

  if (loading) return <LoadingSkeleton variant="list" count={5} />;
  const display = teamFilter ? teams.filter((t) => t.team.id === teamFilter) : teams;
  if (display.length === 0) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--as-text-tertiary)', fontSize: 14 }}>No rosters submitted yet.</div>;

  return (
    <div>
      {display.map(({ team, players }) => (
        <div key={team.id} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: team.team_color || 'var(--as-neutral)' }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--as-text-primary)' }}>{team.name}</span>
            <span style={{ fontSize: 13, color: 'var(--as-text-tertiary)' }}>{players.length} players</span>
          </div>
          <div style={{ backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)', overflow: 'hidden' }}>
            {players.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderTop: i === 0 ? 'none' : '1px solid var(--as-border-subtle)' }}>
                <span style={{ width: 28, fontSize: 13, fontWeight: 700, color: team.team_color || 'var(--as-text-primary)', textAlign: 'right' }}>#{p.jersey_number || '—'}</span>
                <span style={{ fontSize: 14, color: 'var(--as-text-primary)' }}>{p.first_name} {p.last_name}</span>
                {p.roster_status !== 'active' && <span style={{ fontSize: 11, color: 'var(--as-text-tertiary)', fontStyle: 'italic' }}>{p.roster_status}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
