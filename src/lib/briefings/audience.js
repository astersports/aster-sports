// Wave 4.1b §2 — Bug B. Audience computation extracted to a pure
// module so unit tests can validate the pilot-mode message without
// mounting React.
//
// Inputs:
//   recipientsFiltered — output of get_digest_recipients with
//     pilot_only=true (or =false when org pilot mode is off)
//   recipientsTotal    — output of the same RPC with pilot_only=false
//     (always the full guardian list); pass `null` if you don't have it
//   audienceType, audienceFilter, anchorId — wizard state
//   pilotModeOn — org setting
//
// Output: { filtered, total, pilotModeOn, mode }
//   mode ∈ 'pilot_zero' | 'pilot_partial' | 'standard'
// Both `filtered` and `total` are run through the SAME audience-type
// filter so the comparison is apples-to-apples. `total` may be null
// when the caller did not fetch the unfiltered list (pilot off → no
// extra fetch needed; the standard copy is correct).

const TEAM_AUDIENCE_TYPES = new Set(['team']);
const MULTI_TEAM_AUDIENCE_TYPES = new Set(['multi_team']);

export function countByAudienceType({ recipients, audienceType, audienceFilter, anchorId }) {
  if (!recipients) return null;
  if (!audienceType) return null;
  if (audienceType === 'org_all') return recipients.length;
  if (TEAM_AUDIENCE_TYPES.has(audienceType)) {
    const teamId = audienceFilter?.team_id || anchorId;
    if (!teamId) return null;
    return recipients.filter((r) => (r.team_ids || []).includes(teamId)).length;
  }
  if (MULTI_TEAM_AUDIENCE_TYPES.has(audienceType)) {
    const ids = audienceFilter?.team_ids || (anchorId ? [anchorId] : []);
    if (!ids.length) return null;
    return recipients.filter((r) => (r.team_ids || []).some((t) => ids.includes(t))).length;
  }
  return null;
}

export function computeAudience({
  recipientsFiltered,
  recipientsTotal,
  audienceType,
  audienceFilter,
  anchorId,
  pilotModeOn,
}) {
  // Wave 4.3-I: pilot_test_recipient_email override.
  // Wave 4.3-L: detection generalized to N synthetic rows. 4.3-J added
  // per-team fan-out — the RPC now emits one synthetic row per team
  // (5 for Legacy Hoopers) when override is active. 4.3-I checked
  // length === 1, which falsely fell through to pilot_partial mode
  // post-4.3-J. Now: any non-empty list where EVERY row has
  // guardian_id=null is the synthetic-override state. Real-guardian
  // mixes never satisfy the every() predicate.
  const isPilotTestOverride =
    Array.isArray(recipientsFiltered) &&
    recipientsFiltered.length >= 1 &&
    recipientsFiltered.every((r) => r?.guardian_id == null);
  if (isPilotTestOverride) {
    return {
      filtered: recipientsFiltered.length,
      total: Array.isArray(recipientsTotal) ? recipientsTotal.length : null,
      pilotModeOn: !!pilotModeOn,
      mode: 'pilot_test_override',
      testRecipientEmail: recipientsFiltered[0].email || null,
    };
  }
  const filtered = countByAudienceType({ recipients: recipientsFiltered, audienceType, audienceFilter, anchorId });
  const total = countByAudienceType({ recipients: recipientsTotal, audienceType, audienceFilter, anchorId });
  let mode = 'standard';
  if (pilotModeOn && total != null && filtered != null) {
    if (filtered === 0 && total > 0) mode = 'pilot_zero';
    else if (filtered < total) mode = 'pilot_partial';
  }
  return { filtered, total, pilotModeOn: !!pilotModeOn, mode };
}

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
