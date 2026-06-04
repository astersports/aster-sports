/* global process */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Phase 3 D-7 — pilot mechanism parity (closes PATTERN B1-δ recurrence
// surface). Catches new resolvers from re-introducing the bare
// is_pilot_family filter pattern that BUG D was about.
//
// Rule: any resolver file under src/lib/engine/resolvers/ that
// references `is_pilot_family` MUST also reference `get_digest_recipients`
// (so the pilot check goes through the REDIRECT-aware RPC pattern,
// not direct guardian.is_pilot_family inspection).
//
// Origin: docs/AUDIT_BRIEFINGS_2026-06-02.md §B2.2 + §B3.1. Wave 4.3-I
// migrated tournamentPrelimHelpers; rsvpNudge + academyCallupNotice
// were stragglers until Phase 3 D-5(a). _reminderSend.ts is Stream A
// (out-of-scope per Phase 1 §2) so it's exempted by directory — this
// test only covers src/lib/engine/resolvers/.

const RESOLVERS_DIR = join(process.cwd(), 'src', 'lib', 'engine', 'resolvers');
const SUBSTITUTION_DIR = join(process.cwd(), 'src', 'lib', 'engine', 'substitution');

function listJsFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === '__fixtures__') continue;
      out.push(...listJsFiles(join(dir, entry.name)));
      continue;
    }
    if (!entry.name.endsWith('.js')) continue;
    if (entry.name.includes('.test.')) continue;
    out.push(join(dir, entry.name));
  }
  return out;
}

describe('Pilot mechanism parity (Phase 3 D-7 / PATTERN B1-δ guard)', () => {
  it('every resolver that mentions is_pilot_family also calls get_digest_recipients', () => {
    const files = listJsFiles(RESOLVERS_DIR);
    const offenders = [];
    for (const path of files) {
      const src = readFileSync(path, 'utf8');
      const usesIsPilotFamily = /\bis_pilot_family\b/.test(src);
      const usesRpc = /get_digest_recipients/.test(src);
      if (usesIsPilotFamily && !usesRpc) {
        offenders.push(path.replace(process.cwd() + '/', ''));
      }
    }
    expect(
      offenders,
      `Resolvers using bare is_pilot_family without get_digest_recipients RPC: ${offenders.join(', ')}. Migrate to the RPC pattern (see tournamentPrelimHelpers.js Wave 4.3-I) so pilot mode picks up the REDIRECT branch automatically.`,
    ).toEqual([]);
  });

  it('substitute helpers do not reach into is_pilot_family', () => {
    // Token substitution should be IO-free per AP #27/#29. Pilot mode
    // is a resolver-level concern; substitute helpers must not infer it.
    if (!statSync(SUBSTITUTION_DIR).isDirectory()) return;
    const files = listJsFiles(SUBSTITUTION_DIR);
    const offenders = files.filter((path) => /is_pilot_family|get_digest_recipients/.test(readFileSync(path, 'utf8')));
    expect(
      offenders.map((p) => p.replace(process.cwd() + '/', '')),
      'Substitute helpers must remain IO-free; pilot resolution belongs in resolvers.',
    ).toEqual([]);
  });
});
