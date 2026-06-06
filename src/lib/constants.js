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

// Default weather location + forecast timezone. Single source for the
// coords that were duplicated across the home + schedule surfaces
// (home-redesign cleanup, Rule 8 multi-tenant-leak). Today this is Legacy
// Hoopers' Westchester anchor (WCC); per-org coordinates (org.location
// lat/lon) are a separate multi-tenant item — not built yet.
export const WEATHER_DEFAULT_COORDS = [41.03, -73.76];
export const WEATHER_TZ = 'America/New_York';

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
// send time (queueComposedMessages → body_html_rendered), so this default (or a
// VITE_APP_BASE_URL override) reaches production email.
//
// CUTOVER (2026-06-02): default is now https://astersports.app (was the
// skyfire-app.vercel.app deploy host). VITE_APP_BASE_URL still overrides if set.
// Trailing slash is stripped so callers can append paths.
//
// SCOPE NOTE: in-app share links use window.location.origin (src/lib/publicUrls.js)
// and are already domain-agnostic. The invite-parent EDGE FUNCTION resolves its
// magic-link host separately from public.app_config (Deno, SQL-settable) — also
// already repointed to astersports.app.
export const APP_BASE_URL =
  (import.meta.env?.VITE_APP_BASE_URL || 'https://astersports.app').replace(/\/+$/, '');

export const ORG_NAME_DEFAULT = 'Legacy Hoopers';
export const ORG_WEBSITE_DEFAULT = 'https://www.legacyhoopers.org/';
export const ORG_CONTACT_DEFAULT = 'support@astersports.app';
export const ORG_LOGO_DEFAULT = `${APP_BASE_URL}/knight-logo-240.png`;
