// Single source of truth for which staff appear in a message's contact block.
//
// Contact info is OFF by default and renders ONLY when the admin enables the
// per-message toggle AND explicitly picks staff. There is intentionally NO
// fallback to "all staff" — that fallback put the full roster (e.g. Frank +
// Kenny, the only two with phone numbers) on messages the admin never signed
// (Frank-reported 2026-06-09). Matches the digest path
// (sendWeeklyDigestFromWizard) which already has no fallback.
//
// Used by BOTH the send path (composeLegacy) and the live preview
// (PreviewPanel) so the two can never diverge (the preview previously ignored
// the toggle entirely and always rendered the block).
export function selectSignoffCoaches(state) {
  return state?.signoff_enabled === true && Array.isArray(state.signoff_coaches)
    ? state.signoff_coaches
    : [];
}
