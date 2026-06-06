import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';
import { useActivities } from '../hooks/useActivities';
import { useNow } from '../hooks/useNow';
import { useRefetchOnVisible } from '../hooks/useRefetchOnVisible';
import { getWeatherForTime, useWeather } from '../hooks/useWeather';
import { useAdminNeedsYou } from '../hooks/useAdminNeedsYou';
import { useParentComingUp } from '../hooks/useParentComingUp';
import { useEventDraftStatus } from '../hooks/useEventDraftStatus';
import HomeShell from '../components/home/HomeShell';
import HomeGreeting from '../components/home/HomeGreeting';
import NeedsYouSection from '../components/home/NeedsYouSection';
import ComingUpSection from '../components/home/ComingUpSection';
import AdminTail from '../components/home/AdminTail';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import { firstNameFrom } from '../lib/greetings';
import { WEATHER_DEFAULT_COORDS } from '../lib/constants';
import { seasonProgress } from '../lib/seasonProgress';
import { isOffSeason } from '../lib/home/offSeason';

// Admin home — shell-contract-v2 rewrite (home redesign Phase 3). Composes
// HomeShell's inner slots over AppShell chrome; the hooks own the fetching,
// retiring the old equal-weight section stack (the 6 self-fetching cards that
// drove the LCP fan-out). useParentComingUp is the generic next-event selector.
export default function AdminHomePage() {
  const { user, orgId } = useAuth();
  const { activeSeason } = useSeason();
  const { activities, loading, refetch } = useActivities();
  const now = useNow();
  useRefetchOnVisible(refetch);
  const navigate = useNavigate();

  const offSeason = useMemo(() => isOffSeason(activeSeason, activities, now), [activeSeason, activities, now]);
  const needsYou = useAdminNeedsYou({ orgId, activities, seasonId: activeSeason?.id, nowMs: now, offSeason });
  const excludeIds = useMemo(
    () => needsYou.items.filter((i) => i.event_id).map((i) => i.event_id),
    [needsYou.items],
  );
  const comingUp = useParentComingUp(activities, now, excludeIds);
  const comingUpDraft = useEventDraftStatus(comingUp);
  const weather = useWeather(...WEATHER_DEFAULT_COORDS);

  const name = firstNameFrom(user);
  const progress = seasonProgress(activeSeason, now).label;
  const sublabel = activeSeason ? [activeSeason.name, progress].filter(Boolean).join(' · ') : null;

  // Composite gate (anti-pattern #43/#44) — activities + the needs-you signals.
  const isLoading = loading || needsYou.loading;
  if (isLoading) return <div style={{ padding: 24 }} role="status" aria-live="polite"><LoadingSkeleton variant="card" count={2} /></div>;

  return (
    <HomeShell
      greeting={<HomeGreeting name={name} sublabel={sublabel} />}
      needsYou={(
        <NeedsYouSection
          {...needsYou}
          onNavigate={navigate}
          emptyHeading="Nothing needs you"
          emptySub="Briefings, RSVPs, and payments show up here."
        />
      )}
      comingUp={offSeason ? null : (
        <ComingUpSection
          event={comingUp}
          weather={getWeatherForTime(weather, comingUp?.start_at)}
          draft={comingUpDraft}
          onSeeSchedule={() => navigate('/schedule')}
        />
      )}
      tail={<AdminTail season={activeSeason} nowMs={now} eventsCount={activities.length} />}
    />
  );
}
