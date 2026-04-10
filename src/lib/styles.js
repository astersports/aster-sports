// Shared CSS class strings & inline-style objects.
// Every form, modal, button, and pill across the app should use these so the
// look stays consistent and dark-mode safe.
//
// Naming convention:
//   FOO         — Tailwind className string OR inline-style object (see below)
//   FOO_STYLE   — inline `style={}` object that pairs with the FOO className
//   FOO_CLS     — Tailwind className string when FOO is the style object
//
// In general, names without a suffix are the "thing you most often spread
// onto an element". For modals that means the inline style (since the
// className is shared with multiple modal sizes), and for buttons that means
// the className (since the inline style only carries the brand colors).

// ─── Form inputs ─────────────────────────────────────────────
export const INPUT_CLS =
  'w-full border border-(--color-border-tertiary) rounded px-3 py-2 text-sm bg-(--color-background) text-(--color-text-primary) focus:outline-none focus:ring-2 focus:ring-[var(--sf-accent)]';

// Same input styling but without w-full — for inline / fixed-width inputs
// (used inside EventInteractions where some inputs sit beside each other).
export const INPUT_CLS_INLINE =
  'border border-(--color-border-tertiary) rounded px-3 py-2 text-sm bg-(--color-background) text-(--color-text-primary) focus:outline-none focus:ring-2 focus:ring-[var(--sf-accent)]';

export const LABEL_CLS = 'block text-sm font-medium text-(--color-text-primary) mb-1';

// ─── Buttons ─────────────────────────────────────────────────
// BTN_PRIMARY is the className. BTN_PRIMARY_STYLE is the inline style that
// applies the brand accent color (the only way to wire CSS vars into a button
// without baking the brand into the utility class).
export const BTN_PRIMARY = 'px-4 py-2 text-sm font-medium rounded disabled:opacity-50';
export const BTN_PRIMARY_STYLE = {
  backgroundColor: 'var(--sf-accent)',
  color: 'var(--sf-text-on-dark)',
};

export const BTN_SECONDARY =
  'px-4 py-2 text-sm font-medium rounded border border-(--color-border-tertiary) text-(--color-text-primary) hover:bg-(--color-background-secondary)';

export const BTN_DANGER =
  'px-4 py-2 text-sm font-medium rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50';

// ─── Modals ──────────────────────────────────────────────────
// MODAL_BACKDROP / MODAL_PANEL are inline-style objects (the bits that need a
// CSS variable), and MODAL_BACKDROP_CLS / MODAL_PANEL_CLS are the className
// strings that go alongside them. Together they implement the standard
// "rgba(0,0,0,0.5) backdrop, white panel, full-screen on mobile, rounded
// card on desktop" pattern.
export const MODAL_BACKDROP = { backgroundColor: 'rgba(0,0,0,0.5)' };
export const MODAL_PANEL = { backgroundColor: 'var(--color-background-primary, #ffffff)' };

// Large form modal — full-screen on mobile, centered card on desktop.
export const MODAL_BACKDROP_CLS =
  'fixed inset-0 z-50 flex items-start sm:items-center justify-center px-0 sm:px-4 overflow-y-auto';
export const MODAL_PANEL_CLS =
  'sm:rounded-lg shadow-lg w-full sm:max-w-lg sm:max-h-[90vh] min-h-screen sm:min-h-0 overflow-y-auto p-6 sm:my-8';

// Small confirm/info modal — always centered.
export const MODAL_CENTER_CLS = 'fixed inset-0 z-50 flex items-center justify-center px-4';
export const MODAL_CENTER_PANEL_SM_CLS = 'rounded-lg shadow-lg w-full max-w-sm p-6';
export const MODAL_CENTER_PANEL_MD_CLS = 'rounded-lg shadow-lg w-full max-w-md p-6';

// ─── Pills (filter chips) ───────────────────────────────────
// Inline styles because the brand color comes from a CSS variable.
export const PILL_ACTIVE = {
  backgroundColor: 'var(--sf-accent)',
  color: 'var(--sf-text-on-dark)',
};
export const PILL_INACTIVE = {
  backgroundColor: 'var(--color-background-secondary)',
  color: 'var(--color-text-secondary)',
};
export const PILL_CLS = 'px-3 py-1.5 rounded-full text-sm font-medium transition-colors';

// ─── Cards ──────────────────────────────────────────────────
// Used by EventCard (Schedule) and PlayerCard (Roster). Each card adds its
// own left-border color via inline style.
export const CARD_CLS =
  'bg-(--color-background) rounded-lg shadow-sm border border-(--color-border-tertiary) overflow-hidden cursor-pointer transition-all';

// ─── Event-type colored badges ──────────────────────────────
// Maps event_type → Tailwind utility classes for the small "Practice / Game /
// Tournament / Other" pills. Lives in styles.js (not constants.js) because
// it's pure presentation, not a domain enum.
export const TYPE_BADGE_CLS = {
  practice: 'bg-emerald-100 text-emerald-800',
  game: 'bg-blue-100 text-blue-800',
  tournament: 'bg-purple-100 text-purple-800',
  other: 'bg-slate-100 text-slate-700',
};
