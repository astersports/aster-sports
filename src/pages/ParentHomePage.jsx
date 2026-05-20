import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';
import { useActivities } from '../hooks/useActivities';
import { usePrefetchChildRsvps } from '../hooks/usePrefetchChildRsvps';
import { useRefetchOnVisible } from '../hooks/useRefetchOnVisible';
import { useNow } from '../hooks/useNow';
import { useEventRsvpCounts } from '../hooks/useEventRsvpCounts';
import { useEventRideCounts } from '../hooks/useEventRideCounts';
import { useEventDutyCounts } from '../hooks/useEventDutyCounts';
import { useGameResultsMap } from '../hooks/useGameResultsMap';
import { useWeather } from '../hooks/useWeather';
import { useOrgTeamRecords } from '../hooks/useOrgTeamRecords';
import { useDensity } from '../hooks/useDensity';
import { useAlertEvaluator } from '../hooks/useAlertEvaluator';
import { useParentHomeSignals } from '../hooks/useParentHomeSignals';
import RegistrationReminderCard from '../components/home/RegistrationReminderCard';
import ActionZone from '../components/home/ActionZone';
import LiveNowCard from '../components/home/LiveNowCard';
import TournamentWeekendBanner from '../components/home/TournamentWeekendBanner';
import RecognitionCard from '../components/home/RecognitionCard';
import CoachMessageBlock from '../components/home/CoachMessageBlock';
import DateGroupedList from '../components/schedule/DateGroupedList';
import ChildFilterChips from '../components/schedule/ChildFilterChips';
import PastEventsSection from '../components/schedule/PastEventsSection';
import MyTeamsStrip from '../components/home/MyTeamsStrip';
import DensityToggle from '../components/home/DensityToggle';
import ConflictCallout from '../components/home/ConflictCallout';
import AlertZone from '../components/alerts/AlertZone';
import TextEmptyState from '../components/shared/TextEmptyState';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import Label from '../components/shared/Label';
import { firstNameFrom, greetingFor } from '../lib/greetings';
import { filterAlertsForParent } from '../lib/alerts/relevanceFilters';

export default function ParentHomePage() {
  const { user, guardianFirstName, guardianId, myChildren, myTeamIds, orgId, orgName } = useAuth();
  const { activeSeason } = useSeason();
  const { activities, loading, refetch } = useActivities();
  const { byTeamId: recordsByTeam, loading: recordsLoading } = useOrgTeamRecords(orgId);
  const navigate = useNavigate();
  const [activeKidFilter, setActiveKidFilter] = useState(null);
  const name = guardianFirstName ? guardianFirstName.charAt(0).toUpperCase() + guardianFirstName.slice(1) : firstNameFrom(user);
  usePrefetchChildRsvps(activities, myChildren);
  const now = useNow();
  useRefetchOnVisible(refetch);
  const { density } = useDensity('parent-home');

  // All HOME_DESIGN_SPEC §1.1 schedule derivations + signal hooks
  // (action zone, live now, tournament banner, recognition,
  // announcements, conflicts, payment reminder) live in
  // useParentHomeSignals — extracted in PR #304 to keep this page
  // under the 150-line cap (anti-pattern #11). Mirrors the
  // useAdminHomeSignals pattern from PR #297.
  const {
    myTeams, nextEventByTeam, filteredNext7, nextEventId,
    actionItems, actionItemsLoading,
    liveNowItems,
    upcomingTournament,
    recentAchievements,
    recentAnnouncements,
    financialStats, financialsLoading,
    conflicts,
  } = useParentHomeSignals({
    activities, myChildren, myTeamIds, now, activeKidFilter,
    userId: user?.id,
    orgId, activeSeasonId: activeSeason?.id, guardianId,
  });

  const { counts: rsvpCounts, refetch: refetchRsvpCounts } = useEventRsvpCounts(filteredNext7);
  const { counts: rideCounts } = useEventRideCounts(filteredNext7);
  const { counts: dutyCounts } = useEventDutyCounts(filteredNext7);
  const gameResults = useGameResultsMap(filteredNext7);
  const weather = useWeather(41.03, -73.76);

  // Alerts: hook is role-agnostic. Page applies data-ownership
  // filter so parent sees only alerts touching their kids' teams.
  const { alerts: allAlerts, loading: alertsLoading } = useAlertEvaluator();
  const parentAlerts = useMemo(() => filterAlertsForParent(allAlerts, myChildren), [allAlerts, myChildren]);

  if (loading) return <div style={{ padding: 24 }} role="status" aria-live="polite"><LoadingSkeleton variant="card" count={2} /></div>;

  return (
    <div className="px-4 py-5 flex flex-col gap-6 sf-fade-in">
      <section>
        <div style={{ color: 'var(--em-text-tertiary)', fontSize: 13 }}>{greetingFor()},</div>
        <h1 className="font-bold" style={{ color: 'var(--em-text-primary)', fontSize: 24, letterSpacing: '-0.025em', lineHeight: 1.2 }}>{name}</h1>
        {orgName && <div style={{ color: 'var(--em-text-tertiary)', fontSize: 13, marginTop: 2 }}>{orgName}{myTeams.length > 0 ? ` · ${myTeams.length} team${myTeams.length !== 1 ? 's' : ''}` : ''}</div>}
      </section>

      <AlertZone alerts={parentAlerts} loading={alertsLoading} variant="collapsible" sectionLabel="ALERTS" />
      <ConflictCallout conflicts={conflicts} />
      <RegistrationReminderCard stats={financialStats} seasonName={activeSeason?.name} loading={financialsLoading} />
      <ActionZone items={actionItems} loading={actionItemsLoading} sectionKey="parent-action-zone" />
      <LiveNowCard items={liveNowItems} nowMs={now} />
      <TournamentWeekendBanner tournament={upcomingTournament} />
      <RecognitionCard achievements={recentAchievements} nowMs={now} />
      <CoachMessageBlock messages={recentAnnouncements} nowMs={now} />

      {!loading && myTeams.length === 0 && (
        <div style={{ padding: 20, backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏀</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)', marginBottom: 4 }}>Welcome to {orgName || 'the team'}</div>
          <div style={{ fontSize: 14, color: 'var(--em-text-secondary)', lineHeight: 1.5 }}>Your coach is getting things set up. Once your child is added to a team, their schedule and events will appear here.</div>
        </div>
      )}

      {myTeams.length > 0 && (
        <>
          <MyTeamsStrip teams={myTeams} byTeamId={recordsByTeam} loading={recordsLoading} nextEventByTeam={nextEventByTeam} onSelect={(teamId) => navigate(`/teams/${teamId}`)} />
          <button type="button" onClick={() => navigate('/records')} className="sf-press"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 16px', minHeight: 44, backgroundColor: 'var(--em-bg-card)', border: '1px solid var(--em-border-default)', borderRadius: 10, cursor: 'pointer', textAlign: 'left', fontSize: 15, fontWeight: 500, color: 'var(--em-text-primary)' }}>
            <span>View full season records</span>
            <span style={{ fontSize: 17, color: 'var(--em-text-tertiary)' }}>›</span>
          </button>
        </>
      )}

      <section>
        <ChildFilterChips kids={myChildren} activeFilter={activeKidFilter} onChange={setActiveKidFilter} />
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <Label style={{ marginBottom: 0 }}>NEXT 7 DAYS</Label>
          <DensityToggle sectionKey="parent-home" />
        </div>
        {filteredNext7.length > 0 ? (
          <DateGroupedList events={filteredNext7} rsvpCounts={rsvpCounts} rideCounts={rideCounts} dutyCounts={dutyCounts} nextEventId={nextEventId} density={density} gameResults={gameResults} weather={weather} onRsvpChange={refetchRsvpCounts} />
        ) : (
          <TextEmptyState heading="Clear week ahead" message="No events coming up. Time to work on those crossovers." />
        )}
        <PastEventsSection activities={activities} rsvpCounts={rsvpCounts} rideCounts={rideCounts} dutyCounts={dutyCounts} gameResults={gameResults} weather={weather} onRsvpChange={refetchRsvpCounts} />
      </section>
    </div>
  );
}
