import { useMemo } from 'react';
import { usePendingRsvps } from './usePendingRsvps';
import { useRideNeeded } from './useRideNeeded';
import { useVolunteerSlots } from './useVolunteerSlots';
import { useLiveNowEvents } from './useLiveNowEvents';
import { useUpcomingTournament } from './useUpcomingTournament';
import { useRecentAchievements } from './useRecentAchievements';
import { useRecentAnnouncements } from './useRecentAnnouncements';
import { useSeasonFinancials } from './useSeasonFinancials';
import { useUpcomingPrep } from './useUpcomingPrep';
import { toKidsWithEvents } from '../lib/home/conflictAdapter';
import { detectConflicts } from '../lib/engine/resolvers/familyGuideHelpers';

// §4.C Sprint D — aggregates parent-home schedule derivations +
// signal hooks. Lifted out of ParentHomePage in PR #304 to keep
// the page under the 150-line cap (anti-pattern #11). Mirrors the
// useAdminHomeSignals pattern from PR #297.

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function useParentHomeSignals({
  activities, myChildren, myTeamIds, now, activeKidFilter,
  userId, orgId, activeSeasonId, guardianId,
}) {
  // ─── Schedule derivations (pure off activities + now + filter) ───
  const myTeams = useMemo(() => {
    const map = new Map();
    for (const a of activities || []) {
      if (!a.team_id || map.has(a.team_id)) continue;
      map.set(a.team_id, { id: a.team_id, name: a.teams?.name || '—', team_color: a.teams?.team_color || 'var(--em-neutral)', sort_order: a.teams?.sort_order ?? 999 });
    }
    return [...map.values()].sort((x, y) => x.sort_order - y.sort_order);
  }, [activities]);

  const nextEventByTeam = useMemo(() => {
    const map = {};
    for (const a of activities || []) {
      if (!a.team_id || a.status === 'cancelled' || !a.start_at) continue;
      if (new Date(a.start_at).getTime() < now) continue;
      if (!map[a.team_id]) map[a.team_id] = a;
    }
    return map;
  }, [activities, now]);

  const next7days = useMemo(() => (activities || [])
    .filter((a) => {
      if (!a.start_at) return false;
      const startT = new Date(a.start_at).getTime();
      return startT >= now && startT < now + SEVEN_DAYS_MS && a.status !== 'cancelled';
    })
    .sort((a, b) => new Date(a.start_at) - new Date(b.start_at)),
    [activities, now]);

  const filteredNext7 = useMemo(() => {
    if (!activeKidFilter) return next7days;
    const kid = (myChildren || []).find((k) => k.playerId === activeKidFilter);
    const ids = kid?.teamIds?.length ? kid.teamIds : (kid?.teamId ? [kid.teamId] : []);
    if (!ids.length) return next7days;
    return next7days.filter((e) => ids.includes(e.team_id));
  }, [next7days, activeKidFilter, myChildren]);

  const teamsById = useMemo(() => Object.fromEntries(myTeams.map((t) => [t.id, t])), [myTeams]);
  const nextEventId = useMemo(
    () => filteredNext7.find((a) => new Date(a.start_at).getTime() >= now)?.id || null,
    [filteredNext7, now],
  );

  // ─── ACTION ZONE signals (HOME_DESIGN_SPEC §1.1.2) ───
  const { pending: pendingRsvps, loading: pendingRsvpsLoading } = usePendingRsvps(myChildren, next7days);
  const { needed: ridesNeeded, loading: rideNeededLoading } = useRideNeeded(myChildren, next7days, userId);
  const { items: volunteerSlots, loading: volunteerSlotsLoading } = useVolunteerSlots(myChildren, next7days);
  const actionItems = useMemo(() => {
    const merged = [...(pendingRsvps || []), ...(ridesNeeded || []), ...(volunteerSlots || [])];
    merged.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
    return merged;
  }, [pendingRsvps, ridesNeeded, volunteerSlots]);
  const actionItemsLoading = pendingRsvpsLoading || rideNeededLoading || volunteerSlotsLoading;

  // ─── Cards + banners ───
  const liveNowItems = useLiveNowEvents(myChildren, activities, now);
  const { tournament: upcomingTournament } = useUpcomingTournament(next7days, now);
  const { achievements: recentAchievements } = useRecentAchievements(myTeamIds, now);
  const { messages: recentAnnouncements } = useRecentAnnouncements(myTeamIds, now);

  // ─── REGISTRATION/PAYMENT REMINDER (§1.1.9) ───
  // Third consumer of useSeasonFinancials per anti-pattern #42.
  const { stats: financialStats, loading: financialsLoading } = useSeasonFinancials(orgId, activeSeasonId, guardianId);

  // ─── UPCOMING PREP (§1.1.5) ───
  // Pure derivation off next7days — first event in T+24h with notes.
  const upcomingPrep = useUpcomingPrep(next7days, now);

  // ─── Multi-kid conflict detection ───
  const conflicts = useMemo(() => {
    if (!myChildren || myChildren.length < 2) return [];
    return detectConflicts(toKidsWithEvents(myChildren, next7days, teamsById));
  }, [myChildren, next7days, teamsById]);

  return {
    myTeams, nextEventByTeam, next7days, filteredNext7, teamsById, nextEventId,
    actionItems, actionItemsLoading,
    liveNowItems,
    upcomingTournament,
    recentAchievements,
    recentAnnouncements,
    financialStats, financialsLoading,
    upcomingPrep,
    conflicts,
  };
}
