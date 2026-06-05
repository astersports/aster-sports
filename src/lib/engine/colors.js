// Wave 3.6 — accessibility-tuned color tokens for engine renderers.
// Email HTML can't reliably use CSS variables (most clients strip or
// inline them); this module centralizes named hex constants so renderers
// don't inline literal hex on a per-surface basis.
//
// Contrast values are vs. white (#ffffff) per WCAG.
// AA threshold = 4.5:1 for body text, 3:1 for large/UI.

// Strong text — primary surfaces
export const TEXT_NAVY        = '#0f172a';   // 17.4:1 — primary event titles, body notes
export const TEXT_SLATE_DARK  = '#334155';   // 11.7:1 — anchor text, day-suffix surfaces
export const TEXT_GRAPHITE    = '#475569';   //  7.5:1 — RSVP counts, mid-weight muted
export const TEXT_SLATE       = '#64748b';   //  5.0:1 — secondary (time + location)
export const TEXT_MIST        = '#94a3b8';   //  3.2:1 — large-font atmospheric only

// Brand cobalt
export const COBALT           = '#4a8fd4';   // Legacy Hoopers brand cobalt — UI/headers
export const COBALT_DEEP      = '#2563eb';   //  4.6:1 — eyebrow contrast variant (passes AA)

// Tournament + warning accents
export const AMBER_DEEP       = '#92400e';   //  6.6:1 — tournament suffix amber
export const GOLD             = '#fbbf24';
export const CREAM            = '#fffbeb';

// PR-D cancellation card — warn tone (NOT red). Matches the
// BRIEFING_FULL_PRESENTATION §4 spec (--warn #b54708 / --warn-wash #fef3e6 /
// --warn-line #f3dcb8). Left border + label pill use WARN; the wash is the
// card fill so the treatment reads as caution, distinct from the red
// destructive RSVP_OUT_RED used elsewhere.
export const WARN             = '#b54708';   //  5.9:1 — cancellation label + left border
export const WARN_WASH        = '#fef3e6';   // cancellation card fill
export const WARN_LINE        = '#f3dcb8';   // cancellation card border

// Borders + backgrounds
export const BORDER_DEFAULT   = '#e5e7eb';
export const BORDER_SUBTLE    = '#f1f5f9';
export const BG_PAGE          = '#f8fafc';

// Status (W/L/T tones in resultsTable, outcome tones in scenarios)
export const STATUS_WIN       = '#16a34a';
export const STATUS_LOSS      = '#dc2626';

// Recap game-cell result pills (games_recap / game_recap framed treatment).
// Explicit light bg + dark text per pill so they read in both light and
// dark email clients — never relying on transparency that inverts.
export const PILL_WIN_BG      = '#dcfce7';   // success-soft
export const PILL_WIN_TX      = '#15803d';   //  4.5:1 on win bg — WIN pill text
export const PILL_LOSS_BG     = '#fee2e2';   // danger-soft
export const PILL_LOSS_TX     = '#b91c1c';   //  5.9:1 on loss bg — LOSS pill text
export const PILL_TIE_BG      = '#fef3c7';   // warning-soft
export const PILL_TIE_TX      = '#b45309';   //  4.5:1 on tie bg — TIE pill text

// Wave 3.7 hotfix §D-RSVP-1 — RSVP count tones in renderer #6.
// Compound visual: each count + label colored to its status. Separators
// remain in TEXT_GRAPHITE for visual breathing room.
export const RSVP_GOING_GREEN = '#16a34a';   //  4.6:1 — going (positive)
export const RSVP_MAYBE_AMBER = '#d97706';   //  4.5:1 — maybe (caution)
export const RSVP_OUT_RED     = '#dc2626';   //  4.7:1 — out (negative)
