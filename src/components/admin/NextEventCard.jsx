import { useState, useEffect } from 'react';

// Default event window when no explicit duration is known. Used as a
// fallback so a card doesn't stay stuck on "Now" hours (or days) after
// start. 2h covers both practices and typical games.
const DEFAULT_EVENT_DURATION_MS = 2 * 60 * 60 * 1000;

// Live countdown. Re-renders every second while targetDate is truthy —
// used only on the Home dashboard below the Season card so the
// dashboard has one always-ticking element. Returns:
//  - null if no date OR the event has ended (now > start + duration)
//  - 'Now' if the event is in progress (started but not yet ended)
//  - a formatted "Xd Yh Zm" / "Xh Ym Zs" / "Xm Ys" string otherwise
function useLiveCountdown(targetDate) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!targetDate) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

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

// Next Event countdown card. Target date + label are hardcoded
// placeholders — swap for an activities query once the events API
// is wired up.
export default function NextEventCard() {
  // TODO: replace with real next event date from activities query
  const countdown = useLiveCountdown('2026-04-16T18:30:00');
  return (
    <div
      className="sf-stagger-5"
      style={{
        backgroundColor: 'var(--sf-bg-card)',
        borderRadius: 10,
        border: '1px solid var(--sf-border-default)',
        boxShadow: 'var(--sf-shadow-sm)',
        padding: 16,
        marginTop: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--sf-text-tertiary)' }}>
          NEXT EVENT
        </div>
        <div className="font-semibold" style={{ fontSize: 15, color: 'var(--sf-text-primary)', marginTop: 2 }}>
          Practice · 10U Black
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="font-bold" style={{ fontSize: 20, color: 'var(--sf-accent)', fontVariantNumeric: 'tabular-nums' }}>
          {countdown || '—'}
        </div>
        {countdown === 'Now' && (
          <div className="sf-pulse-dot" style={{
            width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--sf-success)',
            margin: '4px 0 0 auto',
          }} />
        )}
      </div>
    </div>
  );
}
