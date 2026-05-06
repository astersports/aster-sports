import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const TYPE_LABELS = {
  tournament_champion: 'Champion',
  pool_play_winner: 'Pool Winner',
  runner_up: 'Runner-Up',
  most_improved: 'Most Improved',
  sportsmanship: 'Sportsmanship',
  regular_season_champion: 'Season Champ',
};

const TYPE_COLORS = {
  tournament_champion: 'var(--em-accent)',
  pool_play_winner: 'var(--em-success)',
  runner_up: 'var(--em-info)',
  most_improved: 'var(--em-warning)',
};

export default function TeamAchievements({ teamId }) {
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    if (!teamId) return;
    let cancelled = false;
    supabase.from('team_achievements')
      .select('id, achievement_type, event_date, opponent_team_name, tournament_name, location_name, confirmed_at')
      .eq('team_id', teamId)
      .not('confirmed_at', 'is', null)
      .order('event_date', { ascending: false })
      .then(({ data }) => {
        if (!cancelled) setAchievements(data || []);
      });
    return () => { cancelled = true; };
  }, [teamId]);

  if (achievements.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {achievements.map((a) => {
          const color = TYPE_COLORS[a.achievement_type] || 'var(--em-accent)';
          return (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, backgroundColor: 'var(--em-bg-card)', border: '1px solid var(--em-border-default)', boxShadow: 'var(--em-shadow-sm)' }}>
              <Trophy size={14} strokeWidth={1.75} color={color} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color }}>{TYPE_LABELS[a.achievement_type] || a.achievement_type}</div>
                <div style={{ fontSize: 11, color: 'var(--em-text-tertiary)' }}>{a.tournament_name || a.opponent_team_name || ''}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
