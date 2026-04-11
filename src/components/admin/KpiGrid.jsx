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
        backgroundColor: 'var(--sf-bg-tertiary)',
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
  const { label, value, accent, accentValue, loading } = props;
  const Icon = props.icon;
  return (
    <div
      className="p-4 min-w-0 sf-press"
      style={{
        backgroundColor: 'var(--sf-bg-card)',
        borderRadius: 10,
        border: '1px solid var(--sf-border-default)',
        boxShadow: 'var(--sf-shadow-sm)',
        transition: 'box-shadow 150ms ease-out, transform 150ms ease-out',
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
          style={{
            color: accentValue ? accent : 'var(--sf-text-primary)',
            fontSize: 24,
            lineHeight: 1.1,
          }}
          title={String(value)}
        >
          {value}
        </div>
      )}
      <div
        className="truncate"
        style={{ color: 'var(--sf-text-secondary)', fontSize: 13, marginTop: 2 }}
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
      <Card icon={Users} label="Players" value={players} loading={loading} />
      <Card icon={Calendar} label="Events" value={events} loading={loading} accent="var(--sf-info)" />
      <Card
        icon={DollarSign}
        label="Collected"
        value={formatCurrency(collected)}
        loading={loading}
        accent="var(--sf-success)"
        accentValue
      />
      <Card
        icon={AlertCircle}
        label="Outstanding"
        value={formatCurrency(outstanding)}
        loading={loading}
        accent={outstanding > 0 ? 'var(--sf-warning)' : 'var(--sf-text-tertiary)'}
        accentValue={outstanding > 0}
      />
    </div>
  );
}
