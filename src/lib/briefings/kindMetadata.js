// Wave 3.11 follow-up — metadata for the 8 briefing kinds.
// Drives StepKindPicker, AnchorPicker filters, AudiencePicker
// defaults, and recently-used sort.
//
// Anchor + audience defaults are spec-locked (see master prompt §3.1
// + §3.2). Body editor module names map kind → ./bodies/<X>Body.jsx.

export const KIND_ORDER = [
  'weekly_digest', 'schedule_change', 'game_recap',
  'tournament_prelim', 'tournament_recap',
  'announcement', 'rsvp_nudge', 'custom_message',
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
  custom_message: {
    icon: 'MessageSquare', label: 'Custom message',
    description: 'Free-form: parent group thread, off-cycle notes',
    defaultAnchorKind: null, anchorKinds: ['event', 'tournament', 'team', 'org'],
    defaultAudienceType: null,
    bodyModule: 'CustomMessageBody',
    disabled: false,
  },
};

// Sort kinds by recently-used (from comms_messages history) then by spec order.
// `usage` is { kind: lastSentMs }.
export function sortKinds(usage = {}) {
  const seen = new Set();
  const used = Object.entries(usage)
    .filter(([k]) => KIND_METADATA[k])
    .sort((a, b) => (b[1] || 0) - (a[1] || 0))
    .map(([k]) => { seen.add(k); return k; });
  const rest = KIND_ORDER.filter((k) => !seen.has(k));
  return [...used, ...rest];
}

export function bodyModuleFor(kind) {
  return KIND_METADATA[kind]?.bodyModule || null;
}
