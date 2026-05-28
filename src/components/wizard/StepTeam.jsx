import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function StepTeam({ orgId, value, onSelect }) {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    if (!orgId) return;
    supabase
      .from('teams')
      .select('id, name, team_color, sort_order')
      .eq('org_id', orgId)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error('StepTeam teams:', error.message);
        setTeams(data || []);
      });
  }, [orgId]);

  return (
    <div style={{ padding: '24px 16px' }}>
      <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)', marginBottom: 16 }}>
        Which team?
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {teams.map((t) => {
          const sel = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              className="em-press"
              style={{
                minHeight: 56, borderRadius: 10,
                border: sel ? '2px solid var(--em-accent)' : '1px solid var(--em-border-default)',
                backgroundColor: sel ? 'var(--em-bg-card-hover)' : 'var(--em-bg-card)',
                padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12,
                textAlign: 'left',
              }}
            >
              <div style={{
                width: 8, height: 32, borderRadius: 4,
                backgroundColor: t.team_color, flexShrink: 0,
              }} />
              <span style={{ fontSize: 15, fontWeight: sel ? 600 : 500, color: 'var(--em-text-primary)' }}>
                {t.name}
              </span>
              {sel && <span style={{ marginLeft: 'auto', color: 'var(--em-accent)', fontSize: 18 }}>✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
