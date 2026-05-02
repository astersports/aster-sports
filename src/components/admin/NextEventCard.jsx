import { useNow } from '../../hooks/useNow';
import { TYPE_LABELS } from '../../lib/constants';

const DEFAULT_EVENT_DURATION_MS = 2 * 60 * 60 * 1000;

function useLiveCountdown(targetDate) {
  const now = useNow(1000);
  if (!targetDate) return null;
  const start = new Date(targetDate).getTime();
  if (now - start > DEFAULT_EVENT_DURATION_MS) return null;
  const diff = start - now;
  if (diff <= 0) return 'Now';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  return `${mins}m ${secs}s`;
}

export default function NextEventCard({ event }) {
  const countdown = useLiveCountdown(event?.start_at);
  if (!event) return null;
  const typeLabel = TYPE_LABELS[event.event_type] || 'Event';
  const teamName = event.teams?.name;
  const title = (event.event_type === 'game' || event.event_type === 'tournament') && event.opponent_name
    ? `vs. ${event.opponent_name}` : typeLabel;
  return (
    <div
      className="sf-stagger-5"
      style={{
        backgroundColor: 'var(--em-bg-card)',
        borderRadius: 10,
        border: '1px solid var(--em-border-default)',
        boxShadow: 'var(--em-shadow-sm)',
        padding: 16,
        marginTop: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--em-text-tertiary)' }}>
          NEXT EVENT
        </div>
        <div className="font-semibold" style={{ fontSize: 15, color: 'var(--em-text-primary)', marginTop: 2 }}>
          {title}{teamName ? ` · ${teamName}` : ''}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="font-bold" style={{ fontSize: 20, color: 'var(--em-accent)', fontVariantNumeric: 'tabular-nums' }}>
          {countdown || '—'}
        </div>
        {countdown === 'Now' && (
          <div className="sf-pulse-dot" style={{
            width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--em-success)',
            margin: '4px 0 0 auto',
          }} />
        )}
      </div>
    </div>
  );
}
