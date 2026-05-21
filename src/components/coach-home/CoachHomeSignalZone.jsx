import { getWeatherForTime } from '../../hooks/useWeather';
import NextEventCard from '../admin/NextEventCard';
import SectionShell from '../home/SectionShell';
import DateGroupedList from '../schedule/DateGroupedList';
import PastEventsSection from '../schedule/PastEventsSection';
import DensityToggle from '../home/DensityToggle';
import ParentHomeTeamCard from '../home/ParentHomeTeamCard';
import CoachRosterSnapshot from '../coach/CoachRosterSnapshot';
import Label from '../shared/Label';
import CoachMessageBlock from '../home/CoachMessageBlock';
import CoachHomeQuickActions from '../home/CoachHomeQuickActions';
import UpcomingPrepCard from '../home/UpcomingPrepCard';
import RidesTodayCard from '../admin/RidesTodayCard';

// Signal hub for CoachHomePage — pulse-glow Next Event hero, rides
// today, weekly prep, quick actions, team messages, Next-7-Days
// schedule, past events, roster snapshot, and the MY TEAMS strip.
// Extracted from CoachHomePage in the preemptive split arc per L99
// platform audit PART 5 Phase 4 / PQ3 (2026-05-21). Pure
// presentational — `signals` is the useCoachHomeSignals output bag;
// the rest are derived from per-event hooks (rsvp/ride counts, game
// results, weather) and org-level state (records, density).
export default function CoachHomeSignalZone({
  signals, loading, error,
  thisWeek, nextEvent, activities,
  weather, rsvpCounts, rideCounts, gameResults, refetchRsvpCounts,
  density, upcomingPrep, coachRidesSummary,
  recordsByTeam, recordsLoading,
  isViewingAs, nowMs, onTeamClick,
}) {
  const { myTeams, recentTeamMessages } = signals;
  return (
    <>
      <RidesTodayCard summary={coachRidesSummary} loading={coachRidesSummary.loading} />
      <UpcomingPrepCard prep={upcomingPrep} />
      <CoachHomeQuickActions />
      <CoachMessageBlock messages={recentTeamMessages} nowMs={nowMs} />

      {nextEvent && (
        <div style={{
          borderRadius: 12, padding: 2,
          border: '1.5px solid var(--em-accent)',
          boxShadow: 'var(--em-shadow-md)',
        }}>
          <NextEventCard event={nextEvent} weather={getWeatherForTime(weather, nextEvent.start_at)} />
        </div>
      )}

      <SectionShell
        title="NEXT 7 DAYS"
        titleAction={<DensityToggle sectionKey="coach-schedule" />}
        sectionKey="coach-now"
        loading={loading}
        error={error}
        skeletonVariant="card"
        skeletonRows={2}
        empty={thisWeek.length === 0 ? { heading: 'All caught up', message: 'No events in the next 7 days.' } : null}
      >
        {thisWeek.length > 0 && <DateGroupedList events={thisWeek} density={density} rsvpCounts={rsvpCounts} rideCounts={rideCounts} gameResults={gameResults} weather={weather} onRsvpChange={refetchRsvpCounts} />}
      </SectionShell>

      <PastEventsSection activities={activities} rsvpCounts={rsvpCounts} rideCounts={rideCounts} gameResults={gameResults} weather={weather} onRsvpChange={refetchRsvpCounts} />

      {myTeams.length > 0 && (
        <section className="min-w-0" aria-label="Roster snapshot">
          <Label>ROSTER SNAPSHOT</Label>
          <CoachRosterSnapshot teams={myTeams} />
        </section>
      )}

      <SectionShell
        title="MY TEAMS"
        sectionKey="coach-my-teams"
        loading={loading && myTeams.length === 0}
        skeletonVariant="row"
        empty={myTeams.length === 0 ? (isViewingAs
          ? { heading: 'Coach view sample', message: 'You are admin — coach view shows what a coach assigned to a team would see. Assign yourself to a team in Teams admin to populate, or switch back to admin view.' }
          : { heading: 'No teams yet', message: 'Once an admin assigns you to a team, it appears here.' }) : null}
      >
        <div className="flex gap-2 flex-wrap" style={{ paddingBottom: 4 }}>
          {myTeams.map((t) => (
            <ParentHomeTeamCard
              key={t.id}
              team={t}
              summary={recordsByTeam[t.id]}
              loading={recordsLoading}
              onClick={() => onTeamClick(t.id)}
            />
          ))}
        </div>
      </SectionShell>
    </>
  );
}
