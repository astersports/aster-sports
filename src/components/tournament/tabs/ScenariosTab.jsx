import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import LoadingSkeleton from '../../shared/LoadingSkeleton';

export default function ScenariosTab({ tournament, teamFilter }) {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tournament?.id) return;
    let cancelled = false;
    supabase.from('championship_scenarios')
      .select('id, condition_label, outcome_color, narrative, team_id, teams(name, team_color)')
      .eq('tournament_id', tournament.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error('ScenariosTab:', error.message);
        setScenarios(data || []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [tournament?.id]);

  if (loading) return <LoadingSkeleton variant="card" count={2} />;

  if (scenarios.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: 'center', backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--as-text-primary)', marginBottom: 6 }}>No scenarios posted yet</div>
        <div style={{ fontSize: 13, color: 'var(--as-text-secondary)' }}>
          Championship scenarios and tiebreaker paths will appear here once the bracket advances.
        </div>
      </div>
    );
  }

  const COLOR_MAP = { green: 'var(--as-success)', red: 'var(--as-danger)', yellow: 'var(--as-warning)', blue: 'var(--as-info)', gray: 'var(--as-neutral)' };

  const display = teamFilter ? scenarios.filter((s) => s.team_id === teamFilter) : scenarios;

  return (
    <div>
      {display.map((s) => {
        const color = COLOR_MAP[s.outcome_color] || 'var(--as-text-primary)';
        return (
          <div key={s.id} style={{ backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)', padding: 14, marginBottom: 10, borderLeft: `4px solid ${color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              {s.teams && <span style={{ fontSize: 13, fontWeight: 600, color: s.teams.team_color || 'var(--as-text-primary)' }}>{s.teams.name}</span>}
              <span style={{ fontSize: 13, fontWeight: 600, color }}>{s.condition_label}</span>
            </div>
            {s.narrative && <div style={{ fontSize: 14, color: 'var(--as-text-secondary)', lineHeight: 1.5 }}>{s.narrative}</div>}
          </div>
        );
      })}
    </div>
  );
}
