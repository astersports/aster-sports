// Shared style objects + the searchable settings catalog for the
// /admin/settings L99 enhancement pass. Kept as a plain module (no JSX) so the
// page + the new admin-settings components share one source of truth and each
// file stays well under the 150-line cap. Token-only colors per CLAUDE.md §0/§3.

export const SECTION_LABEL = {
  display: 'flex', alignItems: 'center', gap: 6,
  fontSize: 11, fontWeight: 500, color: 'var(--as-text-tertiary)',
  textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px 4px',
};
export const CARD = {
  backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)',
  borderRadius: 10, boxShadow: 'var(--as-shadow-sm)', overflow: 'hidden', marginBottom: 20,
};
export const ROW = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  width: '100%', minHeight: 56, padding: '0 16px', textAlign: 'left',
  background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
};
export const DIVIDER = { height: 1, backgroundColor: 'var(--as-border-subtle)', margin: '0 16px' };

// Keyword index for search-settings: each section's searchable terms. The page
// builds rows from live summaries; this only powers the filter match so a search
// for "email", "rsvp", "timezone" etc. finds the right row even when the term
// is not in the visible title.
export const SEARCH_KEYWORDS = {
  org: 'organization name season timezone mailing address general',
  autonotif: 'automatic messages reminders nudges rsvp notifications cadence',
  channels: 'channels push email per category delivery',
  alerts: 'alerts rsvp briefings data integrity warnings',
  features: 'event features rides carpool volunteers duties',
  sender: 'sender identity from name from email reply-to communications',
  pilot: 'pilot mode test recipient go-live cutover families',
};
