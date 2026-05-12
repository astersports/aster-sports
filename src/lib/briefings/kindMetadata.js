// Wave 3.11 follow-up — metadata for the briefing kinds.
// Drives StepKindPicker, AnchorPicker filters, AudiencePicker
// defaults, and recently-used sort.
//
// Anchor + audience defaults are spec-locked (see master prompt §3.1
// + §3.2). Body editor module names map kind → ./bodies/<X>Body.jsx.
//
// Wave 4.1d-2 §5 — academy_callup_notice surfaced (G2). Renderer in
// src/lib/engine/renderers/academyCallupNotice.js was already wired in
// composer.js but not in the picker — now it is. Audience mode
// 'player_specific' resolves via player_guardians (recipientFilter.js).

export const KIND_ORDER = [
  'weekly_digest', 'schedule_change', 'game_recap',
  'tournament_prelim', 'tournament_recap',
  'announcement', 'rsvp_nudge', 'academy_callup_notice', 'custom_message',
];

export const KIND_METADATA = {
  weekly_digest: {
    icon: 'CalendarDays', label: 'Weekly digest',
    description: 'Monday-morning week-ahead summary, per family interleaved',
    defaultAnchorKind: 'org', anchorKinds: ['org', 'team', 'multi_team'],
    defaultAudienceType: 'org_all',
    bodyModule: 'WeeklyDigestBody',
    disabled: false,
  },
  schedule_change: {
    icon: 'CalendarClock', label: 'Schedule change',
    description: '"Tuesday\'s practice moved to Friday"',
    defaultAnchorKind: 'event', anchorKinds: ['event'], anchorLocked: true,
    defaultAudienceType: 'event_attendees', audienceLocked: true,
    bodyModule: 'ScheduleChangeBody',
    disabled: false,
  },
  game_recap: {
    icon: 'Trophy', label: 'Game recap',
    description: 'Post-game writeup with score, highlights, player of game',
    defaultAnchorKind: 'event', anchorKinds: ['event'],
    eventFilter: { kind: 'game', past: true },
    defaultAudienceType: 'event_attendees',
    bodyModule: 'GameRecapBody',
    disabled: false,
  },
  tournament_prelim: {
    icon: 'Flag', label: 'Tournament briefing',
    description: 'Pre-tournament: hotel, schedule, opponent scouting',
    defaultAnchorKind: 'tournament', anchorKinds: ['tournament'],
    tournamentFilter: { upcoming: true },
    defaultAudienceType: 'tournament_attendees',
    bodyModule: 'TournamentPrelimBody',
    disabled: false,
  },
  tournament_recap: {
    icon: 'Medal', label: 'Tournament recap',
    description: 'Post-tournament: results, MVP, takeaways',
    defaultAnchorKind: 'tournament', anchorKinds: ['tournament'],
    tournamentFilter: { recentPast: true, days: 30 },
    defaultAudienceType: 'tournament_attendees',
    bodyModule: 'TournamentRecapBody',
    disabled: false,
  },
  announcement: {
    icon: 'Megaphone', label: 'Announcement',
    description: 'Program news, summer team selections, off-season plans',
    defaultAnchorKind: 'org', anchorKinds: ['team', 'org'],
    defaultAudienceType: 'org_all',
    bodyModule: 'AnnouncementBody',
    disabled: false,
  },
  rsvp_nudge: {
    icon: 'Bell', label: 'RSVP nudge',
    description: 'Polite reminder for non-responders 48h before event',
    defaultAnchorKind: 'event', anchorKinds: ['event'],
    eventFilter: { upcoming: true, hasPendingRsvps: true },
    defaultAudienceType: 'event_attendees',
    bodyModule: 'RsvpNudgeBody',
    disabled: false,
  },
  academy_callup_notice: {
    icon: 'UserPlus', label: 'Academy call-up',
    description: 'Invite an Academy player to play up with a team for one event',
    defaultAnchorKind: 'event', anchorKinds: ['event'],
    eventFilter: { kind: 'game', upcoming: true },
    defaultAudienceType: 'player_specific', audienceLocked: true,
    bodyModule: 'AcademyCallupBody',
    disabled: false,
    // Wave 4.8 BUG (5/13 incident) — wizard cannot complete an academy
    // call-up because it never activates the player on the event
    // (events.academy_callup_player_ids stays empty), so the resolver
    // throws PlayerNotCalledUpError at send time. The canonical flow
    // (EventDetail → AcademyCallupPicker → addCallup RPC → auto-open
    // AcademyCallupCompose) is the only path that populates that field.
    // Kind stays discoverable in the picker; the Body step renders a
    // redirect card pointing admins to the canonical flow.
    wizardSupported: false,
  },
  custom_message: {
    icon: 'MessageSquare', label: 'Custom message',
    description: 'Free-form: parent group thread, off-cycle notes',
    defaultAnchorKind: null, anchorKinds: ['event', 'tournament', 'team', 'org'],
    defaultAudienceType: null,
    bodyModule: 'CustomMessageBody',
    disabled: false,
  },
};

// Wave 4.1d-2 §2.5 — stable picker order. Frank observed kind picker
// order varying between consecutive opens because recently-used sort
// was non-deterministic when usage data partially loaded. KIND_ORDER
// now drives the canonical order; the `usage` argument is preserved
// for compatibility (it informs the "Last sent today · X" sub-text
// in the picker but no longer reorders cards).
export function sortKinds(_usage = {}) {
  return [...KIND_ORDER];
}

export function bodyModuleFor(kind) {
  return KIND_METADATA[kind]?.bodyModule || null;
}
