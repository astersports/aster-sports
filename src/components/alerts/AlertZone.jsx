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
//
// Loading-state gate (CLAUDE.md §16.3 kindness-microcopy invariant):
// the AllClearPill must NOT render before useAlertEvaluator's query
// resolves. Rendering "All clear" optimistically while alerts are
// still being evaluated is false reassurance — a coach scanning
// during the load window could walk away thinking nothing's wrong,
// missing the actual amber/red state. When loading + no alerts:
// collapsible variant renders nothing (pill is small, layout
// adjusts fine); always-visible renders the section header + a
// shape-matched skeleton so the layout doesn't jump.

import AlertCard from './AlertCard';
import AllClearPill from './AllClearPill';
import { compareSeverityDesc } from '../../lib/alerts/severityTokens';

function sortedAlerts(alerts) {
  return [...(alerts || [])].sort((a, b) => compareSeverityDesc(a.severity, b.severity));
}

const SECTION_LABEL_STYLE = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--as-text-tertiary)',
  marginBottom: 8,
};

const SKELETON_STYLE = {
  height: 52, borderRadius: 10,
  backgroundColor: 'var(--as-bg-tertiary)',
};

// Wave 2.B post-#570 fix: a single 52px pulse reads as empty white
// space against the expected stack of 3-6 alert cards (Frank iPhone
// smoke). Stack three shape-matched blocks so layout occupies the
// space the real list will fill once useAlertEvaluator resolves.
// Wave 2.B post-#570 follow-up: skeleton was rendering but invisible
// on iPhone — --as-bg-secondary (#F1F3F5) against --as-bg-page
// (#F7F8FA) is a single shade apart, and as-pulse drops opacity to
// 0.4-0.7, reading as empty white space. Switched to --as-bg-tertiary
// (#E9ECEF) to match LoadingSkeleton.jsx and the rest of the codebase's
// shape-matched skeletons. Border dropped (it stacked with the lighter
// fill to vanish entirely).
const SKELETON_COUNT = 3;

export default function AlertZone({ alerts = [], variant = 'always_visible', sectionLabel = 'ALERTS', loading = false }) {
  const hasAlerts = alerts.length > 0;

  // Loading + no alerts: suppress AllClearPill until the query
  // resolves, per the kindness-microcopy invariant above.
  if (loading && !hasAlerts) {
    if (variant === 'collapsible') return null;
    return (
      <section className="min-w-0" aria-label="Alerts" aria-busy="true">
        <div style={SECTION_LABEL_STYLE}>{sectionLabel}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div key={i} className="as-pulse" aria-hidden="true" style={SKELETON_STYLE} />
          ))}
        </div>
      </section>
    );
  }

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
      <div style={SECTION_LABEL_STYLE}>{sectionLabel}</div>
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
