import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

// §8 PR-A' grep gate (SCHEDULE_L99_BUILD_SPEC): is-it-done predicates
// live in ONE place — lib/eventWindows.js eventTimeState. This audit
// fails the build when a new divergent definition appears. Pre-spine
// there were FIVE divergent defs (EventCard end_at-or-never, MatchupCard
// start-based, EventDetailPage 4h inline, EventDetailHeader start-based,
// useEventTimeWindow 60min) and THREE duration constants (60min / 4h /
// a local 2h in NextEventCard).
//
// Rules:
//  R1 — any `isPast =` definition must derive from eventTimeState(...)
//       unless the file is allowlisted with a rationale below.
//  R2 — `DEFAULT_EVENT_DURATION_MS` may not be (re)defined anywhere;
//       the one constant is EVENT_DEFAULT_DURATION_MS in eventWindows.js.
//       The legacy literal 14400000 (4h ms) is banned outright.

// Relative root — vitest runs from the repo root (same convention as
// eventsSelectColumnsAudit).
const SRC = 'src';

// start_at-based BY DESIGN: attendance counts an event once it has
// started (historical attendance semantics, §11.5) — not a time-state
// predicate drift.
const ISPAST_ALLOWLIST = new Set(['hooks/useAttendanceData.js']);

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
      walk(p, acc);
    } else if (/\.(js|jsx)$/.test(entry.name) && !/\.test\./.test(entry.name)) {
      acc.push(p);
    }
  }
  return acc;
}

describe('eventTimeStateAudit — single is-it-done source (SD-2)', () => {
  const files = walk(SRC);

  it('every isPast definition reads eventTimeState (no divergent predicates)', () => {
    const violations = [];
    for (const f of files) {
      const rel = path.relative(SRC, f);
      if (ISPAST_ALLOWLIST.has(rel)) continue;
      const lines = fs.readFileSync(f, 'utf8').split('\n');
      lines.forEach((line, i) => {
        if (/(?:const|let|var)\s+isPast\s*=/.test(line) && !line.includes('eventTimeState(')) {
          violations.push(`${rel}:${i + 1} — ${line.trim()}`);
        }
      });
    }
    expect(violations, `Divergent is-past predicate(s) found — derive from eventTimeState in lib/eventWindows.js, or allowlist with rationale:\n${violations.join('\n')}`).toEqual([]);
  });

  it('no duration-constant redefinitions (one 2h constant in eventWindows.js)', () => {
    const violations = [];
    for (const f of files) {
      const rel = path.relative(SRC, f);
      const text = fs.readFileSync(f, 'utf8');
      if (/DEFAULT_EVENT_DURATION_MS\s*=/.test(text) && rel !== 'lib/eventWindows.js') {
        violations.push(`${rel} defines a duration constant`);
      }
      if (text.includes('14400000')) violations.push(`${rel} uses the legacy 4h literal`);
    }
    expect(violations, violations.join('\n')).toEqual([]);
  });
});
