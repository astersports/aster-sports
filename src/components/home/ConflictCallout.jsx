// Tier 3 v1 PR 5 — multi-kid schedule conflict callout for parents.
//
// Renders only when detectConflicts returns ≥1 conflict for the
// current parent's kids in the next 7 days. Empty state = nothing
// rendered (no false signal). Each conflict shows date + kid-A vs
// kid-B with team-color dots so multi-kid families can scan quickly.
//
// Visual tokens follow severity=warning per design system. AlertCard
// uses the same shape; this is a sibling callout (not a generic
// alert) because conflicts are derived from local schedule data,
// not from alert_configurations.

import { AlertTriangle } from 'lucide-react';

export default function ConflictCallout({ conflicts }) {
  if (!conflicts || !conflicts.length) return null;
  const plural = conflicts.length === 1 ? '' : 's';
  return (
    <div role="alert" aria-label={`${conflicts.length} schedule conflict${plural} detected`}
      style={{
        display: 'flex', flexDirection: 'column', gap: 8,
        padding: '12px 14px', borderRadius: 10,
        backgroundColor: 'var(--as-warning-soft)', border: '1px solid var(--as-warning)',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <AlertTriangle size={18} strokeWidth={1.75} color="var(--as-warning)" aria-hidden="true" />
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--as-warning)' }}>
          Schedule conflict{plural} detected
        </div>
      </div>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, listStyle: 'none', padding: 0, margin: 0 }}>
        {conflicts.map((c, i) => (
          <li key={i} style={{ fontSize: 13, color: 'var(--as-text-secondary)', lineHeight: 1.4 }}>
            <span style={{ fontWeight: 500, color: 'var(--as-text-primary)' }}>{c.date_label}</span>
            {': '}
            <span style={{ color: c.color_a }} aria-hidden="true">●</span> {c.kid_a} {c.time_a} ({c.team_a})
            {' · '}
            <span style={{ color: c.color_b }} aria-hidden="true">●</span> {c.kid_b} {c.time_b} ({c.team_b})
            {c.reason === 'tight_travel' && (
              <span style={{ color: 'var(--as-text-tertiary)', fontStyle: 'italic' }}> — tight travel</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
