import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

// §4.C Sprint D — ACTION QUEUE first signal: pending achievements.
// Triggers per HOME_DESIGN_SPEC §2.1.3: team_achievements rows with
// is_pending_confirmation=true on teams the coach helms. Coaches
// see "X pending achievements to confirm" — tap → team detail with
// confirm affordance (Phase 2 wiring).
//
// Output shape matches ActionZone's signal-agnostic contract:
//   { kind, primary, secondary, href, id, team_color, team_name }
// No event_id/player_id/start_at (achievement is team-scoped, not
// event-scoped). ActionZone's null-tolerant secondary line handles
// the lack of start_at gracefully.
//
// Per anti-pattern #36 (data + error) + #37 (team_id-scoped via FK).

export function usePendingAchievements(coachedTeamIds) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const teamIds = useMemo(() => (coachedTeamIds || []).filter(Boolean), [coachedTeamIds]);

  const refetch = useCallback(async () => {
    if (!teamIds.length) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: e } = await supabase
      .from('team_achievements')
      .select('id, team_id, achievement_type, custom_title, description, badge_emoji, teams!inner(id, name, team_color)')
      .in('team_id', teamIds)
      .eq('is_pending_confirmation', true)
      .is('archived_at', null)
      .order('earned_at', { ascending: false });
    if (e) {
      console.error('usePendingAchievements fetch:', e.message);
      setError(e.message);
      setItems([]);
      setLoading(false);
      return;
    }
    const mapped = (data || []).map((a) => {
      const teamName = a.teams?.name || 'Team';
      const title = a.custom_title || a.description || a.achievement_type || 'Achievement';
      return {
        kind: 'achievement_pending',
        primary: `${teamName}: ${title}`,
        secondary: 'Pending your confirmation',
        href: `/teams/${a.team_id}`,
        id: a.id,
        team_color: a.teams?.team_color || 'var(--em-warning)',
        team_name: teamName,
      };
    });
    setError(null);
    setItems(mapped);
    setLoading(false);
  }, [teamIds]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  return { items, loading, error, refetch };
}
