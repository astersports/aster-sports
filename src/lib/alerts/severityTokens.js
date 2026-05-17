// Tier 3 v1 PR 3 — severity visual tokens.
//
// Single source of truth for how alert severity renders across the
// app. Components import SEVERITY_TOKENS and use the var() refs
// inline. No hardcoded hex per CLAUDE.md anti-pattern #2/#10. No new
// CSS variables invented — existing --em-* tokens from index.css
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
    bg:        'var(--em-danger-soft)',
    border:    'var(--em-danger)',
    text:      'var(--em-danger)',
    icon:      'AlertCircle',
    label:     'Critical',
    ariaLabel: 'Critical severity',
  },
  warning: {
    bg:        'var(--em-warning-soft)',
    border:    'var(--em-warning)',
    text:      'var(--em-warning)',
    icon:      'AlertTriangle',
    label:     'Warning',
    ariaLabel: 'Warning severity',
  },
  info: {
    bg:        'var(--em-info-soft)',
    border:    'var(--em-info)',
    text:      'var(--em-info)',
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
  bg:        'var(--em-bg-secondary)',
  border:    'var(--em-border-default)',
  text:      'var(--em-text-secondary)',
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
