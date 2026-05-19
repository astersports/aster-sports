import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';
import { useAdminStats } from '../hooks/useAdminStats';
import { useSeasons } from '../hooks/useSeasons';
import { usePrograms } from '../hooks/usePrograms';
import { useActivities } from '../hooks/useActivities';
import { useAlertEvaluator } from '../hooks/useAlertEvaluator';
import { useRefetchOnVisible } from '../hooks/useRefetchOnVisible';
import { useOrgTeamRecords } from '../hooks/useOrgTeamRecords';
import { useNow } from '../hooks/useNow';
import { useEventRsvpCounts } from '../hooks/useEventRsvpCounts';
import { useLowRsvpEvents } from '../hooks/useLowRsvpEvents';
import { useUnscoredGames } from '../hooks/useUnscoredGames';
import { usePendingInvitations } from '../hooks/usePendingInvitations';
import { getWeatherForTime, useWeather } from '../hooks/useWeather';
import AlertZone from '../components/alerts/AlertZone';
import ActionZone from '../components/home/ActionZone';
import KpiGrid from '../components/admin/KpiGrid';
import QuickActions from '../components/admin/QuickActions';
import AdminManageLinks from '../components/admin/AdminManageLinks';
import ActiveSeasonCard from '../components/admin/ActiveSeasonCard';
import AdminScheduleSection from '../components/admin/AdminScheduleSection';
import NextEventCard from '../components/admin/NextEventCard';
import TeamPerformanceStrip from '../components/admin/TeamPerformanceStrip';
import GettingStarted from '../components/admin/GettingStarted';
import AdminGreeting from '../components/admin/AdminGreeting';
import NotificationHistory from '../components/admin/NotificationHistory';
import AutoNotificationSettingsSheet from '../components/admin/AutoNotificationSettingsSheet';
import PastEventsSection from '../components/schedule/PastEventsSection';
import DensityToggle from '../components/home/DensityToggle';
import Label from '../components/shared/Label';

export default function AdminHomePage() {
  const { user, orgId } = useAuth();
  const { activeSeason } = useSeason();
  const stats = useAdminStats();
  const { seasons } = useSeasons();
  const { programs } = usePrograms();
  const { activities, refetch } = useActivities();
  const { byTeamId: recordsByTeam } = useOrgTeamRecords(orgId);
  const weather = useWeather(41.03, -73.76);
  const { alerts, loading: alertsLoading } = useAlertEvaluator();
  useRefetchOnVisible(refetch);
  const navigate = useNavigate();
  const nextEvent = activities.find((a) => new Date(a.start_at) >= new Date() && a.status !== 'cancelled');
  const [notifSettingsOpen, setNotifSettingsOpen] = useState(false);

  // ACTION QUEUE per HOME_DESIGN_SPEC §3.1 (Admin "Attention Required").
  // Reuses the signal-agnostic ActionZone shell from parent (PR #281)
  // and coach (PR #288). First admin signal: events within 72h with
  // > 50% of roster still no-response. Bound the RSVP counts query
  // to the same 72h slice to keep payload small.
  const now = useNow();
  const next72hActivities = useMemo(
    () => activities.filter((a) => {
      if (!a?.start_at || a.status === 'cancelled') return false;
      const ms = new Date(a.start_at).getTime();
      return ms >= now && ms <= now + 72 * 60 * 60 * 1000;
    }),
    [activities, now],
  );
  const { counts: rsvpCounts } = useEventRsvpCounts(next72hActivities);
  const lowRsvpItems = useLowRsvpEvents(next72hActivities, rsvpCounts, now);
  const { items: unscoredGames, loading: unscoredLoading } = useUnscoredGames(orgId, now);
  const { items: pendingInvitations, loading: invitationsLoading } = usePendingInvitations(orgId, now);
  const adminActionItems = useMemo(
    () => [...(lowRsvpItems || []), ...(unscoredGames || []), ...(pendingInvitations || [])],
    [lowRsvpItems, unscoredGames, pendingInvitations],
  );
  const adminActionLoading = unscoredLoading || invitationsLoading;

  // overflow-x-hidden + max-w-full on the page wrapper is defense in
  // depth — even if a child component escapes its box, nothing drags
  // the page horizontally. `min-w-0` on each section lets flex children
  // actually shrink below their content width (the default is auto,
  // which refuses to shrink and widens the parent).
  return (
    <div className="px-4 py-5 flex flex-col gap-6 sf-fade-in">
      <AdminGreeting user={user} />

      <AlertZone alerts={alerts} loading={alertsLoading} variant="always_visible" sectionLabel="ALERTS" />
      <ActionZone items={adminActionItems} loading={adminActionLoading} />

      <section className="min-w-0" aria-label="Key metrics">
        <KpiGrid stats={stats} />
      </section>

      {nextEvent && <NextEventCard event={nextEvent} weather={getWeatherForTime(weather, nextEvent.start_at)} />}

      <section className="min-w-0" aria-label="Admin shortcuts">
        <Label>ADMIN SHORTCUTS</Label>
        <QuickActions />
      </section>

      <section className="min-w-0" aria-label="Manage">
        <Label>MANAGE</Label>
        <AdminManageLinks />
      </section>

      <section className="min-w-0" aria-label="Teams">
        <Label>TEAMS</Label>
        <TeamPerformanceStrip programs={programs} recordsByTeam={recordsByTeam} navigate={navigate} />
      </section>

      <section className="min-w-0" aria-label="Active season">
        <Label>SEASON</Label>
        <ActiveSeasonCard season={activeSeason} />
      </section>

      <section className="min-w-0" aria-label="Next 7 days">
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <Label style={{ marginBottom: 0 }}>NEXT 7 DAYS</Label>
          <DensityToggle sectionKey="admin-schedule" />
        </div>
        <AdminScheduleSection activities={activities} />
        <PastEventsSection activities={activities} gameResults={{}} weather={weather} />
      </section>

      <section className="min-w-0" aria-label="Notification history">
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <Label style={{ marginBottom: 0 }}>RECENT NOTIFICATIONS</Label>
          <button type="button" aria-label="Notification settings" onClick={() => setNotifSettingsOpen(true)}
            className="sf-press" style={{ minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>
            <Settings size={16} strokeWidth={1.75} color="var(--em-text-tertiary)" />
          </button>
        </div>
        <NotificationHistory orgId={orgId} />
        <AutoNotificationSettingsSheet open={notifSettingsOpen} onClose={() => setNotifSettingsOpen(false)} orgId={orgId} />
      </section>

      <GettingStarted
        hasSeasons={seasons.length > 0}
        hasPrograms={programs.length > 0}
      />
    </div>
  );
}
