import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { usePendingAchievements } from './usePendingAchievements';
import { useUnpublishedScores } from './useUnpublishedScores';
import { useRecentTeamMessages } from './useRecentTeamMessages';
import { useAlertEvaluator } from './useAlertEvaluator';
import { filterAlertsForCoach } from '../lib/alerts/relevanceFilters';

// §4.C Sprint D — aggregates coach-home queries + signal hooks.
// Lifted out of CoachHomePage in PR #310 so the page stays under
// the 150-line cap (anti-pattern #11). Mirrors useParentHomeSignals
// (PR #304) and useAdminHomeSignals (PR #297).
//
// Owns: team_staff fetch → myTeams + coachedTeamIds, coach-scoped
// alerts via filterAlertsForCoach, ACTION QUEUE aggregation
// (pending achievements + unpublished scores), MESSAGING BLOCK
// data (team-channel messages last 24h excluding coach's own).

export function useCoachHomeSignals(userId, nowMs) {
  const [myTeams, setMyTeams] = useState([]);
  useEffect(() => {
    if (!userId) return;
    Promise.resolve().then(async () => {
      const { data, error } = await supabase
        .from('team_staff')
        .select('team_id, teams(id, name, team_color, sort_order)')
        .eq('user_id', userId);
      if (error) throw error;
      const teams = (data || [])
        .filter((r) => r.teams)
        .map((r) => ({ id: r.teams.id, name: r.teams.name, team_color: r.teams.team_color, sort_order: r.teams.sort_order ?? 999 }));
      setMyTeams(teams.sort((a, b) => a.sort_order - b.sort_order));
    });
  }, [userId]);

  const coachedTeamIds = useMemo(() => myTeams.map((t) => t.id), [myTeams]);

  // Alerts: hook is role-agnostic. Page applies filterAlertsForCoach
  // (data-ownership filter) scoped to coach's team_staff teamIds.
  const { alerts: allAlerts, loading: alertsLoading } = useAlertEvaluator();
  const coachAlerts = useMemo(
    () => filterAlertsForCoach(allAlerts, coachedTeamIds),
    [allAlerts, coachedTeamIds],
  );

  // ACTION QUEUE per HOME_DESIGN_SPEC §2.1.3. Two signals merge into
  // the signal-agnostic ActionZone shell.
  const { items: pendingAchievements, loading: pendingAchievementsLoading } = usePendingAchievements(coachedTeamIds);
  const { items: unpublishedScores, loading: unpublishedScoresLoading } = useUnpublishedScores(coachedTeamIds);
  const actionQueueItems = useMemo(
    () => [...(pendingAchievements || []), ...(unpublishedScores || [])],
    [pendingAchievements, unpublishedScores],
  );
  const actionQueueLoading = pendingAchievementsLoading || unpublishedScoresLoading;

  // MESSAGING BLOCK per HOME_DESIGN_SPEC §2.1.4. Team-channel
  // messages last 24h, excluding coach's own posts. Reuses the same
  // CoachMessageBlock component parent home uses (PR #287); only the
  // data source differs.
  const { messages: recentTeamMessages } = useRecentTeamMessages(coachedTeamIds, userId, nowMs);

  return {
    myTeams, coachedTeamIds,
    coachAlerts, alertsLoading,
    actionQueueItems, actionQueueLoading,
    recentTeamMessages,
  };
}
