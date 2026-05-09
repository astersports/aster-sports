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

// Borders + backgrounds
export const BORDER_DEFAULT   = '#e5e7eb';
export const BORDER_SUBTLE    = '#f1f5f9';
export const BG_PAGE          = '#f8fafc';
export const BG_WHITE         = '#ffffff';

// Status (W/L/T tones in resultsTable, outcome tones in scenarios)
export const STATUS_WIN       = '#16a34a';
export const STATUS_LOSS      = '#dc2626';
export const STATUS_NEUTRAL   = '#94a3b8';
