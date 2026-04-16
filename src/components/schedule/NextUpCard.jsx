import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Car, Repeat } from 'lucide-react';
import { TYPE_LABELS } from '../../lib/constants';
import { WhenRow, GameInfo } from './NextUpCardInfo';

function formatCountdown(startAt) {
  const diff = new Date(startAt) - new Date();
  if (diff < 0) return 'Now';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rm = mins % 60;
  if (hrs < 24) return `in ${hrs}h ${rm}m`;
  const dt = new Date(startAt);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dt.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow ${dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }
  return dt.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' +
    dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function NextUpCard({ event, rsvpCount, rideCount, onRefresh }) {
  const navigate = useNavigate();
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

  const teamColor = event.teams?.team_color || event.team_color || 'var(--sf-text-tertiary)';
  const teamName = event.teams?.name || event.team_name || '';
  const typeLabel = TYPE_LABELS[event.event_type] || event.event_type;
  const secondsUntil = (new Date(event.start_at).getTime() - Date.now()) / 1000;
  const imminent = secondsUntil > 0 && secondsUntil < 7200;

  return (
    <div
      style={{
        backgroundColor: 'var(--sf-bg-card)', borderRadius: 12,
        border: '1px solid var(--sf-border-default)', overflow: 'hidden',
        marginBottom: 16,
      }}
    >
      <div
        onClick={() => navigate(`/events/${event.id}`)}
        style={{ display: 'flex', cursor: 'pointer' }}
      >
        <div style={{ width: 4, backgroundColor: teamColor, flexShrink: 0 }} />
        <div style={{ flex: 1, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: 'var(--sf-text-secondary)' }}>
              {typeLabel}
              {event.parent_event_id && (
                <Repeat size={11} strokeWidth={1.75} color="var(--sf-text-tertiary)" style={{ marginLeft: 4 }} />
              )}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--sf-accent)', display: 'inline-flex', alignItems: 'center', gap: 6 }} data-seconds-until={Math.round(secondsUntil)}>
              {imminent && (
                <span className="sf-pulse-dot" aria-hidden="true" style={{
                  display: 'inline-block', width: 8, height: 8, borderRadius: 4,
                  backgroundColor: 'var(--sf-success)', flexShrink: 0,
                }} />
              )}
              {countdown}
            </span>
          </div>
          {(event.teams?.name || event.team_name) && (
            <div style={{ fontSize: 13, color: 'var(--sf-text-secondary)', marginBottom: 4 }}>
              {event.teams?.name || event.team_name}
            </div>
          )}
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--sf-text-primary)', marginBottom: 4 }}>
            {event.title || typeLabel}
          </div>
          <WhenRow event={event} />
          {event.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, marginTop: 2, marginBottom: 8 }}>
              <MapPin size={12} strokeWidth={1.75} color="var(--sf-text-tertiary)" />
              <span style={{ color: 'var(--sf-text-secondary)' }}>{event.location}</span>
            </div>
          )}
          <GameInfo event={event} />
          {rsvpCount && (
            <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--sf-text-secondary)' }}>
              <span><strong style={{ color: 'var(--sf-success)' }}>{rsvpCount.going}</strong> going</span>
              <span><strong style={{ color: 'var(--sf-danger)' }}>{rsvpCount.not_going}</strong> not going</span>
              <span><strong style={{ color: 'var(--sf-neutral)' }}>{rsvpCount.noResponse}</strong> no response</span>
            </div>
          )}
          {rideCount && (rideCount.offers > 0 || rideCount.requests > 0) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--sf-text-secondary)', marginTop: 4 }}>
              <Car size={12} strokeWidth={1.75} color="var(--sf-text-tertiary)" />
              {rideCount.offers > 0 && <span>{rideCount.offers} seat{rideCount.offers !== 1 ? 's' : ''} offered</span>}
              {rideCount.offers > 0 && rideCount.requests > 0 && <span style={{ color: 'var(--sf-text-tertiary)' }}>·</span>}
              {rideCount.requests > 0 && <span style={{ color: 'var(--sf-warning)', fontWeight: 500 }}>{rideCount.requests} ride{rideCount.requests !== 1 ? 's' : ''} needed</span>}
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate(`/events/${event.id}?tab=rsvps`); }}
          className="sf-press"
          style={{
            flex: 1, minHeight: 44, borderRadius: 10,
            border: '1px solid var(--sf-border-default)',
            backgroundColor: 'transparent',
            color: 'var(--sf-accent)', fontSize: 14, fontWeight: 500,
          }}
        >
          Manage RSVPs
        </button>
      </div>
    </div>
  );
}
