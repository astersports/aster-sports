// Audience guidance copy, extracted from audience.js to keep that module
// under the 150-line cap (CLAUDE.md §6). Re-exported from audience.js so
// existing import paths are unchanged.

// Wave 4.1d-2 §3.1 — pilot guidance copy is more direct about the fix:
// admins toggle pilot mode in the Org Settings → Communications card
// (not yet a deeplink — falls back to settings page when wired).
//
// §2.3 — audienceCopy never shows a literal "0 families" pre-resolution.
// The picker already passes filtered=null while loading; we keep the
// "Computing audience…" copy. Callers (AudiencePicker, StepBodySignoff)
// gate the count line behind a loading guard before showing this copy
// so 0-families flashes are eliminated.
export function audienceCopy({ filtered, total, mode, testRecipientEmail }) {
  if (mode === 'pilot_test_override') {
    // Wave 4.3-K Item 4: explicit pilot test mode copy. Names the test
    // recipient and the dormant-family count separately so admins don't
    // confuse the synthetic admin@ row with a real pilot family. N team
    // views = filtered count from upstream (1 or N depending on test
    // scope picker); M = total real-guardian universe.
    // Wave 4.3-L: append "families" noun on the dormant-tail count for
    // consistency with the rest of the pilot copy variants.
    const email = testRecipientEmail || 'admin@';
    const teamViews = typeof filtered === 'number' ? filtered : 1;
    const viewLabel = teamViews === 1 ? '1 team view' : `${teamViews} team views`;
    const familyCount = typeof total === 'number' ? total : null;
    const tail = familyCount != null
      ? ` Disable pilot mode in Settings to send to all ${familyCount} families.`
      : '';
    return `Pilot test mode — sending to ${email} (${viewLabel}).${tail}`;
  }
  // Wave 4.3-L: noun change. Pilot audience scopes by family, not guardian
  // (each family has 1-2 guardians). Copy now reads "pilot families" to
  // match the actual audience model.
  if (mode === 'pilot_zero') {
    return `Pilot Mode is filtering this team to 0 pilot families (out of ${total}). Send will not deliver to anyone. Disable pilot mode to send to all ${total}.`;
  }
  if (mode === 'pilot_partial') {
    return `Pilot Mode is ON — sending to ${filtered} pilot families (out of ${total}). Disable pilot mode to send to all ${total}.`;
  }
  if (filtered == null) return 'Computing audience…';
  return `Will send to ${filtered} ${filtered === 1 ? 'family' : 'families'}.`;
}
