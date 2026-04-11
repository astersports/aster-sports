import { Users, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';

// 2x2 KPI grid at the top of the admin dashboard. Each card renders the
// same shell — small icon top-left, big value, small secondary label.
// `min-w-0` on the card is load-bearing: without it, a long currency
// value like "$999,999.99" would widen its grid column past 50% of the
// viewport and blow out the parent (CSS grid items default to
// min-width: auto, which refuses to shrink below content width).
function Card(props) {
  const { label, value, accent } = props;
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
      <div
        className="font-bold truncate"
        style={{ color: 'var(--sf-text-primary)', fontSize: 24, lineHeight: 1.1 }}
        title={String(value)}
      >
        {value}
      </div>
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
  const placeholder = '—';

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card
        icon={Users}
        label="Players"
        value={loading ? placeholder : players}
      />
      <Card
        icon={Calendar}
        label="Events"
        value={loading ? placeholder : events}
      />
      <Card
        icon={DollarSign}
        label="Collected"
        accent="var(--sf-success)"
        value={loading ? placeholder : formatCurrency(collected)}
      />
      <Card
        icon={AlertCircle}
        label="Outstanding"
        accent="var(--sf-warning)"
        value={loading ? placeholder : formatCurrency(outstanding)}
      />
    </div>
  );
}
