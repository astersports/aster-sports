import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Repeat, ExternalLink } from 'lucide-react';
import { TYPE_LABELS } from '../../lib/constants';
import { formatCountdown, formatEventDateMed } from '../../lib/formatters';
import { GameInfo } from './NextUpCardInfo';
import NextUpCardRsvpSection from './NextUpCardRsvpSection';
import NextUpCardStatusRow from './NextUpCardStatusRow';
import { useAuth } from '../../context/AuthContext';
import { useMapsUrl } from '../../hooks/useMapsUrl';
import { useNow } from '../../hooks/useNow';
import ChildRsvp from './ChildRsvp';
import { urgencyClass } from '../../lib/urgency';

export default function NextUpCardMed({ event, rsvpCount, rideCount, dutyCount, onRefresh }) {
  const navigate = useNavigate();
  const { role, myChildren } = useAuth();
  const now = useNow();
  const childrenOnTeam = (myChildren || []).filter((c) => c.teamId === event.team_id);
  const [countdown, setCountdown] = useState(() => formatCountdown(event.start_at));

  useEffect(() => {
    const id = setInterval(() => setCountdown(formatCountdown(event.start_at)), 60000);
    return () => clearInterval(id);
  }, [event.start_at]);

  // Every 60s, check whether the currently-featured event has ended.
  // If yes, ask the parent to refresh so nextEvent can advance to the
  // next upcoming event. Belt-and-suspenders with SchedulePage's tick.
  useEffect(() => {
    if (!event.end_at || !onRefresh) return;
    const id = setInterval(() => {
      if (new Date(event.end_at) < new Date()) onRefresh();
    }, 60000);
    return () => clearInterval(id);
  }, [event.end_at, onRefresh]);

  const directionsUrl = useMapsUrl(event.location);
  const isPlaceholderLocation = typeof event.location === 'string' && event.location.startsWith('Tournament -');

  const teamColor = event.teams?.team_color || event.team_color || 'var(--em-text-tertiary)';
  const typeLabel = TYPE_LABELS[event.event_type] || event.event_type;
  const teamName = event.teams?.name || event.team_name || '';
  const titleNorm = (event.title || '').trim().toLowerCase();
  const typeLabelNorm = (typeLabel || '').trim().toLowerCase();
  const teamPlusType = `${teamName} ${typeLabel || ''}`.trim().toLowerCase();
  const isTitleRedundant = titleNorm === typeLabelNorm || titleNorm === teamPlusType;
  const secondsUntil = (new Date(event.start_at).getTime() - now) / 1000;
  const imminent = secondsUntil > 0 && secondsUntil < 7200;

  return (
    <div
      style={{
        backgroundColor: 'var(--em-bg-card)', borderRadius: 12,
        border: '1px solid var(--em-border-default)', overflow: 'hidden',
        marginBottom: 16,
      }}
    >
      <div
        onClick={(e) => { if (e.target.closest('a, button, [role="link"], [role="button"]')) return; navigate(`/events/${event.id}`, { state: { event } }); }}
        style={{ display: 'flex', cursor: 'pointer' }}
      >
        <div style={{ width: 4, backgroundColor: teamColor, flexShrink: 0 }} />
        <div style={{ flex: 1, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: 'var(--em-text-secondary)' }}>
              {!isTitleRedundant && typeLabel}
              {event.parent_event_id && (
                <Repeat size={11} strokeWidth={1.75} color="var(--em-text-tertiary)" style={{ marginLeft: 4 }} />
              )}
            </span>
            <span className={`sf-countdown ${urgencyClass(secondsUntil)}`.trim()} style={{ fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }} data-seconds-until={Math.round(secondsUntil)}>
              {imminent && (
                <span className="sf-pulse-dot" aria-hidden="true" style={{
                  display: 'inline-block', width: 8, height: 8, borderRadius: 4,
                  backgroundColor: 'var(--em-success)', flexShrink: 0,
                }} />
              )}
              {countdown}
            </span>
          </div>
          {(event.teams?.name || event.team_name) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: 'var(--em-text-secondary)' }}>{event.teams?.name || event.team_name}</span>
              {!isTitleRedundant && event.title && (
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--em-text-primary)' }}>{event.title}</span>
              )}
            </div>
          )}
          <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', marginTop: 2, marginBottom: 4 }}>
            {formatEventDateMed(event.start_at)}
          </div>
          {event.location && (
            directionsUrl && !isPlaceholderLocation ? (
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, marginTop: 2, marginBottom: 8, textDecoration: 'none' }}>
                <MapPin size={12} strokeWidth={1.75} color="var(--em-text-tertiary)" />
                <span style={{ color: 'var(--em-text-secondary)' }}>{event.location}</span>
                <ExternalLink size={10} strokeWidth={1.75} color="var(--em-text-tertiary)" />
              </a>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, marginTop: 2, marginBottom: 8 }}>
                <MapPin size={12} strokeWidth={1.75} color="var(--em-text-tertiary)" />
                <span style={{ color: 'var(--em-text-secondary)' }}>{event.location}</span>
              </div>
            )
          )}
          {event.notes && (
            <div style={{
              fontSize: 12,
              color: 'var(--em-text-secondary)',
              marginTop: 6,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              <span style={{ fontWeight: 600 }}>Notes: </span>{event.notes}
            </div>
          )}
          <GameInfo event={event} skipArrival={!!event.notes} />
          <NextUpCardRsvpSection eventId={event.id} rsvpCount={rsvpCount} />
          <NextUpCardStatusRow rideCount={rideCount} dutyCount={dutyCount} />
        </div>
      </div>
      {role === 'parent' && childrenOnTeam.length > 0 ? (
        <div style={{ padding: '0 16px 16px' }}>
          {childrenOnTeam.map((c) => <ChildRsvp key={c.playerId} child={c} eventId={event.id} />)}
        </div>
      ) : (
        <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8 }}>
          <button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/events/${event.id}?tab=rsvps`, { state: { event } }); }} className="sf-press"
            style={{ flex: 1, minHeight: 44, borderRadius: 10, border: '1px solid var(--em-border-default)', backgroundColor: 'transparent', color: 'var(--em-accent)', fontSize: 14, fontWeight: 500 }}>
            Manage RSVPs
          </button>
        </div>
      )}
    </div>
  );
}
