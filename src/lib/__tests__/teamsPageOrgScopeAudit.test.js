// Teams PR D — static-grep audit enforcing CLAUDE.md anti-pattern #37
// across the Teams page hook tree.
//
// Per anti-pattern #37: every `supabase.from('<org_scoped_table>')` call
// MUST be filtered with `.eq('org_id', ...)` somewhere in the same chain
// as defense-in-depth above RLS. The morning audit (2026-05-16) caught
// callsites where the application-layer org filter was missing or
// implicit; this audit locks the invariant for the Teams page surface
// area so future refactors can't silently regress it.
//
// Scope: the hooks + components called from src/pages/TeamDetailPage.jsx
// that hit an org-scoped table (i.e. tables that CARRY an org_id column,
// not FK-scoped tables like `events` or `event_rsvps` which inherit
// scope via team_id → teams.org_id).
//
// Same drift-hedge shape as verifyJwtConfigAudit.test.js and
// maybeSingleErrorAudit.test.js — per CLAUDE.md anti-pattern #43.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

// Files in the Teams page hook tree that hit org-scoped tables.
// Mirrors the audit doc PR D scope. If you add a new hook to
// TeamDetailPage that queries one of ORG_SCOPED_TABLES below, add it
// here and confirm the chain has `.eq('org_id', ...)`.
const AUDIT_FILES = [
  'src/hooks/useAttendanceData.js',
  'src/hooks/useTeamRecords.js',
  'src/hooks/usePlayerSeasonStats.js',
  'src/components/roster/TeamAchievements.jsx',
];

// Tables that CARRY an org_id column. FK-scoped tables (events,
// event_rsvps, event_arrivals, check_ins, player_activations,
// roster_members, game_results, team_staff) are EXCLUDED — they inherit
// scope through their FK and don't have an org_id column to filter on.
const ORG_SCOPED_TABLES = ['players', 'player_game_stats', 'team_achievements', 'teams'];

// Extracts each `.from('<table>')...` chain — from the .from() call
// through the next semicolon, .then(), or end of statement. The chain
// can span multiple lines (formatted Supabase queries). We strip
// comments to avoid false-positive "missing eq" on commented-out filters.
function extractChains(src, table) {
  const out = [];
  // Strip line comments first so they don't fragment the chain text.
  const stripped = src.split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
  // Match: .from('<table>') ... up to ; or .then( or end-of-file
  const re = new RegExp(`\\.from\\(['"\`]${table}['"\`]\\)([\\s\\S]*?)(?=;|\\.then\\(|$)`, 'g');
  let m;
  while ((m = re.exec(stripped)) !== null) out.push(m[0]);
  return out;
}

describe('Teams page org_id scope audit (CLAUDE.md anti-pattern #37)', () => {
  for (const file of AUDIT_FILES) {
    const src = readFileSync(file, 'utf-8');
    for (const table of ORG_SCOPED_TABLES) {
      const chains = extractChains(src, table);
      if (chains.length === 0) continue;
      it(`${file}: every supabase.from('${table}') chain calls .eq('org_id', ...)`, () => {
        const violations = chains.filter((c) => !/\.eq\(['"`]org_id['"`]\s*,/.test(c));
        if (violations.length) {
          throw new Error(
            `${violations.length} supabase.from('${table}') chain(s) in ${file} missing .eq('org_id', ...):\n` +
            violations.map((v) => `  ${v.replace(/\s+/g, ' ').trim().slice(0, 200)}`).join('\n'),
          );
        }
        expect(violations).toEqual([]);
      });
    }
  }
});
