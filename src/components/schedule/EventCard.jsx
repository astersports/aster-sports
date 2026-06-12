import { memo } from 'react';
import { Lock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCountdown, formatTime } from '../../lib/formatters';
import { TYPE_LABELS } from '../../lib/constants';
import { formatEventTitle } from '../../lib/eventTitle';
import { useAuth } from '../../context/AuthContext';
import { useNow } from '../../hooks/useNow';
import { useMapsUrl } from '../../hooks/useMapsUrl';
import { eventTimeState, isRsvpOpen } from '../../lib/eventWindows';
import { isStaff } from '../../lib/permissions';
import { cacheKey } from '../../lib/rsvpCache';
import ChildRsvp from '../shared/ChildRsvp';
import EventCardChips from './EventCardChips';
import Badge from '../shared/Badge';

// SD-2 spine card (SCHEDULE_L99_BUILD_SPEC §1.2 + §10). One layout, two
// densities: compact tightens padding/type but keeps time, weather,
// countdown, title, team dot, location, the §10.1 chip row, and the 44px
// RSVP control — non-negotiable per §10.2. State treatments: upcoming
// full color (+NOW-slot ring), happening_now Live badge, completed 0.55.
export default memo(function EventCard({ event, rsvpCount, rideCount, dutyCount, stagger, isNext, density = 'minimal', gameResult, weather, childRsvpMap, activatedMap, commitment, suppressCount, onRsvpChange }) {
  const navigate = useNavigate();
  const { role, myChildren } = useAuth();
  const now = useNow();
  const compact = density === 'minimal';
  const childrenOnTeam = (myChildren || []).filter((c) => c.teamIds?.includes(event.team_id) || c.teamId === event.team_id);
  const team = event.teams;
  const teamColor = team?.team_color || 'var(--as-neutral)';
  const isCancelled = event.status === 'cancelled';
  const timeState = eventTimeState(event, now);
  const live = timeState === 'happening_now' && !isCancelled;
  const completed = timeState === 'completed';
  const isGameType = event.event_type === 'game' || event.event_type === 'tournament';
  const hasResult = completed && isGameType && gameResult?.published_at;
  const msUntil = new Date(event.start_at).getTime() - now;
  const showCountdown = timeState === 'upcoming' && !isCancelled && (isNext || msUntil < 24 * 60 * 60 * 1000); // CP-5: every density; NOW slot always
  // R12: NY-pinned day compare (toDateString was browser-local — "Today"
  // flipped at the viewer's midnight, not the org's).
  const nyDay = (t) => new Date(t).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const isToday = nyDay(event.start_at) === nyDay(now);
  const isTournamentDraft = event.event_type === 'tournament' && !event.opponent;
  const { prefix: titlePrefix, body: titleBody } = formatEventTitle(event);
  const mapsUrl = useMapsUrl(event.location_name || null);
  const nowSlot = isNext && timeState === 'upcoming' && !isCancelled;
  const open = () => { navigator.vibrate?.(10); navigate(`/events/${event.id}`, { state: { event } }); };

  return (
    <div
      role="link" tabIndex={0}
      aria-label={`${team?.name || ''} ${titlePrefix}${titleBody}, ${formatTime(event.start_at)}${live ? ', happening now' : ''}`}
      className={`as-press ${(isCancelled || completed) ? '' : (stagger || '')}`}
      onClick={(e) => { if (e.target.closest('a, button')) return; open(); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } }}
      style={{
        display: 'flex', alignItems: 'stretch', position: 'relative',
        backgroundColor: isGameType ? 'rgba(74, 143, 212, 0.10)' : 'var(--as-bg-card)',
        borderRadius: 10, overflow: 'hidden',
        border: nowSlot ? '1.5px solid var(--as-accent)' : '1px solid var(--as-border-default)',
        boxShadow: nowSlot ? '0 0 0 3px var(--as-accent-soft), var(--as-shadow-sm)' : 'var(--as-shadow-sm)',
        opacity: (isCancelled || completed) ? 0.55 : 1,
        transition: 'box-shadow 150ms ease-out, opacity 150ms ease-out',
      }}
    >
      <div style={{ width: isGameType ? 6 : 4, flexShrink: 0, backgroundColor: teamColor, opacity: completed ? 0.5 : 1 }} />
      {nowSlot && <div aria-hidden="true" style={{ position: 'absolute', top: 0, right: 14, backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', padding: '3px 9px', borderRadius: '0 0 7px 7px', textTransform: 'uppercase' }}>Next up</div>}
      <div style={{ flex: 1, minWidth: 0, padding: compact ? '8px 12px' : '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span className="font-bold" style={{ fontSize: compact ? 15 : 17, color: 'var(--as-text-primary)' }}>{formatTime(event.start_at)}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginRight: nowSlot ? 56 : 0 }}>
            {weather && timeState === 'upcoming' && <span style={{ fontSize: 12, color: 'var(--as-text-tertiary)' }}>{weather.icon} {weather.temp}°</span>}
            {isCancelled && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--as-danger)', backgroundColor: 'var(--as-danger-soft)', padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase' }}>Cancelled</span>}
            {!isCancelled && hasResult && <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, backgroundColor: gameResult.result === 'W' ? 'var(--as-success-soft)' : gameResult.result === 'L' ? 'var(--as-danger-soft)' : 'var(--as-neutral-soft)', color: gameResult.result === 'W' ? 'var(--as-success)' : gameResult.result === 'L' ? 'var(--as-danger)' : 'var(--as-text-secondary)' }}>{gameResult.result} {gameResult.our_score}–{gameResult.opponent_score}</span>}
            {live && <Badge variant="success" pill style={{ gap: 5, fontWeight: 700 }}><span aria-hidden="true" className="as-pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--as-success)' }} />Happening now</Badge>}
            {showCountdown && <Badge variant="accent" pill>{formatCountdown(event.start_at)}</Badge>}
            {!showCountdown && !live && !completed && !isCancelled && isToday && <Badge variant="info" pill>Today</Badge>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 3 }}>
          <span style={{ fontSize: compact ? 14 : 15, fontWeight: 600, color: 'var(--as-text-primary)', textDecoration: isCancelled ? 'line-through' : 'none' }}>{titlePrefix}{titleBody}</span>
          <span style={{ fontSize: 12, color: 'var(--as-text-tertiary)' }}>{TYPE_LABELS[event.event_type] || event.event_type}</span>
          {isTournamentDraft && isStaff(role) && <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', padding: '2px 6px', borderRadius: 4, backgroundColor: 'var(--as-bg-tertiary)', color: 'var(--as-text-secondary)', textTransform: 'uppercase' }}>Draft</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4, fontSize: compact ? 12 : 13, marginTop: 2 }}>
          {team?.name && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: teamColor, fontWeight: 500 }}><span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 3, backgroundColor: teamColor, display: 'inline-block' }} />{team.name}</span>}
          {role === 'parent' && childrenOnTeam.length === 1 && <span style={{ color: 'var(--as-text-secondary)', fontWeight: 600 }}>· {childrenOnTeam[0].firstName}</span>}
        </div>
        {event.location_name && (
          <div style={{ fontSize: compact ? 12 : 13, display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
            <MapPin size={11} strokeWidth={1.75} color="var(--as-text-tertiary)" style={{ flexShrink: 0 }} />
            {mapsUrl && !completed ? (
              <button type="button" onClick={(e) => { e.stopPropagation(); window.open(mapsUrl, '_blank', 'noopener,noreferrer'); }} style={{ color: 'var(--as-accent)', background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', textAlign: 'left' }}>{event.location_name}</button>
            ) : <span style={{ color: 'var(--as-text-tertiary)' }}>{event.location_name}</span>}
          </div>
        )}
        {!completed && !isCancelled && (
          <EventCardChips isStaffView={isStaff(role)} suppressCount={suppressCount} count={rsvpCount} rideCount={rideCount} dutyCount={dutyCount} commitment={commitment} />
        )}
        {!compact && event.notes && !completed && <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)', marginTop: 4, WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', display: '-webkit-box', overflow: 'hidden' }}>{event.notes}</div>}
        {role === 'parent' && childrenOnTeam.length > 0 && timeState === 'upcoming' && !isCancelled && (
          <div onClick={(e) => e.stopPropagation()}>
            {childrenOnTeam.map((child) => (
              <div key={child.playerId}>
                {childrenOnTeam.length > 1 && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--as-text-secondary)', marginTop: 8 }}>{child.firstName}</div>}
                <ChildRsvp child={child} eventId={event.id} eventType={event.event_type} variant="segmented"
                  disabled={!isRsvpOpen(event.start_at, now)}
                  initialResponse={childRsvpMap ? (childRsvpMap[cacheKey(event.id, child.playerId)] ?? null) : undefined}
                  initialActivated={activatedMap ? (activatedMap[cacheKey(event.id, child.playerId)] ?? false) : undefined}
                  onSave={onRsvpChange} />
              </div>
            ))}
          </div>
        )}
        {/* SD-11 closed-state treatment (parent render .rsvp-closed): live
            events show a quiet closed line, not disabled buttons. */}
        {role === 'parent' && childrenOnTeam.length > 0 && live && (
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--as-text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lock size={12} strokeWidth={1.75} aria-hidden="true" />RSVP closed
          </div>
        )}
      </div>
    </div>
  );
});
