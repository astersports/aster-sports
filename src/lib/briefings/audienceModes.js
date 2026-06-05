// Audience one-control fix (BRIEFING_FINISH_LINE item 1a) — per-kind
// valid-audience-mode map + smart default + locked detection.
//
// This is a UI/presentation refactor over the EXISTING audience
// semantics. The valid modes + defaults are DERIVED 1:1 from the old
// AudiencePicker.modesAvailableFor + KIND_METADATA — no new audience
// modes are invented and no kind's send-side audience contract changes.
// The reducer still dispatches SET_AUDIENCE with the same
// (audience_type, audience_filter) shape the send pipeline consumes.
//
// MODES + NON_MODE_LABELS live here (moved out of AudiencePicker.jsx)
// so the audience-catalog parity guard
// (src/lib/__tests__/audienceCatalogParity.test.js) has one canonical
// home for the audience-type label set.

import { KIND_METADATA } from './kindMetadata';

// The 6 first-class audience modes the picker offers as buttons.
export const MODES = [
  { type: 'team', label: 'Single team' },
  { type: 'multi_team', label: 'Multi-team' },
  { type: 'tournament_attendees', label: 'Tournament' },
  { type: 'event_attendees', label: 'Event RSVPs' },
  { type: 'player_specific', label: 'Specific player(s)' },
  { type: 'org_all', label: 'All families' },
];

// Labels for audience types that aren't first-class modes but can be a
// kind's semantic default (coach_self for coach_roundup, family_specific
// for family_guide; multi_event_attendees for games_recap locked path).
export const NON_MODE_LABELS = {
  coach_self: 'Coach only',
  family_specific: 'This family',
  multi_event_attendees: "Selected games' families",
};

export function labelFor(type) {
  return MODES.find((m) => m.type === type)?.label || NON_MODE_LABELS[type] || type;
}

// family_guide override: the resolver keys off audience_filter.parent_user_id
// (per-parent aggregation), so audience_type is decorative for this kind.
// Frank-confirmed (item 1a): the smart default the admin sees is ALL
// FAMILIES, not "This family." Send semantics are unchanged — the
// resolver ignores audience_type for family_guide.
const SMART_DEFAULT_OVERRIDES = {
  family_guide: 'org_all',
};

// The smart default audience type the chip shows for a freshly-selected
// kind. Inherits KIND_METADATA.defaultAudienceType unless overridden above.
export function smartDefaultFor(kind) {
  if (SMART_DEFAULT_OVERRIDES[kind]) return SMART_DEFAULT_OVERRIDES[kind];
  return KIND_METADATA[kind]?.defaultAudienceType ?? null;
}

// Whether the audience is derived/locked (not user-choosable). Mirrors
// KIND_METADATA.audienceLocked — schedule_change, games_recap,
// academy_callup_notice today.
export function isAudienceLocked(kind) {
  return !!KIND_METADATA[kind]?.audienceLocked;
}

// One-line reason shown on a locked chip so the admin understands why
// they can't change it. Derived from each locked kind's anchor model.
const LOCKED_REASONS = {
  schedule_change: "Set by the event you're notifying about",
  games_recap: "Set by the games you picked",
  academy_callup_notice: 'Set by the player you called up',
};

export function lockedReasonFor(kind) {
  return LOCKED_REASONS[kind] || 'Set automatically for this briefing';
}

// The audience chip's display label — resolves team_ids to team names
// for team/multi_team so the chip reads "10U Black" not "Single team".
// teamsById is a Map(id -> { name }). Mirrors RecentAndFavorites.deriveLabel
// so the chip and the recent/favorite chips agree (AP #63).
export function deriveChipLabel(audienceType, audienceFilter, teamsById) {
  if (!audienceType) return 'Pick an audience';
  if (audienceType === 'org_all') return 'All families';
  const ids = audienceFilter?.team_ids || (audienceFilter?.team_id ? [audienceFilter.team_id] : []);
  if (audienceType === 'team') return (ids[0] && teamsById?.get(ids[0])?.name) || 'Single team';
  if (audienceType === 'multi_team') {
    if (!ids.length) return 'Multiple teams';
    if (ids.length <= 2) return ids.map((i) => teamsById?.get(i)?.name).filter(Boolean).join(' + ') || `${ids.length} teams`;
    return `${ids.length} teams`;
  }
  return labelFor(audienceType);
}

// The valid audience modes for a kind. Locked kinds expose only their
// single derived mode. Derived 1:1 from the old
// AudiencePicker.modesAvailableFor so the send-side contract is preserved.
export function modesForKind(kind) {
  const meta = KIND_METADATA[kind] || {};
  if (meta.audienceLocked) {
    const def = meta.defaultAudienceType;
    return [{ type: def, label: labelFor(def) }];
  }

  let modes;
  if (kind === 'weekly_digest') modes = MODES.filter((m) => ['org_all', 'team', 'multi_team'].includes(m.type));
  else if (kind === 'announcement') modes = MODES.filter((m) => ['team', 'org_all'].includes(m.type));
  else if (kind === 'game_recap' || kind === 'rsvp_nudge') modes = MODES.filter((m) => ['event_attendees', 'team'].includes(m.type));
  else if (kind === 'tournament_prelim' || kind === 'tournament_recap') modes = MODES.filter((m) => ['tournament_attendees'].includes(m.type));
  else if (kind === 'academy_callup_notice') modes = MODES.filter((m) => ['player_specific'].includes(m.type));
  // player_specific has no in-composer picker yet; academy_callup uses the
  // dedicated EventDetail flow via its audienceLocked path above.
  else if (kind === 'custom_message') modes = MODES.filter((m) => m.type !== 'player_specific');
  else modes = MODES;

  // If the kind's smart default isn't already a first-class mode
  // (coach_self for coach_roundup), prepend it so the admin can pick the
  // semantic default. (family_guide's default is overridden to org_all,
  // which is already a first-class mode, so nothing is prepended there.)
  const def = smartDefaultFor(kind);
  if (def && !modes.some((m) => m.type === def)) {
    modes = [{ type: def, label: labelFor(def) }, ...modes];
  }

  return modes;
}
