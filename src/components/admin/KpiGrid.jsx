import { Users, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';

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
        backgroundColor: 'var(--sf-bg-muted)',
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
  const { label, value, accent, loading } = props;
  const Icon = props.icon;
  return (
    <div
      className="p-4 min-w-0"
      style={{
        backgroundColor: 'var(--sf-bg-card)',
        borderRadius: 10,
        boxShadow: 'var(--sf-shadow-sm)',
        border: '1px solid var(--sf-border-subtle)',
      }}
    >
      <div style={{ color: accent || 'var(--sf-text-tertiary)', marginBottom: 8 }}>
        <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
      </div>
      {loading ? (
        <ValueSkeleton />
      ) : (
        <div
          className="font-bold truncate"
          style={{ color: 'var(--sf-text-primary)', fontSize: 24, lineHeight: 1.1 }}
          title={String(value)}
        >
          {value}
        </div>
      )}
      <div
        className="truncate"
        style={{ color: 'var(--sf-text-secondary)', fontSize: 13, marginTop: 2 }}
        aria-label={loading ? `${label} loading` : undefined}
      >
        {label}
      </div>
    </div>
  );
}

export default function KpiGrid({ stats }) {
  const { players, events, collected, outstanding, loading } = stats;

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card icon={Users}    label="Players" value={players} loading={loading} />
      <Card icon={Calendar} label="Events"  value={events}  loading={loading} />
      <Card
        icon={DollarSign}
        label="Collected"
        accent="var(--sf-success)"
        value={formatCurrency(collected)}
        loading={loading}
      />
      <Card
        icon={AlertCircle}
        label="Outstanding"
        accent="var(--sf-warning)"
        value={formatCurrency(outstanding)}
        loading={loading}
      />
    </div>
  );
}
