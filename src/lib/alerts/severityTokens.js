// Tier 3 v1 PR 3 — severity visual tokens.
//
// Single source of truth for how alert severity renders across the
// app. Components import SEVERITY_TOKENS and use the var() refs
// inline. No hardcoded hex per CLAUDE.md anti-pattern #2/#10. No new
// CSS variables invented — existing --as-* tokens from index.css
// are the underlying source.
//
// Three severity levels per Gap 3 + Tier 3 spec:
//   critical — red, demands immediate action (e.g., yes_count < 5 on
//              game day)
//   warning  — amber, attention needed but not urgent (e.g., RSVP
//              shortfall checkpoint)
//   info     — blue-slate, advisory only (e.g., data integrity)
//
// Token shape per severity:
//   bg          — soft background tint for filled blocks
//   border      — primary color for borders + dividers
//   text        — primary color for text + icon stroke
//   icon        — lucide-react component name (string; consumers
//                 import the component themselves)
//   label       — human-readable severity name
//   ariaLabel   — same as label; pulled out so consumers don't need
//                 to read shape

export const SEVERITY_TOKENS = {
  critical: {
    bg:        'var(--as-danger-soft)',
    border:    'var(--as-danger)',
    text:      'var(--as-danger)',
    icon:      'AlertCircle',
    label:     'Critical',
    ariaLabel: 'Critical severity',
  },
  warning: {
    bg:        'var(--as-warning-soft)',
    border:    'var(--as-warning)',
    text:      'var(--as-warning)',
    icon:      'AlertTriangle',
    label:     'Warning',
    ariaLabel: 'Warning severity',
  },
  info: {
    bg:        'var(--as-info-soft)',
    border:    'var(--as-info)',
    text:      'var(--as-info)',
    icon:      'Info',
    label:     'Info',
    ariaLabel: 'Information',
  },
};

// Fallback for unknown/missing severity. Renders as a neutral chip
// rather than throwing — alert evaluator might emit a new severity
// kind before the renderer ships an update; we'd rather render
// neutrally than crash.
export const NEUTRAL_TOKEN = {
  bg:        'var(--as-bg-secondary)',
  border:    'var(--as-border-default)',
  text:      'var(--as-text-secondary)',
  icon:      'Info',
  label:     'Status',
  ariaLabel: 'Status',
};

export function tokensForSeverity(severity) {
  return SEVERITY_TOKENS[severity] || NEUTRAL_TOKEN;
}

// Severity ordering for sort + ranking surfaces. Higher = more urgent.
export const SEVERITY_RANK = { info: 0, warning: 1, critical: 2 };

export function compareSeverityDesc(a, b) {
  return (SEVERITY_RANK[b] ?? -1) - (SEVERITY_RANK[a] ?? -1);
}
