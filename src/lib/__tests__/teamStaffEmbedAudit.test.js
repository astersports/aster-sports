// Static-grep audit — forbids PostgREST embeds between `team_staff` and
// `staff_profiles` in either direction.
//
// Root cause of the games_recap / "Draft with AI" production regression
// (2026-06-06): there is NO foreign key between `team_staff` and
// `staff_profiles` (confirmed via information_schema — team_staff has only
// team_staff_team_id_fkey → teams.id; staff_profiles has only
// staff_profiles_org_id_fkey → organizations.id). PostgREST therefore
// rejects any attempt to embed one inside a query on the other with
// "Could not find a relationship between 'team_staff' and 'staff_profiles'
// in the schema cache." The team-aware-signature work (PR #756) shipped
// `staff_profiles!inner ( ... )` inside a `team_staff` select; this audit
// guards the whole class going forward.
//
// Correct pattern (mirrors familyGuideCoaches.fetchTeamCoaches): fetch
// team_staff rows, collect user_ids, fetch staff_profiles via
// .in('user_id', userIds), join in JS by user_id.
//
// Detection: walk the matched `.from('team_staff')` (resp.
// `.from('staff_profiles')`) call and the `.select(...)` immediately
// chained off it; flag if the select string references the OTHER table as
// an embed (`<other> (` or `<other>!inner (` / `!left (`). The select-arg
// is captured by balanced-paren walk so multi-line selects are covered.
//
// Zero-tolerance baseline: this relationship can NEVER be embedded, so any
// match is a regression. (Unlike baseline-pinned audits, there is no
// legitimate instance to tolerate.)

import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const ROOTS = ['src', 'supabase/functions'];
const IGNORE_DIR_NAMES = new Set(['__tests__', 'node_modules', '.git', 'dist']);
const IGNORE_FILE_RE = /\.test\.(js|jsx|ts)$/;

// Pairs to check in both directions: a query on `from` must not embed `other`.
const PAIRS = [
  { from: 'team_staff', other: 'staff_profiles' },
  { from: 'staff_profiles', other: 'team_staff' },
];

function findMatchingParen(content, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < content.length; i += 1) {
    const ch = content[i];
    if (ch === '(') depth += 1;
    else if (ch === ')') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (IGNORE_DIR_NAMES.has(entry)) continue;
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) out.push(...walk(full));
    else if (/\.(js|jsx|ts)$/.test(entry) && !IGNORE_FILE_RE.test(entry)) out.push(full);
  }
  return out;
}

function collectViolations() {
  const violations = [];
  for (const root of ROOTS) {
    for (const file of walk(root)) {
      let content;
      try {
        content = readFileSync(file, 'utf8');
      } catch {
        continue;
      }
      for (const { from, other } of PAIRS) {
        const fromRe = new RegExp(`\\.from\\(\\s*['"]${from}['"]\\s*\\)`, 'g');
        // Embed signature: the OTHER table name followed by optional
        // !inner/!left modifier then an opening paren — `staff_profiles (`
        // or `staff_profiles!inner (`.
        const embedRe = new RegExp(`\\b${other}\\b\\s*(?:!\\s*\\w+)?\\s*\\(`);
        let m;
        while ((m = fromRe.exec(content)) !== null) {
          // Find the `.select(` chained after this `.from(...)`.
          const selIdx = content.indexOf('.select(', m.index);
          if (selIdx === -1) continue;
          const openParen = content.indexOf('(', selIdx);
          const closeParen = findMatchingParen(content, openParen);
          if (closeParen === -1) continue;
          const selectArg = content.slice(openParen + 1, closeParen);
          if (embedRe.test(selectArg)) {
            const lineNum = content.slice(0, selIdx).split('\n').length;
            violations.push({ file, line: lineNum, from, other });
          }
        }
      }
    }
  }
  return violations;
}

describe('team_staff <-> staff_profiles embed audit (no FK relationship)', () => {
  it('no PostgREST embed between team_staff and staff_profiles in either direction', () => {
    const violations = collectViolations();
    if (violations.length > 0) {
      const msg = violations
        .map((v) => `  ${v.file}:${v.line} — .from('${v.from}') select embeds '${v.other}'`)
        .join('\n');
      throw new Error(
        `${violations.length} forbidden team_staff<->staff_profiles embed(s). ` +
          `There is NO foreign key between these tables, so PostgREST rejects the embed ` +
          `("Could not find a relationship ... in the schema cache"). ` +
          `Fetch the tables separately and join by user_id in JS ` +
          `(see familyGuideCoaches.fetchTeamCoaches / signatureCoaches.fetchSignatureCoaches).\n${msg}`,
      );
    }
    expect(violations.length).toBe(0);
  });
});
