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
  const filtered = countByAudienceType({ recipients: recipientsFiltered, audienceType, audienceFilter, anchorId });
  const total = countByAudienceType({ recipients: recipientsTotal, audienceType, audienceFilter, anchorId });
  let mode = 'standard';
  if (pilotModeOn && total != null && filtered != null) {
    if (filtered === 0 && total > 0) mode = 'pilot_zero';
    else if (filtered < total) mode = 'pilot_partial';
  }
  return { filtered, total, pilotModeOn: !!pilotModeOn, mode };
}

export function audienceCopy({ filtered, total, mode }) {
  if (mode === 'pilot_zero') {
    return `${total} families on roster. Pilot mode is ON — filtering to 0 pilot guardians. Send will not deliver to anyone. Disable pilot mode in Settings → Communications to send to all ${total}.`;
  }
  if (mode === 'pilot_partial') {
    return `${total} families on roster. Pilot mode is ON — sending to ${filtered} pilot guardians only. Disable pilot mode to send to all ${total}.`;
  }
  if (filtered == null) return 'Computing audience…';
  return `Will send to ${filtered} ${filtered === 1 ? 'family' : 'families'}.`;
}
