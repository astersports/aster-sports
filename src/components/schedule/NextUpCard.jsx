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

export default function NextUpCard({ event, rsvpCount, onRsvp, currentRsvp }) {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(() => formatCountdown(event.start_at));

  useEffect(() => {
    const id = setInterval(() => setCountdown(formatCountdown(event.start_at)), 60000);
    return () => clearInterval(id);
  }, [event.start_at]);

  const teamColor = event.team_color || 'var(--sf-text-tertiary)';
  const teamName = event.team_name || '';
  const typeLabel = TYPE_LABELS[event.event_type] || event.event_type;

  const buttons = [
    { key: 'going', label: 'Going', color: 'var(--sf-success)', bg: 'var(--sf-success-soft)' },
    { key: 'maybe', label: 'Maybe', color: 'var(--sf-warning)', bg: 'var(--sf-warning-soft)' },
    { key: 'not_going', label: 'Not Going', color: 'var(--sf-danger)', bg: 'var(--sf-danger-soft)' },
  ];

  const handleRsvp = (status) => {
    if (currentRsvp === status) {
      onRsvp?.(event.id, null);
    } else {
      onRsvp?.(event.id, status);
    }
  };

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
        </div>
      </div>
      <div style={{
        display: 'flex', gap: 8, padding: '0 16px 16px',
      }}>
        {buttons.map((b) => {
          const active = currentRsvp === b.key;
          return (
            <button
              key={b.key}
              type="button"
              onClick={() => handleRsvp(b.key)}
              className="sf-press"
              style={{
                flex: 1, minHeight: 44, borderRadius: 10,
                border: active ? 'none' : '1px solid var(--sf-border-default)',
                backgroundColor: active ? b.bg : 'transparent',
                color: active ? b.color : 'var(--sf-text-secondary)',
                fontSize: 14, fontWeight: active ? 600 : 500,
              }}
            >
              {b.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
