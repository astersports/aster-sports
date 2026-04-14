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

export const RSVP_STATUSES = ['going', 'not_going', 'maybe', 'injury', 'partial'];

export const EVENT_STATUSES = [
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'postponed',
];

export const HOME_AWAY = ['home', 'away', 'neutral', 'tbd'];

export const USER_ROLES = ['admin', 'coach', 'parent'];

export const MEMBER_TYPES = ['roster', 'futures_academy'];
