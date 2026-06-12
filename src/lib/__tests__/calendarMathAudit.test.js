import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

// R12 TZ sub-class gate (SCHEDULE_L99_BUILD_SPEC §8 PR-C'): calendar
// math that bypasses toLocale*/Intl is invisible to the existing
// timezoneAuditPin (it only sees toLocale* calls) and silently buckets
// days in the BROWSER's timezone. Banned tokens:
//   .toDateString(  — browser-local day compare (the EventCard "Today" bug)
//   .getTimezoneOffset(  — manual offset arithmetic, always wrong twice a year
//   .getDay(  — browser-local weekday bucketing (the WeekStrip label bug)
// NOT banned (documented-legal classes): .getUTCDay()/.getUTCDate() on
// noon-anchored date-only values (WeekStrip pattern); .getDate()/
// .setDate() duration/rollover arithmetic on form-local datetime-local
// inputs (PostOfferForm, wizardForm, useCreateActivity, seriesReconcile)
// and on noon-anchored date-only parses (formatters.js dateRange) —
// those are calendar steps on already-anchored values, not TZ display
// decisions. XS-13 enumerates the wider sweep candidates.

const SRC = 'src';

// Pre-existing browser-local weekday math OUTSIDE the Schedule surface,
// enumerated at audit-landing (PR-C') and flagged in the ledger as the
// R12 sweep batch. Fixing each is a behavior change to briefing/inbox
// week boundaries — separate pass, not a Schedule drive-by. The gate's
// job is blocking NEW instances. (briefingCronHelpers is NOT here — its
// code derives weekday via Intl parts; only a comment mentions getDay.)
const GETDAY_ALLOWLIST = new Set([
  'hooks/useInboxHistory.js',          // inbox history week-start
  'lib/engine/digestPeriod.js',        // digest default period start
  'lib/tournamentWeekend.js',          // Sat/Sun detection on date-only parses
  'lib/alerts/briefingOverdueEvaluators.js', // overdue week-anchor math
]);

// Line-based scan skipping comment lines — briefingCronHelpers documents
// the correct pattern IN a comment that names .getDay().
function codeLines(text) {
  return text.split('\n').filter((l) => {
    const t = l.trim();
    return !(t.startsWith('//') || t.startsWith('*') || t.startsWith('/*'));
  }).join('\n');
}

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

describe('calendarMathAudit — non-toLocale TZ math is a build blocker (R12)', () => {
  const files = walk(SRC);

  it('no .toDateString() / .getTimezoneOffset() anywhere', () => {
    const violations = [];
    for (const f of files) {
      const text = codeLines(fs.readFileSync(f, 'utf8'));
      if (text.includes('.toDateString(')) violations.push(`${f} uses toDateString`);
      if (text.includes('.getTimezoneOffset(')) violations.push(`${f} uses getTimezoneOffset`);
    }
    expect(violations, `Browser-local calendar math found — pin with toLocaleDateString('en-CA', { timeZone: 'America/New_York' }):\n${violations.join('\n')}`).toEqual([]);
  });

  it('no .getDay() weekday bucketing outside the allowlist (.getUTCDay() on anchored values is the legal form)', () => {
    const violations = [];
    for (const f of files) {
      const rel = path.relative(SRC, f).replace(/\\/g, '/');
      if (GETDAY_ALLOWLIST.has(rel)) continue;
      const text = codeLines(fs.readFileSync(f, 'utf8'));
      // match .getDay( but not .getUTCDay(
      if (/\.getDay\(/.test(text)) violations.push(rel);
    }
    expect(violations, `Browser-local .getDay() bucketing found:\n${violations.join('\n')}`).toEqual([]);
  });
});
