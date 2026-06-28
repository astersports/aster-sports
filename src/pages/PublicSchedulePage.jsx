import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PoweredByFooter from '../components/shared/PoweredByFooter';
import PublicScheduleSkeleton from '../components/public-schedule/PublicScheduleSkeleton';
import PublicScheduleMessage from '../components/public-schedule/PublicScheduleMessage';
import PublicScheduleHeader from '../components/public-schedule/PublicScheduleHeader';
import PublicScheduleList from '../components/public-schedule/PublicScheduleList';
import PublicScheduleActions from '../components/public-schedule/PublicScheduleActions';
import { groupEventsByDay, nyDayKey } from '../components/public-schedule/groupEventsByDay';
import { usePublicScheduleMeta } from '../components/public-schedule/usePublicScheduleMeta';

const SR_ONLY = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' };

export default function PublicSchedulePage() {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  // E4: bumping this key re-runs the load effect so the error state's
  // "Try again" retries without a full page reload.
  const [reloadKey, setReloadKey] = useState(0);
  // E5/E1: a single load-time clock keeps countdown + "Today" labels pure
  // (no Date.now() in render). Re-derived only when a load completes.
  const [now, setNow] = useState(() => new Date());

  // RLS (anon): teams_select_public + events_select_public gate via the
  // SECURITY DEFINER org_is_public_listed() helper (P0 lane STEP 2,
  // 2026-06-12 — repairs the fail-closed gate shipped in 20260528140000,
  // which subqueried organizations that anon cannot read). The feed token +
  // org display name come from the gated get_public_subscribe_info() RPC;
  // anon bulk SELECT of teams.team_feed_token was revoked in STEP 1.
  /* eslint-disable react-hooks/set-state-in-effect */
  // Async data-load effect: the loading/error flags sync the fetch lifecycle
  // (an external async event) — a legitimate effect use, so disable the
  // conservative synchronous-setState-in-effect rule for this block.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);
    (async () => {
      const startedAt = new Date();
      const [teamRes, eventsRes, infoRes] = await Promise.all([
        supabase.from('teams').select('id, name, team_color, org_id').eq('id', teamId).maybeSingle(),
        supabase.from('events').select('id, title, event_type, start_at, end_at, opponent, home_away, location_name:location, status')
          .eq('team_id', teamId).neq('status', 'cancelled')
          .gte('start_at', startedAt.toISOString())
          .order('start_at', { ascending: true }).limit(50),
        supabase.rpc('get_public_subscribe_info', { p_team_id: teamId }),
      ]);
      if (!active) return;
      if (teamRes.error || eventsRes.error) {
        console.error('PublicSchedule load:', (teamRes.error || eventsRes.error).message);
        setLoadError(true);
        setLoading(false);
        return;
      }
      // RPC failure degrades to "subscribe unavailable", not a page error.
      const info = infoRes.data?.[0] || null;
      setTeam(teamRes.data
        ? { ...teamRes.data, team_feed_token: info?.feed_token ?? null, org_display_name: info?.org_display_name ?? '' }
        : null);
      setEvents(eventsRes.data || []);
      setNow(startedAt);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [teamId, reloadKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const orgName = team?.org_display_name || '';
  usePublicScheduleMeta(team, orgName, teamId);

  // E1: bucket the (already-ascending) events into NY-day groups for sticky
  // day headers. Memoized so grouping doesn't recompute every render.
  const groups = useMemo(() => groupEventsByDay(events), [events]);
  const todayKey = useMemo(() => nyDayKey(now.toISOString()), [now]);
  const nextEvent = events[0] || null;

  if (loading) return <PublicScheduleSkeleton />;
  if (loadError) {
    return (
      <PublicScheduleMessage
        variant="error"
        title="Couldn't load this schedule"
        body="Something went wrong on our end. Check your connection and try again in a moment."
        onRetry={() => setReloadKey((k) => k + 1)}
        retryLabel="Try again"
      />
    );
  }
  if (!team) {
    return (
      <PublicScheduleMessage
        variant="notFound"
        title="Team not found"
        body="This schedule link may have changed or expired. Double-check the link, or ask whoever shared it for an updated one."
      />
    );
  }

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '16px 16px 80px', backgroundColor: 'var(--as-bg-page)', minHeight: '100vh' }}>
      <PublicScheduleHeader team={team} orgName={orgName} eventCount={events.length} nextEvent={nextEvent} now={now} />

      <p role="status" aria-live="polite" style={SR_ONLY}>
        {events.length} upcoming event{events.length !== 1 ? 's' : ''} loaded for {team.name}.
      </p>

      {events.length === 0 ? (
        <PublicScheduleMessage
          inline
          variant="empty"
          title="No upcoming events yet"
          body="Nothing on the calendar right now — check back soon, or subscribe below so new games land on your phone automatically."
        />
      ) : (
        <PublicScheduleList groups={groups} now={now} todayKey={todayKey} accentColor={team.team_color || 'var(--as-accent)'} />
      )}

      <PublicScheduleActions team={team} teamId={teamId} events={events} />

      <PoweredByFooter links />
    </main>
  );
}
