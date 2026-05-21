import { getWeatherForTime } from '../../hooks/useWeather';
import RegistrationReminderCard from '../home/RegistrationReminderCard';
import UpcomingPrepCard from '../home/UpcomingPrepCard';
import LiveNowCard from '../home/LiveNowCard';
import TournamentWeekendBanner from '../home/TournamentWeekendBanner';
import RecognitionCard from '../home/RecognitionCard';
import CoachMessageBlock from '../home/CoachMessageBlock';
import DateGroupedList from '../schedule/DateGroupedList';
import ChildFilterChips from '../schedule/ChildFilterChips';
import PastEventsSection from '../schedule/PastEventsSection';
import MyTeamsStrip from '../home/MyTeamsStrip';
import DensityToggle from '../home/DensityToggle';
import NextEventCard from '../admin/NextEventCard';
import TextEmptyState from '../shared/TextEmptyState';
import Label from '../shared/Label';

// Signal hub for ParentHomePage — Next Event hero, registration
// reminder, upcoming prep, live now, tournament banner, recognition,
// coach messages, MY TEAMS strip, kid filter + NEXT 7 DAYS schedule,
// and past events. Extracted from ParentHomePage in the preemptive
// split arc per L99 platform audit PART 5 Phase 4 / PQ3
// (2026-05-21). Pure presentational — `signals` is the
// useParentHomeSignals output bag; the rest are derived from
// per-event hooks (rsvp/ride/duty counts, game results, weather) and
// org-level state (records, density, kids).
export default function ParentHomeSignalZone({
  signals, loading, orgName,
  recordsByTeam, recordsLoading,
  activities, weather,
  rsvpCounts, rideCounts, dutyCounts, gameResults,
  refetchRsvpCounts, density,
  myChildren, activeKidFilter, onKidFilterChange,
  activeSeasonName, nowMs, onNavigate,
}) {
  const {
    myTeams, nextEventByTeam, filteredNext7, nextEventId,
    liveNowItems, upcomingTournament,
    recentAchievements, recentAnnouncements,
    financialStats, financialsLoading,
    upcomingPrep,
  } = signals;
  const heroEvent = filteredNext7.find((e) => e.id === nextEventId);
  return (
    <>
      {/* 2026-05-20 — parent up-next hero matches admin/coach pattern. */}
      {heroEvent ? <NextEventCard event={heroEvent} weather={getWeatherForTime(weather, heroEvent.start_at)} /> : null}

      <RegistrationReminderCard stats={financialStats} seasonName={activeSeasonName} loading={financialsLoading} />
      <UpcomingPrepCard prep={upcomingPrep} />
      <LiveNowCard items={liveNowItems} nowMs={nowMs} />
      <TournamentWeekendBanner tournament={upcomingTournament} />
      <RecognitionCard achievements={recentAchievements} nowMs={nowMs} />
      <CoachMessageBlock messages={recentAnnouncements} nowMs={nowMs} />

      {!loading && myTeams.length === 0 && (
        <div style={{ padding: 20, backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏀</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)', marginBottom: 4 }}>Welcome to {orgName || 'the team'}</div>
          <div style={{ fontSize: 14, color: 'var(--em-text-secondary)', lineHeight: 1.5 }}>Your coach is getting things set up. Once your child is added to a team, their schedule and events will appear here.</div>
        </div>
      )}

      {myTeams.length > 0 && (
        <>
          <MyTeamsStrip teams={myTeams} byTeamId={recordsByTeam} loading={recordsLoading} nextEventByTeam={nextEventByTeam} onSelect={(teamId) => onNavigate(`/teams/${teamId}`)} />
          <button type="button" onClick={() => onNavigate('/records')} className="sf-press"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 16px', minHeight: 44, backgroundColor: 'var(--em-bg-card)', border: '1px solid var(--em-border-default)', borderRadius: 10, cursor: 'pointer', textAlign: 'left', fontSize: 15, fontWeight: 500, color: 'var(--em-text-primary)' }}>
            <span>View full season records</span>
            <span style={{ fontSize: 17, color: 'var(--em-text-tertiary)' }}>›</span>
          </button>
        </>
      )}

      <section>
        <ChildFilterChips kids={myChildren} activeFilter={activeKidFilter} onChange={onKidFilterChange} />
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
    </>
  );
}
