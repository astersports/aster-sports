// Wave 4.2-A-8a — resolver/composer registry.
//
// Single source of truth for the resolver+composer mapping per kind,
// plus a sendPath discriminator that drives composerSubmit dispatch.
//
// sendPath taxonomy:
//   composerSubmit    — main BriefingComposer flow dispatches via
//                       this registry through composerSubmit.js.
//   digestSend        — DigestComposer.jsx routes through digestSend.js
//                       directly (per-family fan-out + per-recipient
//                       body). Already on the new resolver pipeline
//                       since wave 4.2-A-1.
//   rsvpNudgeSend     — composerSubmit short-circuits to
//                       lib/rsvpNudgeSend.js (per-recipient
//                       mint_rsvp_token + per-recipient compose).
//                       Migrated to registry path in wave 4.2-A-8b-b.
//   academyCallupSend — composerSubmit short-circuits to
//                       lib/academyCallupSend.js (per-recipient
//                       mint_callup_token + per-recipient compose).
//                       Migrated to registry path in wave 4.2-A-8c.
//                       Closes wave 4.2-A at 7/7 calendar-anchored
//                       kinds on registry path.
//   legacy            — free-form kinds (announcement, custom_message)
//                       keep the legacy compose() path. They are NOT
//                       in this registry; getDispatchSendPath returns
//                       'legacy' for unknown kinds.
//
// `blocked` sendPath retired in wave 4.2-A-8c (was used for
// academy_callup_notice while callup token mint was pending in 4.3).
// NoCallupTokenInfrastructureError class retained for test imports
// but no longer thrown at dispatch time.
//
// Per-kind anchor + override mapping uses state-path conventions
// from BriefingComposer wizard state (state.anchor_id /
// state.audience_filter / state.body / state.signoff_message).

import { composeAcademyCallupNotice, resolveAcademyCallupNotice } from './academyCallupNotice';
import { composeCoachRoundup, resolveCoachRoundup } from './coachRoundup';
import { composeFamilyGuide, resolveFamilyGuide } from './familyGuide';
import { composeGameRecap, resolveGameRecap } from './gameRecap';
import { composeGamesRecap, resolveGamesRecap } from './gamesRecap';
import { composeRsvpNudge, resolveRsvpNudge } from './rsvpNudge';
import { composeScheduleChange, resolveScheduleChange } from './scheduleChange';
import { composeTournamentPrelim, resolveTournamentPrelim } from './tournamentPrelim';
import { composeTournamentRecap, resolveTournamentRecap } from './tournamentRecap';
import { composeWeeklyDigest, resolveWeeklyDigest } from './weeklyDigest';

export class NoCallupTokenInfrastructureError extends Error {
  constructor() {
    super('academy_callup_notice cannot be sent: callup token mint infrastructure pending in wave 4.3.');
    this.name = 'NoCallupTokenInfrastructureError';
  }
}

export class NoRecipientsError extends Error {
  constructor(kind, anchor) {
    super(`No recipients for ${kind} (anchor: ${JSON.stringify(anchor)})`);
    this.name = 'NoRecipientsError';
    this.kind = kind;
    this.anchor = anchor;
  }
}

function bodyOverrides(state) {
  return {
    ...(state.body || {}),
    signoff_message: state.signoff_message || '',
    // Per-message contact-info gate (OFF by default). signoff_coaches carries
    // the selected staff objects from the compose-time picker.
    signoff_enabled: state.signoff_enabled === true,
    signoff_coaches: Array.isArray(state.signoff_coaches) ? state.signoff_coaches : [],
  };
}

export const RESOLVER_REGISTRY = {
  weekly_digest: {
    resolve: resolveWeeklyDigest,
    compose: composeWeeklyDigest,
    anchorFromState: (state) => ({ orgId: state.org_id, period: state.period, pilotOnly: state.pilot_only }), // FORK-D: pass-through so undefined triggers the resolver's fail-closed settings consult (was ?? false)
    overridesFromState: bodyOverrides,
    sendPath: 'digestSend',
  },
  game_recap: {
    resolve: resolveGameRecap,
    compose: composeGameRecap,
    anchorFromState: (state) => ({ eventId: state.anchor_id, pilotOnly: state.pilot_only }),
    overridesFromState: bodyOverrides,
    sendPath: 'composerSubmit',
  },
  tournament_prelim: {
    resolve: resolveTournamentPrelim,
    compose: composeTournamentPrelim,
    anchorFromState: (state) => ({ tournamentId: state.anchor_id, pilotOnly: state.pilot_only }),
    overridesFromState: bodyOverrides,
    sendPath: 'composerSubmit',
  },
  tournament_recap: {
    resolve: resolveTournamentRecap,
    compose: composeTournamentRecap,
    anchorFromState: (state) => ({ tournamentId: state.anchor_id, pilotOnly: state.pilot_only }),
    overridesFromState: bodyOverrides,
    sendPath: 'composerSubmit',
  },
  schedule_change: {
    resolve: resolveScheduleChange,
    compose: composeScheduleChange,
    anchorFromState: (state) => ({ eventId: state.anchor_id, pilotOnly: state.pilot_only }),
    overridesFromState: bodyOverrides,
    sendPath: 'composerSubmit',
  },
  rsvp_nudge: {
    resolve: resolveRsvpNudge,
    compose: composeRsvpNudge,
    anchorFromState: (state) => ({ eventId: state.anchor_id, pilotOnly: state.pilot_only }),
    overridesFromState: bodyOverrides,
    sendPath: 'rsvpNudgeSend',
  },
  academy_callup_notice: {
    resolve: resolveAcademyCallupNotice,
    compose: composeAcademyCallupNotice,
    anchorFromState: (state) => ({ eventId: state.anchor_id, playerId: state.audience_filter?.player_ids?.[0], pilotOnly: state.pilot_only }),
    overridesFromState: bodyOverrides,
    sendPath: 'academyCallupSend',
  },
  // Wave 5 PR 4a — coach_roundup skeleton. State carries the chosen
  // coach as state.audience_filter.coach_user_id; the date range
  // lives in state.body.date_range. 4b expands the resolver to walk
  // team_staff → events; 4c adds the UI body.
  coach_roundup: {
    resolve: resolveCoachRoundup,
    compose: composeCoachRoundup,
    anchorFromState: (state) => ({ coachUserId: state.audience_filter?.coach_user_id, dateRange: state.body?.date_range }),
    overridesFromState: bodyOverrides,
    sendPath: 'composerSubmit',
  },
  // Wave 5 PR 5a — family_guide skeleton. State carries the chosen
  // parent as state.audience_filter.parent_user_id; the date range
  // lives in state.body.date_range. 5b expands the resolver to walk
  // player_guardians → players → team_players → events with cross-
  // kid conflict detection; 5c adds the UI body (parent picker +
  // date range). wizardSupported stays false in 5a/5b; flipped in 5c.
  family_guide: {
    resolve: resolveFamilyGuide,
    compose: composeFamilyGuide,
    anchorFromState: (state) => ({ parentUserId: state.audience_filter?.parent_user_id, dateRange: state.body?.date_range, pilotOnly: state.pilot_only }),
    overridesFromState: bodyOverrides,
    sendPath: 'composerSubmit',
  },
  // Wave 5 games_recap (G1) PR B — multi-game digest across N selected
  // events (anchor_kind='multi_event', event_ids in audience_filter,
  // anchor_id null). Not yet wizard-exposed — KIND_METADATA + body editor
  // land in PR C.
  games_recap: {
    resolve: resolveGamesRecap,
    compose: composeGamesRecap,
    anchorFromState: (state) => ({ eventIds: state.audience_filter?.event_ids, pilotOnly: state.pilot_only }),
    overridesFromState: bodyOverrides,
    sendPath: 'composerSubmit',
  },
};

export const CALENDAR_ANCHORED_KINDS = Object.keys(RESOLVER_REGISTRY);

export function isCalendarAnchored(kind) { return CALENDAR_ANCHORED_KINDS.includes(kind); }

export function getDispatchSendPath(kind) { return RESOLVER_REGISTRY[kind]?.sendPath ?? 'legacy'; }
