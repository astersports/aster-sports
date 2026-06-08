// Static-grep DOC-DRIFT GUARD — fails CI if a known-corrected stale fact
// reappears in a canonical/active doc. "Keep it clean" doctrine: don't
// restate facts that live in code/DB — they drift. This guard makes the
// drift class fixed by the 2026-05-29 Doc-Corpus L99 campaign
// un-reintroducible (org_members vs user_roles, roster_type table, stale
// migration count, ~/legacy-hoopers-app path, dead brand hex, a
// nonexistent helper).
//
// Each FORBIDDEN pattern is one that is ONLY ever the drift — never a
// legitimate phrase in a live doc (prose negations like "there is NO
// org_members table" deliberately don't match the SQL-usage patterns).
//
// SCOPE: canonical + active-reference docs (CLAUDE.md, README.md, the
// top-level docs/*.md). EXEMPT: docs/archive/** (historical snapshots
// legitimately hold old strings), and the AUDIT_*/FINDINGS/SCOREBOARD
// docs + the ledger (they DESCRIBE the drift by nature), and this file.

import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

// Vitest runs with cwd = repo root; sibling audit tests use relative paths.

const FORBIDDEN = [
  { re: /~\/legacy-hoopers-app/, label: 'stale local path — use ~/aster-sports' },
  { re: /\b141 migration/i, label: 'hardcoded stale migration count — say "consult the directory"' },
  // Match the CALL form (the drift "Use getTournamentRecipients(...)"), not the
  // legit negation "there is no getTournamentRecipients helper".
  { re: /getTournamentRecipients\s*\(/, label: 'nonexistent helper — read tournament_rosters inline' },
  { re: /#091c36/i, label: 'dead brand hex — header #1e3a5f, accent #4a8fd4' },
  { re: /\bfrom\s+org_members\b|\borg_members\s+where\b/i, label: 'phantom org_members table — membership is user_roles' },
  { re: /roster_type`?\s+on\s+`?roster_members/i, label: 'roster_type lives on team_players, not roster_members' },
];

// Docs that DESCRIBE drift (audit findings, the ledger) or are historical.
const EXEMPT = /^(AUDIT_|EMBER_PENDING_LEDGER|.*FINDINGS|.*SCOREBOARD|.*DOC_CORPUS)/;

function guardedDocs() {
  const out = [];
  for (const f of ['CLAUDE.md', 'README.md']) {
    if (existsSync(f)) out.push([f, f]);
  }
  for (const f of readdirSync('docs')) {
    if (!f.endsWith('.md') || EXEMPT.test(f)) continue;
    out.push([`docs/${f}`, join('docs', f)]);
  }
  return out;
}

describe('doc-drift guard (Doc-Corpus L99 — keep it clean)', () => {
  for (const [name, path] of guardedDocs()) {
    it(`${name} carries no re-introduced corrected-drift strings`, () => {
      const lines = readFileSync(path, 'utf8').split('\n');
      const hits = [];
      lines.forEach((ln, i) => {
        for (const { re, label } of FORBIDDEN) {
          if (re.test(ln)) hits.push(`  L${i + 1} [${label}]: ${ln.trim().slice(0, 90)}`);
        }
      });
      expect(
        hits,
        `Re-introduced corrected drift in ${name}:\n${hits.join('\n')}\n` +
        '(fixed in the 2026-05-29 Doc-Corpus L99 campaign; see CLAUDE.md §11.5. ' +
        'If genuinely intentional, narrow the FORBIDDEN pattern or exempt the file.)',
      ).toEqual([]);
    });
  }
});
