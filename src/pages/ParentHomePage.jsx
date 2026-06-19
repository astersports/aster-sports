import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';
import { useActivities } from '../hooks/useActivities';
import { useNow } from '../hooks/useNow';
import { useRefetchOnVisible } from '../hooks/useRefetchOnVisible';
import { useWeatherContext } from '../context/WeatherContext';
import { useOrgTeamRecords } from '../hooks/useOrgTeamRecords';
import { useRecentAchievements } from '../hooks/useRecentAchievements';
import { useParentNeedsYou } from '../hooks/useParentNeedsYou';
import { useParentComingUp } from '../hooks/useParentComingUp';
import { useEventDraftStatus } from '../hooks/useEventDraftStatus';
import HomeShell from '../components/home/HomeShell';
import RainAlertBanner from '../components/weather/RainAlertBanner';
import HomeGreeting from '../components/home/HomeGreeting';
import NeedsYouSection from '../components/home/NeedsYouSection';
import ComingUpSection from '../components/home/ComingUpSection';
import ParentHomeRegistration from '../components/home/ParentHomeRegistration';
import ParentTail from '../components/home/ParentTail';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import { firstNameFrom } from '../lib/greetings';
import { seasonProgress } from '../lib/seasonProgress';
import { shapeAchievement, shapeChildRecords } from '../lib/home/parentHomeData';
import { isHomeOffSeason } from '../lib/home/offSeason';
import { useActivePrograms } from '../hooks/useActivePrograms';
import { useFamilyPrograms } from '../hooks/useFamilyPrograms';

// Parent home — shell-contract-v2 rewrite (home redesign Phase 1). Composes
// HomeShell's inner slots over AppShell chrome; the data hooks own fetching
// so the shell components stay presentational (fixes the LCP fan-out).
export default function ParentHomePage() {
  const { user, guardianFirstName, myChildren, myTeamIds, orgId, orgName } = useAuth();
  const { activeSeason } = useSeason();
  const { activities, loading, refetch } = useActivities();
  const now = useNow();
  useRefetchOnVisible(refetch);
  const navigate = useNavigate();

  const needsYou = useParentNeedsYou({ myChildren, activities, nowMs: now, userId: user?.id });
  const excludeIds = useMemo(
    () => needsYou.items.filter((i) => i.event_id).map((i) => i.event_id),
    [needsYou.items],
  );
  const comingUp = useParentComingUp(activities, now, excludeIds);
  const comingUpDraft = useEventDraftStatus(comingUp);
  const { weather, getWeatherForTime } = useWeatherContext();
  const { byTeamId: recordsByTeam } = useOrgTeamRecords(orgId);
  const { achievements } = useRecentAchievements(myTeamIds, now);

  const name = guardianFirstName
    ? guardianFirstName.charAt(0).toUpperCase() + guardianFirstName.slice(1)
    : firstNameFrom(user);

  const teamColorById = useMemo(() => {
    const m = new Map();
    for (const a of activities) if (a.team_id && a.teams?.team_color) m.set(a.team_id, a.teams.team_color);
    return m;
  }, [activities]);
  const kids = useMemo(() => (myChildren || []).map((k) => ({
    playerId: k.playerId, label: k.firstName,
    color: teamColorById.get(k.teamId) || 'var(--as-neutral)',
  })), [myChildren, teamColorById]);

  const achievement = useMemo(() => shapeAchievement(achievements[0], recordsByTeam), [achievements, recordsByTeam]);
  const progressLabel = useMemo(() => seasonProgress(activeSeason, now).label, [activeSeason, now]);
  const activePrograms = useActivePrograms();
  const family = useFamilyPrograms();
  const offSeason = useMemo(() => isHomeOffSeason(activePrograms.programs, activities, now), [activePrograms.programs, activities, now]);
  const comingUpEyebrow = useMemo(() => {
    if (!comingUp?.team_id) return 'Next event';
    const kid = (myChildren || []).find((k) => (k.teamIds || []).includes(comingUp.team_id) || k.teamId === comingUp.team_id);
    return kid?.firstName ? `Next · ${kid.firstName}` : 'Next event';
  }, [comingUp, myChildren]);
  const childRecords = useMemo(
    () => shapeChildRecords(myChildren, activities, recordsByTeam, new Set(achievements.map((a) => a.team_id))),
    [myChildren, activities, recordsByTeam, achievements],
  );

  // Composite gate (anti-pattern #43/#44) — wait on activities + the
  // needs-you signals so the page doesn't flash a partial layout.
  const isLoading = loading || needsYou.loading;
  if (isLoading) return <div style={{ padding: 24 }} role="status" aria-live="polite"><LoadingSkeleton variant="card" count={2} /></div>;

  return (
    <HomeShell
      greeting={(
        <HomeGreeting name={name} kids={kids} sublabel={orgName} />
      )}
      alert={<RainAlertBanner key={comingUp?.id} event={comingUp} />}
      needsYou={offSeason ? null : <NeedsYouSection {...needsYou} onNavigate={navigate} />}
      comingUp={offSeason ? null : (
        <ComingUpSection
          event={comingUp}
          weather={getWeatherForTime(weather, comingUp?.start_at)}
          draft={comingUpDraft}
          arrival
          eyebrow={comingUpEyebrow}
          onSeeSchedule={() => navigate('/schedule')}
        />
      )}
      registration={<ParentHomeRegistration family={family.data} onNavigate={navigate} />}
      tail={(
        <ParentTail
          achievement={offSeason ? null : achievement}
          seasonLabel={activeSeason?.name}
          progressLabel={offSeason ? null : progressLabel}
          onViewRecords={() => navigate('/records')}
          onMyFamily={() => navigate('/family')}
          offSeason={offSeason ? { records: childRecords } : null}
        />
      )}
    />
  );
}
