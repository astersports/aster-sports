import { memo } from 'react';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCountdown } from '../../lib/formatters';
import { eventKindLabel, eventKindVariant } from '../../lib/eventKind';
import { formatEventTitle } from '../../lib/eventTitle';
import { useAuth } from '../../context/AuthContext';
import { useNow } from '../../hooks/useNow';
import { getDirectionUrls } from '../../lib/mapsUrls';
import { eventTimeState, isRsvpOpen } from '../../lib/eventWindows';
import { isWithinForecastWindow } from '../../lib/weather/forecastWindow';
import { isStaff } from '../../lib/permissions';
import { cacheKey } from '../../lib/rsvpCache';
import { isGameType as isGame } from '../../lib/rsvpEligibility';
import { dutiesEnabledFor, ridesEnabledFor } from '../../lib/featureGates';
import ChildRsvp from '../shared/ChildRsvp';
import EventCardFacts from './EventCardFacts';
import Badge from '../shared/Badge';

const railTime = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }).split(' ');

// R2 time-rail card (visual pass round 2, ratified 2026-06-12). Rail =
// the schedule's axis: team-colored time numerals + weather; content =
// title row (ONE status pill max) · meta line · facts line · RSVP.
// Compact is the same bones at 17px rail + folded venue (R2-1/R2-2).
export default memo(function EventCard({ event, rsvpCount, rideCount, dutyCount, isNext, density = 'minimal', gameResult, weather, childRsvpMap, activatedMap, commitment, suppressCount, onRsvpChange }) {
  const navigate = useNavigate();
  const { role, myChildren, org } = useAuth();
  const now = useNow();
  const compact = density === 'minimal';
  const kids = (myChildren || []).filter((c) => c.teamIds?.includes(event.team_id) || c.teamId === event.team_id);
  const team = event.teams;
  const teamColor = team?.team_color || 'var(--as-neutral)';
  const isCancelled = event.status === 'cancelled';
  const timeState = eventTimeState(event, now);
  const live = timeState === 'happening_now' && !isCancelled;
  const completed = timeState === 'completed';
  const gameType = isGame(event.event_type);
  const hasResult = completed && gameType && gameResult?.published_at;
  const msUntil = new Date(event.start_at).getTime() - now;
  const showCountdown = timeState === 'upcoming' && !isCancelled && (isNext || msUntil < 24 * 60 * 60 * 1000); // CP-5
  const nyDay = (t) => new Date(t).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const isToday = nyDay(event.start_at) === nyDay(now);
  const { prefix, body } = formatEventTitle(event);
  const loc = event.locations;
  const mapsUrl = getDirectionUrls(loc?.address ?? event.location_name, loc?.lat, loc?.lon, loc?.google_maps_url)?.google ?? null;
  const nowSlot = isNext && timeState === 'upcoming' && !isCancelled;
  const [hm, mer] = railTime(event.start_at);
  const open = () => { navigator.vibrate?.(10); navigate(`/events/${event.id}`, { state: { event } }); };
  // V5: unactivated academy kids surface on the facts line, not as controls.
  const academyNames = role === 'parent' && gameType && !completed && !isCancelled
    ? kids.filter((c) => c.memberType === 'futures_academy' && activatedMap && !activatedMap[cacheKey(event.id, c.playerId)]).map((c) => c.firstName)
    : [];
  const rsvpKids = kids.filter((c) => c.memberType !== 'futures_academy' || (activatedMap && activatedMap[cacheKey(event.id, c.playerId)]) || !gameType);

  return (
    <div
      role="link" tabIndex={0}
      aria-label={`${team?.name || ''} ${prefix}${body}, ${hm} ${mer}${live ? ', happening now' : ''}`}
      className="as-press"
      onClick={(e) => { if (e.target.closest('a, button')) return; open(); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } }}
      style={{
        display: 'flex', alignItems: 'stretch', position: 'relative',
        backgroundColor: 'var(--as-bg-card)', borderRadius: 10, overflow: 'hidden',
        border: nowSlot ? '1.5px solid var(--as-accent)' : '1px solid var(--as-border-default)',
        boxShadow: nowSlot ? '0 0 0 3px var(--as-accent-soft), var(--as-shadow-sm)' : 'var(--as-shadow-sm)',
        opacity: (isCancelled || completed) ? 0.55 : 1,
        transition: 'box-shadow 150ms ease-out, opacity 150ms ease-out',
      }}
    >
      {/* V2.1: the tag ABSORBS the countdown — one element, no collision
          with the status slot (the deployed tag half-covered the pill). */}
      {nowSlot && <div style={{ position: 'absolute', top: 0, right: 14, backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', padding: '3px 9px', borderRadius: '0 0 7px 7px', textTransform: 'uppercase', zIndex: 1 }}>Next up · {formatCountdown(event.start_at)}</div>}

      {/* R2-1 rail — V2.1: detailed hour to 24px (scale top) so the pair
          separates at arm's length; compact stays 17. */}
      <div style={{ flexShrink: 0, width: compact ? 54 : 68, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, borderRight: '1px solid var(--as-border-subtle)', padding: compact ? '10px 0 9px' : '15px 0 13px' }}>
        <span style={{ fontSize: compact ? 17 : 24, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, color: completed ? 'var(--as-text-tertiary)' : teamColor }}>{hm}</span>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--as-text-tertiary)' }}>{mer}</span>
        {weather && timeState === 'upcoming' && isWithinForecastWindow(event.start_at) && (
          <span style={{ fontSize: 11, color: 'var(--as-text-tertiary)', marginTop: 5 }}>{`${weather.icon} ${weather.temp}°`}</span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: compact ? '9px 12px 9px 11px' : '15px 14px 15px 13px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: compact ? 14 : 15, fontWeight: 600, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--as-text-primary)', textDecoration: isCancelled ? 'line-through' : 'none', marginRight: nowSlot ? 52 : 0 }}>{prefix}{body}</span>
          {/* V2: ONE status slot */}
          {isCancelled ? <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--as-danger)', backgroundColor: 'var(--as-danger-soft)', padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase', flexShrink: 0 }}>Cancelled</span>
            : hasResult ? <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 6, flexShrink: 0, backgroundColor: gameResult.result === 'W' ? 'var(--as-success-soft)' : gameResult.result === 'L' ? 'var(--as-danger-soft)' : 'var(--as-neutral-soft)', color: gameResult.result === 'W' ? 'var(--as-success)' : gameResult.result === 'L' ? 'var(--as-danger)' : 'var(--as-text-secondary)' }}>{gameResult.result} {gameResult.our_score}–{gameResult.opponent_score}</span>
            : live ? <Badge variant="success" pill style={{ gap: 5, fontWeight: 700, flexShrink: 0 }}><span aria-hidden="true" className="as-pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--as-success)' }} />{compact ? 'Live' : 'Happening now'}</Badge>
            : showCountdown && !nowSlot ? <Badge variant="accent" pill style={{ flexShrink: 0 }}>{formatCountdown(event.start_at)}</Badge>
            : isToday && !nowSlot ? <Badge variant="info" pill style={{ flexShrink: 0 }}>Today</Badge> : null}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: compact ? 12 : 13, color: 'var(--as-text-tertiary)', marginTop: compact ? 2 : 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {/* TYPE pill — every card, both densities (operator 2026-06-13):
              the KIND, derived from event_type + the team's program_type
              (Game / Practice / Tournament / Training / Camp / Tryout…). */}
          <Badge variant={eventKindVariant(event)} pill compact style={{ flexShrink: 0 }}>{eventKindLabel(event)}</Badge>
          <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: 2.5, backgroundColor: teamColor, flexShrink: 0 }} />
          <span style={{ color: 'var(--as-text-secondary)', fontWeight: 500 }}>{team?.name}</span>
          {role === 'parent' && kids.length === 1 && <span>· {kids[0].firstName}</span>}
          {compact && event.location_name && <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>· {event.location_name}</span>}
          {event.event_type === 'tournament' && !event.opponent && isStaff(role) && <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--as-text-secondary)', textTransform: 'uppercase' }}>· Draft</span>}
        </div>

        {!compact && event.location_name && (
          mapsUrl && !completed && !isCancelled
            ? <a href={mapsUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ display: 'block', fontSize: 13, color: 'var(--as-accent)', textDecoration: 'none', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.location_name}</a>
            : <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.location_name}</div>
        )}
        {/* R3 (PR-V4): Detailed EARNS its space — operational lines compact
            never shows: the arrival call + event notes (below the facts). */}
        {!compact && event.arrival_minutes_before > 0 && timeState === 'upcoming' && !isCancelled && (
          <div style={{ fontSize: 13, color: 'var(--as-text-secondary)', fontWeight: 500, marginTop: 3 }}>Arrive {event.arrival_minutes_before} min early</div>
        )}

        {!completed && !isCancelled && (
          <EventCardFacts suppressCount={suppressCount} isStaffView={isStaff(role)} count={rsvpCount} rideCount={rideCount} dutyCount={dutyCount} commitment={commitment} academyNames={academyNames} compact={compact}
            ridesEnabled={ridesEnabledFor(org, event)} dutiesEnabled={dutiesEnabledFor(org)} />
        )}
        {!compact && event.notes && !completed && !isCancelled && (
          <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)', marginTop: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{event.notes}</div>
        )}

        {role === 'parent' && rsvpKids.length > 0 && timeState === 'upcoming' && !isCancelled && (
          <div onClick={(e) => e.stopPropagation()}>
            {rsvpKids.map((child) => (
              <div key={child.playerId}>
                {rsvpKids.length > 1 && <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--as-text-secondary)', marginTop: 8 }}>{child.firstName}</div>}
                <ChildRsvp child={child} eventId={event.id} eventType={event.event_type} variant={compact ? 'segmented' : 'buttons'}
                  disabled={!isRsvpOpen(event.start_at, now)}
                  initialResponse={childRsvpMap ? (childRsvpMap[cacheKey(event.id, child.playerId)] ?? null) : undefined}
                  initialActivated={activatedMap ? (activatedMap[cacheKey(event.id, child.playerId)] ?? false) : undefined}
                  onSave={onRsvpChange} />
              </div>
            ))}
          </div>
        )}
        {role === 'parent' && kids.length > 0 && live && (
          <div style={{ marginTop: compact ? 6 : 8, fontSize: 13, color: 'var(--as-text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lock size={12} strokeWidth={1.75} aria-hidden="true" />RSVP closed
          </div>
        )}
      </div>
    </div>
  );
});
