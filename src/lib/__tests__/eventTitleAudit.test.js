// Drift-hedge audit per anti-pattern #43: static-grep that fails CI
// if any JSX or JS file outside lib/eventTitle.js recomposes the
// inline `vs. ${opponent}` pattern. Forces every render site to
// route through formatEventTitle / formatEventTitleString.
//
// Origin: Cluster 3 (CC §2 ACTIVE BUGS). Pre-fix, six surfaces
// composed their own title fallbacks; some appended team name
// redundantly ("vs. 9U Boys Game"), some echoed free-text
// event.title literally ("10U Blue · 6th Boro 4AB · May Reschedule").
// PR centralized rendering. This test prevents regression.
//
// Allowlisted callers (machine/semi-machine emit channels that
// intentionally preserve admin-curated free-text labels):
//   - lib/icalHelpers.js (ICS SUMMARY for calendar export)
//   - lib/engine/renderers/eventCard.js (briefing email HTML)
//   - lib/engine/resolvers/*.js (briefing label resolution —
//     respects admin-set title for schedule_change, rsvp_nudge,
//     academy_callup_notice labels)
//   - lib/constants.js (buildTitle helper — used for DB INSERTs,
//     not rendering; orthogonal concern)

import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC_ROOT = join(__dirname, '..', '..');
const ALLOWLIST = new Set([
  'lib/eventTitle.js',
  'lib/icalHelpers.js',
  'lib/engine/renderers/eventCard.js',
  'lib/constants.js',
  'lib/__tests__/eventTitle.test.js',
  'lib/__tests__/eventTitleAudit.test.js',
]);
const ALLOWLIST_DIR_PREFIXES = [
  'lib/engine/resolvers/',
];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else if (/\.(js|jsx)$/.test(name)) out.push(full);
  }
  return out;
}

// Captures inline title composition: `vs. ${anything.opponent}` or
// `vs. ${anything}.opponent` style template literals. Also catches
// `'vs. ' + opponent` concatenations.
const INLINE_PATTERNS = [
  /`vs\.\s+\$\{[^}]*opponent[^}]*\}/,        // `vs. ${ev.opponent}`
  /['"]vs\.\s+['"]\s*\+\s*[\w.]+\.opponent/, // 'vs. ' + e.opponent
  /['"]@\s+['"]\s*\+\s*[\w.]+\.opponent/,    // '@ ' + e.opponent
  /`@\s+\$\{[^}]*opponent[^}]*\}/,           // `@ ${ev.opponent}`
];

describe('eventTitle drift-hedge audit', () => {
  it('no JSX/JS file outside the helper reimplements vs./{opponent} composition', () => {
    const files = walk(SRC_ROOT);
    const offenders = [];
    for (const f of files) {
      const rel = relative(SRC_ROOT, f).replace(/\\/g, '/');
      if (ALLOWLIST.has(rel)) continue;
      if (ALLOWLIST_DIR_PREFIXES.some((p) => rel.startsWith(p))) continue;
      const src = readFileSync(f, 'utf-8');
      for (const pat of INLINE_PATTERNS) {
        const m = src.match(pat);
        if (m) {
          offenders.push(`${rel}: ${m[0]}`);
          break;
        }
      }
    }
    expect(offenders, `Inline event-title composition found — route through formatEventTitle:\n${offenders.join('\n')}`).toEqual([]);
  });
});
