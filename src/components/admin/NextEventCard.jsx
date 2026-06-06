import { Clock } from 'lucide-react';
import { useNow } from '../../hooks/useNow';
import { formatEventTitleString } from '../../lib/eventTitle';
import Badge from '../shared/Badge';
import Label from '../shared/Label';

const DEFAULT_EVENT_DURATION_MS = 2 * 60 * 60 * 1000;

// Arrival protocol copy (HOME_RENDER_RULES_CC #3): games + tournaments call
// for 15 minutes early ("· game day"), practices (+ everything else) for 5.
const arriveMinutes = (t) => (t === 'game' || t === 'tournament' ? 15 : 5);

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

// draft (#2, tournaments) + arrival (#3) render only on the PARENT Coming-up
// card per HOME_RENDERS — admin/coach pass neither. Team-color left rail is
// the event archetype's identity edge. eyebrow varies by role ("Next · {kid}"
// / "Next team event" / "Next event"); minimal (coach) drops countdown+weather.
export default function NextEventCard({ event, weather, draft, arrival, eyebrow = 'Next event', minimal = false }) {
  const countdown = useLiveCountdown(event?.start_at);
  if (!event) return null;
  const teamName = event.teams?.name;
  const rail = event.teams?.team_color || 'var(--as-accent)';
  const dt = new Date(event.start_at);
  const dateStr = dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' });
  const timeStr = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });
  const title = formatEventTitleString(event);
  const mins = arriveMinutes(event.event_type);
  return (
    <div
      className="as-stagger-5"
      style={{
        backgroundColor: 'var(--as-bg-card)', borderRadius: 10,
        border: '1px solid var(--as-border-default)', borderLeft: `3px solid ${rail}`,
        boxShadow: 'var(--as-shadow-sm)', padding: '12px 14px', marginTop: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <Label style={{ marginBottom: 0 }}>{eyebrow}</Label>
          <div className="font-semibold" style={{ fontSize: 15, color: 'var(--as-text-primary)', marginTop: 2 }}>
            {title}{teamName ? ` · ${teamName}` : ''}
          </div>
          <div style={{ fontSize: 13, color: 'var(--as-text-secondary)', marginTop: 2 }}>
            {dateStr} · {timeStr}{event.location ? ` · ${event.location}` : ''}
          </div>
        </div>
        {!minimal && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            {weather && <div style={{ fontSize: 13, color: 'var(--as-text-meta)', marginBottom: 2 }}>{weather.icon} {weather.temp}°</div>}
            <div className="font-bold" style={{ fontSize: 17, color: 'var(--as-accent)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
              {countdown || '—'}
            </div>
            {countdown === 'Now' && (
              <div className="as-pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--as-success)', margin: '4px 0 0 auto' }} />
            )}
          </div>
        )}
      </div>
      {draft && (
        <div style={{ marginTop: 8 }}>
          <Badge pill variant="warning" compact style={{ border: '1px solid var(--as-warning)' }}>May reschedule · draft</Badge>
        </div>
      )}
      {arrival && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--as-text-secondary)', marginTop: 9 }}>
          <Clock size={13} strokeWidth={1.85} color="var(--as-accent)" aria-hidden="true" />
          Arrive {mins} minutes early{mins === 15 ? ' · game day' : ''}
        </div>
      )}
    </div>
  );
}
