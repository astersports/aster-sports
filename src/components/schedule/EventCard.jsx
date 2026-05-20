import { memo } from 'react';
import { Car, MapPin, Repeat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCountdown, formatTime } from '../../lib/formatters';
import { TYPE_LABELS } from '../../lib/constants';
import { formatEventTitle } from '../../lib/eventTitle';
import { useAuth } from '../../context/AuthContext';
import { useNow } from '../../hooks/useNow';
import { useMapsUrl } from '../../hooks/useMapsUrl';
import ChildRsvp from './ChildRsvp';
import RsvpCountRow from './RsvpCountRow';

export default memo(function EventCard({ event, rsvpCount, rideCount, dutyCount, stagger, isNext, density = 'medium', gameResult, weather, onRsvpChange }) {
  const navigate = useNavigate();
  const { role, myChildren } = useAuth();
  const now = useNow();
  const childrenOnTeam = (myChildren || []).filter((c) => c.teamIds?.includes(event.team_id) || c.teamId === event.team_id);
  const team = event.teams;
  const teamColor = team?.team_color || 'var(--em-neutral)';
  const teamName = team?.name || '';
  const typeLabel = TYPE_LABELS[event.event_type] || event.event_type;
  const isCancelled = event.status === 'cancelled';
  const isPast = event.end_at ? new Date(event.end_at) < new Date() : false;
  const isToday = new Date(event.start_at).toDateString() === new Date().toDateString();
  const isTournamentDraft = event.event_type === 'tournament' && !event.opponent;
  const dimmed = isCancelled || isPast;
  const msUntil = new Date(event.start_at).getTime() - now;
  const showCountdown = isNext && msUntil > 0 && msUntil < 24 * 60 * 60 * 1000 && !isCancelled; // PR #379: !isCancelled drops countdown chip on cancelled events.
  const { prefix: titlePrefix, body: titleBody } = formatEventTitle(event);
  const titleAria = `${titlePrefix}${titleBody}`;
  const mapsUrl = useMapsUrl(event.location_name || null);

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`${teamName} ${titleAria}, ${formatTime(event.start_at)}`}
      className={`sf-press ${dimmed ? '' : (stagger || '')}`}
      onClick={(e) => { if (e.target.closest('a, button')) return; navigator.vibrate?.(10); navigate(`/events/${event.id}`, { state: { event } }); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/events/${event.id}`, { state: { event } }); } }}
      style={{
        display: 'flex',
        alignItems: 'stretch',
        backgroundColor: (event.event_type === 'game' || event.event_type === 'tournament') ? 'rgba(74, 143, 212, 0.10)' : 'var(--em-bg-card)',
        borderRadius: 10,
        border: '1px solid var(--em-border-default)',
        boxShadow: 'var(--em-shadow-sm)',
        overflow: 'hidden',
        opacity: dimmed ? 0.5 : 1,
        transition: 'box-shadow 150ms ease-out, transform 150ms ease-out, opacity 150ms ease-out',
      }}
    >
      <div style={{ width: (event.event_type === 'game' || event.event_type === 'tournament') ? 6 : 4, flexShrink: 0, backgroundColor: teamColor }} />
      <div style={{ flex: 1, padding: density === 'minimal' ? '6px 12px' : '10px 14px' }}>
        {density === 'minimal' ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, flex: 1 }}>
                <span className="font-bold" style={{ fontSize: 17, color: 'var(--em-text-primary)' }}>{formatTime(event.start_at)}</span>
                <span style={{ fontSize: 13, color: 'var(--em-text-tertiary)' }}>· {typeLabel}</span>
                {isTournamentDraft && <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', padding: '2px 6px', borderRadius: 4, backgroundColor: 'var(--em-bg-tertiary)', color: 'var(--em-text-secondary)', textTransform: 'uppercase' }}>Draft</span>}
                {isToday && !showCountdown && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, backgroundColor: 'var(--em-info-soft)', color: 'var(--em-info)' }}>Today</span>}
                {gameResult?.published_at && <span style={{ fontSize: 13, fontWeight: 700, color: gameResult.result === 'W' ? 'var(--em-success)' : gameResult.result === 'L' ? 'var(--em-danger)' : 'var(--em-text-secondary)', marginLeft: 'auto' }}>{gameResult.result} {gameResult.our_score}-{gameResult.opponent_score}</span>}
                {isCancelled && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--em-danger)', backgroundColor: 'var(--em-danger-soft)', padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase' }}>Cancelled</span>}
              </div>
              {/* Weather is the rightmost badge so it stays put as RSVP
                  counts come in. RSVP varies in length (14NR vs 6G · 7NR
                  vs absent); weather is a stable 2-3 char "78°" cell. */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <RsvpCountRow rsvpCount={rsvpCount} compact={true} />
                {weather && !isPast && <span style={{ fontSize: 12, color: 'var(--em-text-tertiary)' }}>{weather.icon} {weather.temp}°</span>}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, marginTop: 2 }}>
              {teamName && <span style={{ color: teamColor, fontWeight: 500 }}>{teamName}</span>}
              {teamName && event.location_name && <span style={{ color: 'var(--em-text-tertiary)' }}>·</span>}
              {event.location_name && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: 'var(--em-text-tertiary)' }}>
                  <MapPin size={11} strokeWidth={1.75} />
                  {mapsUrl ? (
                    <button type="button" onClick={(e) => { e.stopPropagation(); window.open(mapsUrl, '_blank', 'noopener,noreferrer'); }} style={{ color: 'var(--em-text-secondary)', textDecoration: 'none', background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}>{event.location_name}</button>
                  ) : event.location_name}
                </span>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                <span className="font-bold" style={{ fontSize: 17, color: 'var(--em-text-primary)' }}>{formatTime(event.start_at)}</span>
                {showCountdown && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, backgroundColor: 'var(--em-accent-soft)', color: 'var(--em-accent)' }}>{formatCountdown(event.start_at)}</span>}
                {isToday && !showCountdown && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, backgroundColor: 'var(--em-info-soft)', color: 'var(--em-info)' }}>Today</span>}
                <span style={{ fontSize: 13, color: 'var(--em-text-tertiary)' }}>· {typeLabel}</span>
                {isTournamentDraft && <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', padding: '2px 6px', borderRadius: 4, backgroundColor: 'var(--em-bg-tertiary)', color: 'var(--em-text-secondary)', textTransform: 'uppercase' }}>Draft</span>}
                {gameResult?.published_at && <span style={{ fontSize: 13, fontWeight: 700, color: gameResult.result === 'W' ? 'var(--em-success)' : gameResult.result === 'L' ? 'var(--em-danger)' : 'var(--em-text-secondary)' }}>{gameResult.result} {gameResult.our_score}-{gameResult.opponent_score}</span>}
                {isCancelled && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--em-danger)', backgroundColor: 'var(--em-danger-soft)', padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase' }}>Cancelled</span>}
              </div>
              <div style={{ fontSize: 15, color: 'var(--em-text-primary)', marginTop: 2, marginBottom: 2, textDecoration: isCancelled ? 'line-through' : 'none' }}>
                {titlePrefix}{titleBody}
              </div>
              {teamName && <div style={{ fontSize: 13, color: teamColor, fontWeight: 500 }}>{teamName}</div>}
              {event.location_name && (
                <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 2, marginTop: 1 }}>
                  <MapPin size={11} strokeWidth={1.75} color="var(--em-text-tertiary)" style={{ flexShrink: 0 }} />
                  {mapsUrl ? (
                    <button type="button" onClick={(e) => { e.stopPropagation(); window.open(mapsUrl, '_blank', 'noopener,noreferrer'); }} style={{ color: 'var(--em-accent)', textDecoration: 'none', background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', textAlign: 'left' }}>{event.location_name}</button>
                  ) : <span style={{ color: 'var(--em-text-tertiary)' }}>{event.location_name}</span>}
                </div>
              )}
              {density !== 'maximum' && rideCount?.requests > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, marginTop: 4 }}>
                  <Car size={11} strokeWidth={1.75} color="var(--em-warning)" />
                  <span style={{ color: 'var(--em-warning)', fontWeight: 500 }}>{rideCount.requests} ride{rideCount.requests !== 1 ? 's' : ''} needed</span>
                </div>
              )}
            </div>
            {/* RSVP on top, weather on bottom — keeps weather pinned to
                the bottom-right corner. RSVP cell length varies; weather
                position stays stable. */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0, textAlign: 'right' }}>
              <RsvpCountRow rsvpCount={rsvpCount} compact={true} />
              {weather && !isPast && <span style={{ fontSize: 12, color: 'var(--em-text-tertiary)' }}>{weather.icon} {weather.temp}°</span>}
            </div>
          </div>
        )}
        {density === 'maximum' && (
          <>
            {event.notes && <div style={{ fontSize: 13, color: 'var(--em-text-tertiary)', marginTop: 2, WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', display: '-webkit-box', overflow: 'hidden' }}>{event.notes}</div>}
            {rideCount && (rideCount.offers > 0 || rideCount.requests > 0) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, marginTop: 4 }}>
                <Car size={12} strokeWidth={1.75} color={rideCount.urgent ? 'var(--em-danger)' : rideCount.requests > 0 ? 'var(--em-warning)' : 'var(--em-text-tertiary)'} />
                {rideCount.offers > 0 && <span style={{ color: 'var(--em-text-secondary)' }}>{rideCount.offers} seat{rideCount.offers !== 1 ? 's' : ''}</span>}
                {rideCount.requests > 0 && <span style={{ color: rideCount.urgent ? 'var(--em-danger)' : 'var(--em-warning)', fontWeight: 500 }}>{rideCount.requests} ride{rideCount.requests !== 1 ? 's' : ''} needed</span>}
              </div>
            )}
            {dutyCount && dutyCount.total > 0 && (
              <div style={{ fontSize: 13, marginTop: 4, color: dutyCount.claimed < dutyCount.total ? 'var(--em-warning)' : 'var(--em-success)' }}>{dutyCount.claimed}/{dutyCount.total} volunteers</div>
            )}
          </>
        )}
        {density !== 'minimal' && role === 'parent' && childrenOnTeam.length > 0 && (
          <div style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
            {childrenOnTeam.map((child) => (<ChildRsvp key={child.playerId} child={child} eventId={event.id} eventType={event.event_type} compact disabled={isPast || isCancelled} onSave={onRsvpChange} />))}
          </div>
        )}
      </div>
    </div>
  );
});
