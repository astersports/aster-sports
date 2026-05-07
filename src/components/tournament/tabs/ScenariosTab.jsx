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
      <div style={{ padding: 32, textAlign: 'center', backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--em-text-primary)', marginBottom: 6 }}>No scenarios posted yet</div>
        <div style={{ fontSize: 13, color: 'var(--em-text-secondary)' }}>
          Championship scenarios and tiebreaker paths will appear here once the bracket advances.
        </div>
      </div>
    );
  }

  const COLOR_MAP = { green: 'var(--em-success)', red: 'var(--em-danger)', yellow: 'var(--em-warning)', blue: 'var(--em-info)', gray: 'var(--em-neutral)' };

  const display = teamFilter ? scenarios.filter((s) => s.team_id === teamFilter) : scenarios;

  return (
    <div>
      {display.map((s) => {
        const color = COLOR_MAP[s.outcome_color] || 'var(--em-text-primary)';
        return (
          <div key={s.id} style={{ backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', padding: 14, marginBottom: 10, borderLeft: `4px solid ${color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              {s.teams && <span style={{ fontSize: 13, fontWeight: 600, color: s.teams.team_color || 'var(--em-text-primary)' }}>{s.teams.name}</span>}
              <span style={{ fontSize: 13, fontWeight: 600, color }}>{s.condition_label}</span>
            </div>
            {s.narrative && <div style={{ fontSize: 14, color: 'var(--em-text-secondary)', lineHeight: 1.5 }}>{s.narrative}</div>}
          </div>
        );
      })}
    </div>
  );
}
