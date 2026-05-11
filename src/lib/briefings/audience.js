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
  // RPC emits a single synthetic row with guardian_id=null when override
  // is active + pilot_only=true. team_ids is populated with all org teams,
  // so the synthetic row passes any audience-scope filter. Surface as a
  // distinct mode so callers can render "Pilot test recipient: admin@..."
  // copy rather than "Will send to 1 family."
  const isPilotTestOverride =
    Array.isArray(recipientsFiltered) &&
    recipientsFiltered.length === 1 &&
    recipientsFiltered[0]?.guardian_id == null;
  if (isPilotTestOverride) {
    return {
      filtered: 1,
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
    return `Pilot test recipient: ${testRecipientEmail || 'admin@'} (end-to-end test send only — no real families).`;
  }
  if (mode === 'pilot_zero') {
    return `Pilot Mode is filtering this team to 0 pilot guardians (out of ${total}). Send will not deliver to anyone. Disable pilot mode to send to all ${total}.`;
  }
  if (mode === 'pilot_partial') {
    return `Pilot Mode is ON — sending to ${filtered} pilot guardians (out of ${total}). Disable pilot mode to send to all ${total}.`;
  }
  if (filtered == null) return 'Computing audience…';
  return `Will send to ${filtered} ${filtered === 1 ? 'family' : 'families'}.`;
}
