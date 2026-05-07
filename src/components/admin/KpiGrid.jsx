import { useEffect, useState } from 'react';
import { AlertCircle, Calendar, DollarSign, Users } from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';

// Animates a number from 0 to `target` over `duration` ms with an
// ease-out cubic curve. Called per Card with the resolved numeric value
// so non-numeric values (currency strings) bypass the hook via the
// isNumber check in Card and render unchanged.
function useCountUp(target, duration = 600) {
  const [value, setValue] = useState(0);
  // Microtask wrap on the zero-target setValue(0) pushes it out of the
  // effect body, satisfying react-hooks/set-state-in-effect.
  useEffect(() => {
    if (target === 0) {
      Promise.resolve().then(() => setValue(0));
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

// Tiny fixed-shape sparkline placeholder. Until we wire a real
// time-series into the card, every numeric KPI gets the same 7-point
// upward polyline — mimics a trending line at 1/48px resolution.
function Sparkline({ color }) {
  return (
    <svg width="48" height="16" viewBox="0 0 48 16" style={{ marginTop: 4, opacity: 0.5 }}>
      <polyline
        points="0,14 8,10 16,12 24,6 32,8 40,3 48,5"
        fill="none"
        stroke={color || 'var(--em-text-tertiary)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Pulsing placeholder block for the value row. Used while stats are
// still loading so the card doesn't flash "0 → real value" on mount.
function ValueSkeleton() {
  return (
    <div
      className="sf-pulse"
      style={{
        width: '60%',
        height: 24,
        borderRadius: 6,
        backgroundColor: 'var(--em-bg-tertiary)',
      }}
      aria-hidden="true"
    />
  );
}

// 2x2 KPI grid at the top of the admin dashboard. Each card renders the
// same shell — small icon top-left, big value, small secondary label.
// `min-w-0` on the card is load-bearing: without it, a long currency
// value like "$999,999.99" would widen its grid column past 50% of the
// viewport and blow out the parent (CSS grid items default to
// min-width: auto, which refuses to shrink below content width).
function Card(props) {
  const { label, value, accent, accentValue, loading, stagger } = props;
  const Icon = props.icon;
  const isNumber = typeof value === 'number';
  const animated = useCountUp(loading ? 0 : (isNumber ? value : 0));

  return (
    <div
      className={`p-3 min-w-0 ${stagger || ''}`}
      style={{
        backgroundColor: 'var(--em-bg-card)',
        borderRadius: 10,
        border: '1px solid var(--em-border-default)',
        boxShadow: 'var(--em-shadow-sm)',
      }}
    >
      <div style={{ color: accent || 'var(--em-text-tertiary)', marginBottom: 8 }}>
        <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
      </div>
      {loading ? (
        <ValueSkeleton />
      ) : (
        <div
          className="font-bold truncate"
          style={{
            color: accentValue ? accent : 'var(--em-text-primary)',
            fontSize: 24,
            lineHeight: 1.1,
          }}
          title={String(value)}
        >
          {isNumber ? animated : value}
        </div>
      )}
      {!loading && isNumber && value > 0 && <div style={{ height: 8 }} />}
      <div className="truncate" style={{ color: 'var(--em-text-secondary)', fontSize: 13, marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}

export default function KpiGrid({ stats }) {
  const { players, events, collected, outstanding, loading } = stats;

  return (
    <div className="grid grid-cols-2 gap-2">
      <Card icon={Users} label="Players" value={players} loading={loading} stagger="sf-stagger-1" />
      <Card icon={Calendar} label="Events" value={events} loading={loading} accent="var(--em-info)" stagger="sf-stagger-2" />
      <Card
        icon={DollarSign}
        label="Collected"
        value={formatCurrency(collected)}
        loading={loading}
        accent="var(--em-success)"
        accentValue
        stagger="sf-stagger-3"
      />
      <Card
        icon={AlertCircle}
        label="Outstanding"
        value={formatCurrency(outstanding)}
        loading={loading}
        accent={outstanding > 0 ? 'var(--em-warning)' : 'var(--em-text-tertiary)'}
        accentValue={outstanding > 0}
        stagger="sf-stagger-4"
      />
    </div>
  );
}
