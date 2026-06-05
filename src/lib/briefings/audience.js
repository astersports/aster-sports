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

// COMPOSE-FRONT P1: types whose count needs an async anchor/player lookup
// (resolveAudience in recipientFilter.js). countByAudienceType returns null
// for these; useResolvedAudienceCount supplies the number and computeAudience
// merges it via the resolvedCount override.
export const ASYNC_RESOLVED_AUDIENCE_TYPES = new Set([
  'event_attendees', 'tournament_attendees', 'multi_event_attendees', 'player_specific',
]);

export function countByAudienceType({ recipients, audienceType, audienceFilter, anchorId }) {
  if (!recipients) return null;
  if (!audienceType) return null;
  if (audienceType === 'org_all') return recipients.length;
  // COMPOSE-FRONT P1: coach_self = the single composing coach; family_specific
  // = one family (family_guide aggregates per parent_user_id). Both resolve to
  // 1, so the count line + send gate stop reading "Computing audience…" forever.
  if (audienceType === 'coach_self' || audienceType === 'family_specific') return 1;
  if (TEAM_AUDIENCE_TYPES.has(audienceType)) {
    // 5d-b-1: prefer audience_filter.team_ids[] (new shape from
    // TeamGroupedPicker). Fall back to legacy audience_filter.team_id
    // (singular) so in-flight drafts saved pre-5d-b-1 still resolve.
    // Final fallback to anchorId for the old SendBriefingButton path.
    const ids = audienceFilter?.team_ids;
    if (Array.isArray(ids) && ids.length) {
      return recipients.filter((r) => (r.team_ids || []).some((t) => ids.includes(t))).length;
    }
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
  // COMPOSE-FRONT P1: async-resolved recipient count for the anchor/player
  // audience types (see ASYNC_RESOLVED_AUDIENCE_TYPES). When provided and
  // countByAudienceType returns null, this number stands in for `filtered`
  // so the count line + send gate stop treating an unknown audience as 0.
  resolvedCount = null,
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
  const rawFiltered = countByAudienceType({ recipients: recipientsFiltered, audienceType, audienceFilter, anchorId });
  const rawTotal = countByAudienceType({ recipients: recipientsTotal, audienceType, audienceFilter, anchorId });
  // Merge the async-resolved count only when countByAudienceType can't
  // compute it (null). Never overrides a synchronously-known count. Anchor/
  // player audiences aren't pilot-scoped, so resolvedCount feeds both
  // filtered and total to keep the standard-mode comparison consistent.
  const useResolved = rawFiltered == null && typeof resolvedCount === 'number';
  const filtered = useResolved ? resolvedCount : rawFiltered;
  const total = rawTotal == null && useResolved ? resolvedCount : rawTotal;
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
