import { useNow } from '../../hooks/useNow';
import { formatEventTitleString } from '../../lib/eventTitle';
import Label from '../shared/Label';

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

export default function NextEventCard({ event, weather }) {
  const countdown = useLiveCountdown(event?.start_at);
  if (!event) return null;
  const teamName = event.teams?.name;
  const dt = new Date(event.start_at);
  const dateStr = dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' });
  const timeStr = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });
  const title = formatEventTitleString(event);
  return (
    <div
      className="as-stagger-5"
      style={{
        backgroundColor: 'var(--as-bg-card)',
        borderRadius: 10,
        border: '1px solid var(--as-border-default)',
        boxShadow: 'var(--as-shadow-sm)',
        padding: '12px 16px',
        marginTop: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <Label style={{ marginBottom: 0 }}>NEXT EVENT</Label>
        <div className="font-semibold" style={{ fontSize: 15, color: 'var(--as-text-primary)', marginTop: 2 }}>
          {title}{teamName ? ` · ${teamName}` : ''}
        </div>
        <div style={{ fontSize: 13, color: 'var(--as-text-secondary)', marginTop: 2 }}>
          {dateStr} · {timeStr}{event.location ? ` · ${event.location}` : ''}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        {weather && <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)', marginBottom: 2 }}>{weather.icon} {weather.temp}°</div>}
        <div className="font-bold" style={{ fontSize: 17, color: 'var(--as-accent)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
          {countdown || '—'}
        </div>
        {countdown === 'Now' && (
          <div className="as-pulse-dot" style={{
            width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--as-success)',
            margin: '4px 0 0 auto',
          }} />
        )}
      </div>
    </div>
  );
}
