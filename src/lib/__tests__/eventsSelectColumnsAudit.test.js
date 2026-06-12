// P0 lane STEP 5a (2026-06-12) — select-column-vs-schema manifest audit.
//
// Origin: XS-1/DB-2. PublicSchedulePage and the team-feed edge function both
// selected a nonexistent `events.location_name` column (it is a client-side
// alias minted in useActivities, never a DB column). PostgREST 42703'd on
// every request; one surface swallowed the error (public page rendered "No
// upcoming events"), the other 500'd (calendar subscriptions dead). A static
// audit of select strings against the real column list catches this entire
// class at CI time — same shape as timezoneAuditPin.test.js.
//
// Scope: `.from('events')` selects across src/ and supabase/functions/.
// Alias syntax (`alias:column`) validates the real column (the part after
// the colon). Embedded relations (`teams!inner(...)`, `locations(...)`) are
// stripped before tokenizing.
//
// MAINTENANCE: when a migration adds/renames/drops an events column, update
// EVENTS_COLUMNS in the same PR (the failing diff here is the reminder).

import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

// information_schema.columns for public.events, captured 2026-06-12.
const EVENTS_COLUMNS = new Set([
  'id', 'team_id', 'event_type', 'title', 'start_at', 'end_at', 'location',
  'location_address', 'opponent', 'notes', 'created_at', 'updated_at',
  'status', 'arrival_minutes_before', 'jersey', 'coach_notes', 'enable_rides',
  'is_multi_day', 'end_date', 'parent_event_id', 'attachments', 'indoor',
  'rsvp_deadline', 'is_scrimmage', 'home_away', 'sub_location',
  'tournament_name', 'tournament_id', 'is_bracket_placeholder',
  'bracket_placeholder_label', 'game_sequence', 'is_bracket_game',
  'bracket_label', 'bracket_placeholder', 'opponent_pool', 'coach_keys',
  'cancellation_reason', 'cancelled_at', 'is_bonus_game', 'opponent_id',
  'season_id', 'location_room_id', 'location_id', 'publish_status',
  'arrival_time', 'is_championship_final', 'coach_checklist_state',
  'locked_roster_player_ids', 'locked_roster_at', 'locked_roster_by',
  'academy_callup_player_ids',
]);

const ROOTS = ['src', 'supabase/functions'];
const EXT_RE = /\.(js|jsx|ts|tsx)$/;
const SKIP_DIRS = new Set(['node_modules', 'dist', '__snapshots__']);

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (EXT_RE.test(name)) out.push(p);
  }
  return out;
}

// Matches .from('events')<chain>.select('<select string>') with any quote.
const FROM_EVENTS_SELECT_RE =
  /\.from\(\s*['"`]events['"`]\s*\)[\s\S]{0,120}?\.select\(\s*(['"`])([\s\S]*?)\1/g;

function stripEmbeds(selectStr) {
  // Remove embedded-relation blocks: `teams!inner(...)`, `locations (...)`,
  // and the alias-embed form `locations:location_id ( ... )` — optional
  // whitespace before the paren, innermost-first so nesting collapses.
  let s = selectStr;
  let prev;
  do {
    prev = s;
    s = s.replace(/[\w!]+(?:\s*:\s*\w+)?\s*\([^()]*\)/g, '');
  } while (s !== prev);
  return s;
}

function tokensOf(selectStr) {
  return stripEmbeds(selectStr)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.includes(':') ? t.split(':').pop().trim() : t));
}

describe('events select-column manifest audit (P0 STEP 5a)', () => {
  it('every .from(events).select() column exists in the schema manifest', () => {
    const files = ROOTS.flatMap((r) => walk(r, []));
    const violations = [];
    for (const file of files) {
      if (file.includes('__tests__')) continue;
      const content = readFileSync(file, 'utf8');
      let m;
      while ((m = FROM_EVENTS_SELECT_RE.exec(content)) !== null) {
        for (const tok of tokensOf(m[2])) {
          if (tok === '*' || tok === '') continue;
          if (!EVENTS_COLUMNS.has(tok)) {
            violations.push(`${file}: unknown events column "${tok}" in select("${m[2].slice(0, 80)}…")`);
          }
        }
      }
    }
    expect(violations, violations.join('\n')).toEqual([]);
  });
});
