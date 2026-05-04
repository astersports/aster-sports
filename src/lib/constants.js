export const ACTIVITY_TYPES = [
  'game',
  'practice',
  'skills_lab',
  'tryout',
  'tournament',
  'other',
];

export const TYPE_LABELS = {
  game: 'Game',
  practice: 'Practice',
  skills_lab: 'Skills Lab',
  tryout: 'Tryout',
  tournament: 'Tournament',
  other: 'Event',
};

export const RSVP_STATUSES = ['going', 'not_going', 'maybe'];

export const EVENT_STATUSES = ['scheduled', 'cancelled', 'postponed'];

export const TYPE_OPTIONS = [
  { key: null, label: 'All' },
  ...ACTIVITY_TYPES.map((key) => ({ key, label: TYPE_LABELS[key] || key })),
];

export const HOME_AWAY = ['home', 'away', 'neutral', 'tbd'];

export const USER_ROLES = ['admin', 'coach', 'parent'];

export const MEMBER_TYPES = ['roster', 'futures_academy'];

export function buildTitle(type, opponent) {
  if ((type === 'game' || type === 'tournament') && opponent) return `vs. ${opponent}`;
  return TYPE_LABELS[type] || 'Event';
}

export const LEGACY_HOOPERS_ORG_ID = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';

export const MESSAGE_CHANNELS = ['team', 'announcement', 'dm'];

export const TEAM_COLORS = {
  '11U Girls': '#7C3AED',
  '10U Black': '#18181B',
  '10U Blue':  '#2563EB',
  '9U Boys':   '#DC2626',
  '8U Boys':   '#EA580C',
};
