import { Calendar } from 'lucide-react';
import { TYPE_LABELS } from '../../lib/constants';
import ChildRsvp from '../schedule/ChildRsvp';

const PILL = { fontSize: 11, fontWeight: 500, padding: '1px 5px', borderRadius: 4, lineHeight: '16px' };

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function MyChildSpotlight({ player, team, child, nextEvent }) {
  if (!player) return null;
  const initial = (player.last_name || player.first_name || '?').charAt(0).toUpperCase();
  const tc = team?.team_color || 'var(--em-neutral)';
  const showRsvp = player.totalPast > 0;
  const useCount = player.totalPast < 5;

  return (
    <div style={{
      backgroundColor: 'var(--em-bg-card)', border: '1px solid var(--em-border-default)',
      borderRadius: 10, boxShadow: 'var(--em-shadow-sm)', padding: 16, marginBottom: 12,
      borderLeft: '3px solid var(--em-accent)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', backgroundColor: tc,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--em-text-inverse)', fontSize: 15, fontWeight: 700, flexShrink: 0,
        }}>{initial}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center gap-2">
            <span className="font-semibold truncate" style={{ fontSize: 15, color: 'var(--em-text-primary)' }}>
              {player.first_name} {player.last_name}
            </span>
            {player.jersey_number != null && (
              <span style={{ fontSize: 13, fontWeight: 700, color: tc }}>#{player.jersey_number}</span>
            )}
            {player.streak >= 3 && <span style={{ fontSize: 11 }}>🔥 {player.streak}</span>}
          </div>
          {showRsvp && (
            <div className="flex items-center gap-1" style={{ marginTop: 3, flexWrap: 'wrap' }}>
              {player.goingCount > 0 && <span style={{ ...PILL, backgroundColor: 'var(--em-success-soft)', color: 'var(--em-success)' }}>{useCount ? player.goingCount : Math.round((player.goingCount / player.totalPast) * 100) + '%'} Going</span>}
              {player.maybeCount > 0 && <span style={{ ...PILL, backgroundColor: 'var(--em-warning-soft)', color: 'var(--em-warning)' }}>{useCount ? player.maybeCount : Math.round((player.maybeCount / player.totalPast) * 100) + '%'} Maybe</span>}
              {player.declinedCount > 0 && <span style={{ ...PILL, backgroundColor: 'var(--em-neutral-soft)', color: 'var(--em-text-secondary)' }}>{useCount ? player.declinedCount : Math.round((player.declinedCount / player.totalPast) * 100) + '%'} No</span>}
              {player.noResponseCount > 0 && <span style={{ ...PILL, backgroundColor: 'var(--em-bg-secondary)', color: 'var(--em-text-tertiary)' }}>{useCount ? player.noResponseCount : Math.round((player.noResponseCount / player.totalPast) * 100) + '%'} NR</span>}
            </div>
          )}
        </div>
      </div>
      {nextEvent && child && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--em-border-subtle)' }}>
          <div className="flex items-center gap-1" style={{ marginBottom: 6 }}>
            <Calendar size={14} strokeWidth={1.75} color="var(--em-text-tertiary)" aria-hidden="true" />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--em-text-primary)' }}>
              {TYPE_LABELS[nextEvent.event_type] || 'Event'}
            </span>
            <span style={{ fontSize: 13, color: 'var(--em-text-secondary)' }}>
              {formatDate(nextEvent.start_at)} &middot; {formatTime(nextEvent.start_at)}
            </span>
          </div>
          <ChildRsvp child={child} eventId={nextEvent.id} eventType={nextEvent.event_type} compact />
        </div>
      )}
    </div>
  );
}
