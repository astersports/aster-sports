import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';
import { useActivities } from '../hooks/useActivities';
import { useNow } from '../hooks/useNow';
import { useRefetchOnVisible } from '../hooks/useRefetchOnVisible';
import { getWeatherForTime, useWeather } from '../hooks/useWeather';
import { useOrgTeamRecords } from '../hooks/useOrgTeamRecords';
import { useCoachNeedsYou } from '../hooks/useCoachNeedsYou';
import { useParentComingUp } from '../hooks/useParentComingUp';
import HomeShell from '../components/home/HomeShell';
import HomeGreeting from '../components/home/HomeGreeting';
import NeedsYouSection from '../components/home/NeedsYouSection';
import ComingUpSection from '../components/home/ComingUpSection';
import CoachTail from '../components/home/CoachTail';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import { firstNameFrom } from '../lib/greetings';
import { WEATHER_DEFAULT_COORDS } from '../lib/constants';
import { isOffSeason } from '../lib/home/offSeason';

// Coach home — shell-contract-v2 rewrite (home redesign Phase 2). Composes
// HomeShell's inner slots over AppShell chrome. Day-one scopes to TEAM
// (Rule 1); comp card deferred (see CoachTail). useParentComingUp is the
// generic next-event selector (name predates the coach reuse).
export default function CoachHomePage() {
  const { user, orgId } = useAuth();
  const { activeSeason } = useSeason();
  const { activities, loading, refetch } = useActivities();
  const now = useNow();
  useRefetchOnVisible(refetch);
  const navigate = useNavigate();

  const needsYou = useCoachNeedsYou({ userId: user?.id, activities, nowMs: now });
  const excludeIds = useMemo(
    () => needsYou.items.filter((i) => i.event_id).map((i) => i.event_id),
    [needsYou.items],
  );
  const comingUp = useParentComingUp(activities, now, excludeIds);
  const weather = useWeather(...WEATHER_DEFAULT_COORDS);
  const { byTeamId: recordsByTeam, loading: recordsLoading } = useOrgTeamRecords(orgId);
  const offSeason = useMemo(() => isOffSeason(activeSeason, activities, now), [activeSeason, activities, now]);

  const name = firstNameFrom(user);
  const teamCount = needsYou.myTeams.length;
  const sublabel = teamCount ? `${teamCount} team${teamCount !== 1 ? 's' : ''}` : null;

  // Composite gate (anti-pattern #43/#44) — activities + the needs-you signals.
  const isLoading = loading || needsYou.loading;
  if (isLoading) return <div style={{ padding: 24 }} role="status" aria-live="polite"><LoadingSkeleton variant="card" count={2} /></div>;

  return (
    <HomeShell
      greeting={(
        <HomeGreeting name={name} sublabel={sublabel} />
      )}
      needsYou={offSeason ? null : (
        <NeedsYouSection
          {...needsYou}
          onNavigate={navigate}
          emptyHeading="You're all caught up"
          emptySub="Check-ins, scores, and shortfalls show up here."
        />
      )}
      comingUp={offSeason ? null : (
        <ComingUpSection
          event={comingUp}
          weather={getWeatherForTime(weather, comingUp?.start_at)}
          eyebrow="Next team event"
          minimal
          onSeeSchedule={() => navigate('/schedule')}
        />
      )}
      tail={(
        <CoachTail
          teams={needsYou.myTeams}
          recordsByTeam={recordsByTeam}
          recordsLoading={recordsLoading}
          onTeamClick={(id) => navigate(`/schedule?team=${id}`)}
          offSeason={offSeason}
          seasonLabel={activeSeason?.name}
        />
      )}
    />
  );
}
