// Tier 3 v1 PR 3 — renders a single firing alert.
//
// Consumes a firing-alert object from evaluateAlerts(). Uses severity
// tokens for visual treatment. Content + routing helpers live in
// alertCardHelpers.js (extracted for the 150-line cap).
//
// Interaction model — every alert is actionable (no dead cards):
//   - List-bearing alerts (location/opponent/data-integrity events,
//     game_recap / tournament_recap / tournament_prelim briefings)
//     expand on tap into a per-item list; each row taps through to the
//     event editor or the composer pre-filled.
//   - Single-action alerts (weekly briefing, payments) tap through
//     directly to their action via navTargetForAlert.

import { useState } from 'react';
import { AlertCircle, AlertTriangle, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tokensForSeverity } from '../../lib/alerts/severityTokens';
import {
  alertBody, alertTitle, composeTargetFor,
  EXPANDABLE_BRIEFING_INSTANCES, EXPANDABLE_TYPES, navTargetForAlert, rowPropsForItem, TOURNAMENT_BRIEFING_INSTANCES,
} from './alertCardHelpers';

const ICONS = { AlertCircle, AlertTriangle, Info };

function AlertItemRow({ title, subtitle, onTap, cta }) {
  return (
    <button type="button" onClick={onTap} className="as-press"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%', minHeight: 44, padding: '8px 0', background: 'none', border: 'none', borderTop: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer', textAlign: 'left' }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--as-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)' }}>{subtitle}</div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--as-accent)', flexShrink: 0 }}>{cta}</span>
    </button>
  );
}

export default function AlertCard({ alert }) {
  const tokens = tokensForSeverity(alert.severity);
  const Icon = ICONS[tokens.icon] || Info;
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const isBriefingRecap = alert.alert_type_key === 'briefing_overdue' && EXPANDABLE_BRIEFING_INSTANCES.has(alert.instance_key);
  const events = alert.data?.events || [];
  const tournaments = alert.data?.tournaments || [];
  const usesTournaments = TOURNAMENT_BRIEFING_INSTANCES.has(alert.instance_key);
  const items = isBriefingRecap && usesTournaments ? tournaments : events;
  const canExpand = (EXPANDABLE_TYPES.has(alert.alert_type_key) || isBriefingRecap) && items.length > 0;
  const navTarget = canExpand ? null : navTargetForAlert(alert);
  const interactive = canExpand || !!navTarget;
  const fixTarget = (e) => `/events/${e.id}?edit=1`;

  return (
    <div role="alert" aria-label={`${tokens.ariaLabel}: ${alertTitle(alert)}`}
      style={{ borderRadius: 10, backgroundColor: tokens.bg, border: `1px solid ${tokens.border}` }}>
      <button type="button"
        onClick={() => { if (canExpand) setExpanded((v) => !v); else if (navTarget) navigate(navTarget); }}
        aria-expanded={canExpand ? expanded : undefined}
        disabled={!interactive}
        className="as-press"
        style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', padding: '12px 14px', background: 'none', border: 'none', cursor: interactive ? 'pointer' : 'default', textAlign: 'left' }}>
        <Icon size={18} strokeWidth={1.75} color={tokens.text} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: tokens.text, marginBottom: 2 }}>{alertTitle(alert)}</div>
          <div style={{ fontSize: 13, color: 'var(--as-text-secondary)', lineHeight: 1.4 }}>{alertBody(alert)}</div>
        </div>
        {canExpand && <ChevronDown size={16} strokeWidth={1.75} color={tokens.text} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1, transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 150ms' }} />}
        {navTarget && <ChevronRight size={16} strokeWidth={1.75} color={tokens.text} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} />}
      </button>
      {canExpand && expanded && (
        <div style={{ padding: '0 14px 8px 44px' }}>
          {items.slice(0, 10).map((item, i) => (
            <AlertItemRow key={item.id ?? `idx-${i}`} {...rowPropsForItem(alert, item)}
              onTap={() => navigate(isBriefingRecap ? composeTargetFor(alert, item) : fixTarget(item))} />
          ))}
          {items.length > 10 && (
            <div style={{ fontSize: 11, color: 'var(--as-text-tertiary)', padding: '8px 0 4px' }}>
              … and {items.length - 10} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}
