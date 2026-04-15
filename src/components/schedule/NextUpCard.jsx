import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { TYPE_LABELS } from '../../lib/constants';

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

export default function NextUpCard({ event, rsvpCount, rideInfo }) {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(() => formatCountdown(event.start_at));

  useEffect(() => {
    const id = setInterval(() => setCountdown(formatCountdown(event.start_at)), 60000);
    return () => clearInterval(id);
  }, [event.start_at]);

  const teamColor = event.team_color || 'var(--sf-text-tertiary)';
  const teamName = event.team_name || '';
  const typeLabel = TYPE_LABELS[event.event_type] || event.event_type;

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
            <span style={{ fontSize: 13, color: 'var(--sf-text-secondary)' }}>{typeLabel}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--sf-accent)' }}>{countdown}</span>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--sf-text-primary)', marginBottom: 4 }}>
            {event.title || typeLabel}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, marginBottom: 8 }}>
            <span style={{ color: teamColor, fontWeight: 500 }}>{teamName}</span>
            {event.location && (
              <>
                <span style={{ color: 'var(--sf-text-tertiary)' }}>·</span>
                <MapPin size={12} strokeWidth={1.75} color="var(--sf-text-tertiary)" />
                <span style={{ color: 'var(--sf-text-secondary)' }}>{event.location}</span>
              </>
            )}
          </div>
          {rsvpCount && (
            <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--sf-text-secondary)' }}>
              <span><strong style={{ color: 'var(--sf-success)' }}>{rsvpCount.going}</strong> going</span>
              <span><strong style={{ color: 'var(--sf-danger)' }}>{rsvpCount.not_going}</strong> not going</span>
              <span><strong style={{ color: 'var(--sf-neutral)' }}>{rsvpCount.noResponse}</strong> no response</span>
            </div>
          )}
          {rideInfo && (rideInfo.offers > 0 || rideInfo.requests > 0) && (
            <div style={{ display: 'flex', gap: 6, fontSize: 12, color: 'var(--sf-text-tertiary)', marginTop: 4 }}>
              {rideInfo.offers > 0 && <span>{rideInfo.offers} seat{rideInfo.offers !== 1 ? 's' : ''} offered</span>}
              {rideInfo.offers > 0 && rideInfo.requests > 0 && <span>·</span>}
              {rideInfo.requests > 0 && <span>{rideInfo.requests} ride{rideInfo.requests !== 1 ? 's' : ''} needed</span>}
            </div>
          )}
        </div>
      </div>
      <div
        onClick={() => navigate(`/events/${event.id}`)}
        className="sf-press"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 44, borderTop: '1px solid var(--sf-border-subtle)',
          fontSize: 14, fontWeight: 500, color: 'var(--sf-accent)', cursor: 'pointer',
        }}
      >
        Manage RSVPs
      </div>
    </div>
  );
}
