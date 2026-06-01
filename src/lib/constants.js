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

export const MESSAGE_CHANNELS = ['team', 'announcement', 'dm'];

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
  { value: 'tournament_prelim',        label: 'Tournament preliminary schedule' },
  { value: 'tournament_final',         label: 'Tournament final schedule' },
  { value: 'tournament_rsvp_lock',     label: 'Tournament RSVP lock reminder' },
  { value: 'tournament_recap_interim', label: 'Tournament interim recap' },
  { value: 'tournament_recap_final',   label: 'Tournament weekend recap' },
  { value: 'schedule_change',          label: 'Schedule change' },
  { value: 'multi_team_notice',        label: 'Multi-team notice' },
  { value: 'academy_callup_notice',    label: 'Academy call-up' },
  { value: 'custom_message',           label: 'Custom' },
];

// ─── Outbound-email base URL + default org branding (single source of truth) ───
// Used by the briefing engine resolvers + renderers to build absolute links and
// the default org logo in OUTBOUND EMAIL. Email HTML is rendered CLIENT-SIDE at
// send time (queueComposedMessages → body_html_rendered), so this Vite env var
// reaches production email.
//
// EXTRACT-NOT-REPOINT: the fallback is the CURRENT working deploy host, so this
// changes WHERE the value lives, not the value — outbound email is byte-identical
// until the env flips. GO-LIVE = set VITE_APP_BASE_URL in Vercel (no code edit,
// no redeploy scramble). Trailing slash is stripped so callers can append paths.
//
// SCOPE NOTE: in-app share links use window.location.origin (src/lib/publicUrls.js)
// and are already domain-agnostic. The invite-parent EDGE FUNCTION has its own
// hardcoded auth redirect (Deno — NOT reachable by this Vercel env var) and must
// be repointed separately at go-live (intentionally out of scope here per the
// "no Supabase Auth changes" gate).
export const APP_BASE_URL =
  (import.meta.env?.VITE_APP_BASE_URL || 'https://skyfire-app.vercel.app').replace(/\/+$/, '');

export const ORG_NAME_DEFAULT = 'Legacy Hoopers';
export const ORG_WEBSITE_DEFAULT = 'https://www.legacyhoopers.org/';
export const ORG_CONTACT_DEFAULT = 'info@legacyhoopers.org';
export const ORG_LOGO_DEFAULT = `${APP_BASE_URL}/knight-logo-240.png`;
