import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

// §4.C Sprint C — RECOGNITION card per HOME_DESIGN_SPEC §1.1.6.
// Fetches team_achievements for parent's kids' teams within the
// persistence window. v1 ships a uniform 48h window — covers
// standard 24h + tournament 48h tiers; championship 7d window
// deferred to a future tiered-rendering follow-up.
//
// Filters:
//   - team_id IN (myTeamIds)
//   - confirmed_at IS NOT NULL (published only)
//   - archived_at IS NULL
//   - confirmed_at >= now - 48h
//
// Per anti-pattern #36: data + error destructured separately.
// Per anti-pattern #37: org_id filter via team_id chain (achievements
// don't carry org_id directly — team_id is the canonical scope).

const PERSISTENCE_WINDOW_MS = 48 * 60 * 60 * 1000;

export function useRecentAchievements(myTeamIds, nowMs) {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const teamIds = useMemo(() => (myTeamIds || []).filter(Boolean), [myTeamIds]);

  const refetch = useCallback(async () => {
    if (!teamIds.length) {
      setAchievements([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const cutoffIso = new Date((nowMs || Date.now()) - PERSISTENCE_WINDOW_MS).toISOString();
    const { data, error: e } = await supabase
      .from('team_achievements')
      .select('id, team_id, achievement_type, custom_title, description, badge_emoji, badge_color, opponent_team_name, event_location, confirmed_at, earned_at, teams!inner(id, name, team_color)')
      .in('team_id', teamIds)
      .not('confirmed_at', 'is', null)
      .is('archived_at', null)
      .gte('confirmed_at', cutoffIso)
      .order('confirmed_at', { ascending: false });
    if (e) {
      console.error('useRecentAchievements fetch:', e.message);
      setError(e.message);
      setAchievements([]);
      setLoading(false);
      return;
    }
    setError(null);
    setAchievements(data || []);
    setLoading(false);
  }, [teamIds, nowMs]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  return { achievements, loading, error, refetch };
}
