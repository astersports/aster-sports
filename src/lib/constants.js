// Shared enum-style constants. Keep these in sync with supabase migrations —
// any value not listed here should be treated as an unknown / legacy row.

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

/**
 * Spring 2026 production v14 palette. Sourced from records-v14_2.html.
 * Used by broadcast components (left border, badge, record number)
 * and any other surface that displays a team in its identity color.
 *
 * Email templates DO NOT use these — see Decision 68 (cobalt always for email).
 */
export const TEAM_COLORS = {
  '11U Girls': '#a78bfa',
  '10U Black': '#4a8fd4',
  '10U Blue':  '#94a3b8',
  '9U Boys':   '#06b6d4',
  '8U Boys':   '#f59e0b',
};
