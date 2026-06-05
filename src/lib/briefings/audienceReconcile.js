// Compose entry point #2 ("Message this team") — reconcile a pre-filled
// audience against a freshly-chosen kind. The team entry point lands in
// the composer with audience_type='team' + audience_filter.team_ids
// pre-set (buildInitial → audienceFromAnchor). When the admin then picks
// a kind, that team audience must be HONORED only when the kind actually
// supports a team audience; otherwise it falls back to the kind's normal
// smart default (and drops the now-irrelevant team filter) so we never
// force an invalid audience onto a kind.
//
// Honored: announcement / weekly_digest / game_recap / rsvp_nudge /
//   custom_message (all list 'team' in modesForKind AND treat the picked
//   audience as the real send scope).
// Falls back: tournament_prelim/recap (tournament_attendees only); the
//   per-recipient-aggregate kinds whose smart default is decorative /
//   derived — family_guide (per-parent → org_all), coach_roundup
//   (per-coach → coach_self); and every locked kind (schedule_change /
//   games_recap / academy_callup_notice — audience is derived, not picked).
//
// The "decorative default" guard: kinds whose smartDefault is overridden
// (≠ KIND_METADATA.defaultAudienceType) or is a NON_MODE_LABELS aggregate
// type compute the audience per recipient, so a team pre-fill has no real
// send effect — honoring it would surface a misleading team chip. We fall
// back to their smart default instead.
//
// Send-side contract is UNCHANGED: this only sets the composer's INITIAL
// audience state; it dispatches the same (audience_type, audience_filter)
// the reducer + send pipeline already consume.
//
// Pure — no React, no IO. Returns { audience_type, audience_filter }.

import { KIND_METADATA } from './kindMetadata';
import { isAudienceLocked, modesForKind, NON_MODE_LABELS, smartDefaultFor } from './audienceModes';

export function reconcileAudienceForKind(kind, currentType, currentFilter) {
  const fallback = { audience_type: smartDefaultFor(kind), audience_filter: null };
  if (!currentType) return fallback;
  // Locked kinds derive their audience — never honor a pre-fill.
  if (isAudienceLocked(kind)) return fallback;
  // Decorative/derived smart default → audience_type is not the real send
  // scope for this kind; don't honor a team pre-fill onto it.
  const def = smartDefaultFor(kind);
  const overridden = def !== (KIND_METADATA[kind]?.defaultAudienceType ?? null);
  const decorativeDefault = overridden || (def != null && def in NON_MODE_LABELS);
  if (decorativeDefault) return fallback;
  // Honor the pre-fill only when the picked kind lists it as a valid mode.
  const valid = modesForKind(kind).some((m) => m.type === currentType);
  if (!valid) return fallback;
  return { audience_type: currentType, audience_filter: currentFilter ?? null };
}
