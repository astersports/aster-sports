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
 * Single-org pilot constant. Hardcoded to Legacy Hoopers org_id while we
 * run as a single tenant. Public RLS policies (Migrations 025/029) match
 * the same UUID. When 2nd org joins (Phase 6+), refactor to URL-based
 * routing and source from useAuth.orgId.
 */
export const MESSAGE_CHANNELS = ['team', 'announcement', 'dm'];

export const LEGACY_HOOPERS_ORG_ID = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';

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

// Comms message kinds — must stay in sync with the
// comms_messages.kind CHECK constraint in production.
export const TOURNAMENT_MESSAGE_TYPES = [
  { value: 'weekly_digest',            label: 'Weekly digest' },
  { value: 'tournament_preliminary',   label: 'Tournament preliminary schedule' },
  { value: 'tournament_final',         label: 'Tournament final schedule' },
  { value: 'tournament_rsvp_lock',     label: 'Tournament RSVP lock reminder' },
  { value: 'tournament_recap_interim', label: 'Tournament interim recap' },
  { value: 'tournament_recap_final',   label: 'Tournament weekend recap' },
  { value: 'schedule_change',          label: 'Schedule change' },
  { value: 'multi_team_notice',        label: 'Multi-team notice' },
  { value: 'academy_callup_notice',    label: 'Academy call-up' },
  { value: 'custom',                   label: 'Custom' },
];
