// FORK-D parity lock. The pilot gate must FAIL CLOSED in every resolver that
// can drive a guardian-facing send: when org settings are unreadable/absent,
// the resolver must default to pilot-only (true), never send-to-all (false).
// #825's 8-agent audit found weekly_digest never consulted settings at all and
// the 8 siblings defaulted `?? false` (fail-OPEN). This static-grep lock asserts
// all 9 resolve fail-closed and fails loudly if any regresses to a fail-open
// default — same shape as sendIdempotencyInvariant / verifyJwtConfigAudit.
//
// Why static-grep, not behavioral: the 9 resolvers each reach the pilot gate
// after different validation/fetches (event/tournament/parent/period), so a
// uniform behavioral fixture is impractical; the invariant we care about is the
// DEFAULT at the fallback, which the source asserts directly and durably.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

const RESOLVER_DIR = 'src/lib/engine/resolvers';
// The 9 FORK-D resolvers: the 8 with an org-settings consult + weekly_digest
// (which gained the consult in this PR — previously had none).
const RESOLVERS = [
  'gameRecap.js', 'gamesRecap.js', 'rsvpNudge.js', 'scheduleChange.js',
  'academyCallupNotice.js', 'tournamentPrelim.js', 'tournamentRecap.js',
  'familyGuide.js', 'weeklyDigest.js',
];

const sources = Object.fromEntries(
  RESOLVERS.map((f) => [f, readFileSync(`${RESOLVER_DIR}/${f}`, 'utf8')]),
);

describe('FORK-D: pilot gate fails closed across all 9 send-driving resolvers', () => {
  it('every resolver consults settings with a fail-CLOSED default (?? true)', () => {
    for (const f of RESOLVERS) {
      expect(sources[f], `${f} must default pilot fail-closed (pilot_mode_enabled ?? true)`)
        .toMatch(/pilot_mode_enabled\s*\)?\s*\?\?\s*true/);
    }
  });

  it('NO resolver defaults pilot fail-OPEN (?? false) — regression lock', () => {
    for (const f of RESOLVERS) {
      expect(sources[f], `${f} must NOT default pilot fail-open (pilot_mode_enabled ?? false)`)
        .not.toMatch(/pilot_mode_enabled\s*\)?\s*\?\?\s*false/);
    }
  });

  it('NO resolver has a secondary fail-OPEN branch (effectivePilotOnly = false)', () => {
    // tournamentPrelim/tournamentRecap previously fell back to `= false` when
    // orgId was absent. That secondary branch must also fail closed.
    for (const f of RESOLVERS) {
      expect(sources[f], `${f} must not set effectivePilotOnly = false anywhere`)
        .not.toMatch(/effectivePilotOnly\s*=\s*false/);
    }
  });

  it('weekly_digest now consults org_settings (it had no consult before FORK-D)', () => {
    expect(sources['weeklyDigest.js']).toMatch(/organization_settings/);
    expect(sources['weeklyDigest.js']).toMatch(/effectivePilotOnly/);
  });
});
