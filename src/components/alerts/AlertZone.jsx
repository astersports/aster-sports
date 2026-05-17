// Tier 3 v1 PR 3 — alert zone container shell.
//
// Per Gap 1 lock — two render variants:
//
//   variant="always_visible" — admin home. Always renders. When no
//     alerts, shows AllClearPill in inline mode. When alerts firing,
//     shows them as a stacked list, sorted by severity descending.
//
//   variant="collapsible" — parent/coach home. When no alerts, shows
//     ONLY the AllClearPill in pill mode (compact). When alerts
//     firing, expands into the full alert list (admin-style).
//
// Alerts are pre-sorted by compareSeverityDesc so critical surfaces
// first. PR 4/5/6 hooks pass the alerts array; this component
// doesn't fetch.

import AlertCard from './AlertCard';
import AllClearPill from './AllClearPill';
import { compareSeverityDesc } from '../../lib/alerts/severityTokens';

function sortedAlerts(alerts) {
  return [...(alerts || [])].sort((a, b) => compareSeverityDesc(a.severity, b.severity));
}

export default function AlertZone({ alerts = [], variant = 'always_visible', sectionLabel = 'ALERTS' }) {
  const hasAlerts = alerts.length > 0;

  // Collapsible variant + no alerts = pill only, no section header.
  if (variant === 'collapsible' && !hasAlerts) {
    return (
      <div className="min-w-0" aria-label="Alerts">
        <AllClearPill mode="pill" />
      </div>
    );
  }

  // Always-visible OR collapsible-with-alerts = full section.
  return (
    <section className="min-w-0" aria-label="Alerts">
      <div style={{
        fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'var(--em-text-tertiary)',
        marginBottom: 8,
      }}>
        {sectionLabel}
      </div>
      {!hasAlerts ? (
        <AllClearPill mode="inline" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sortedAlerts(alerts).map((alert) => (
            <AlertCard key={alert.config_id} alert={alert} />
          ))}
        </div>
      )}
    </section>
  );
}
