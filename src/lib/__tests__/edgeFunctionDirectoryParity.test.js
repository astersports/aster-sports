/* global process */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Wave 3.A #21 P1 closure — AP #63 candidate enforcement.
//
// Catches edge-function deploy-without-repo drift at CI time:
//   - Every supabase/functions/<name>/ directory must contain an
//     index.ts entry point.
//   - Every [functions.<name>] entry in supabase/config.toml must
//     reference a directory that actually exists.
//   - Functions WITHOUT a config.toml entry default to verify_jwt:true
//     (Supabase platform default). The known list of JWT-verified
//     functions is encoded below — adding a new shared-secret function
//     without a config entry trips the verifyJwtConfigAudit test, not
//     this one.
//
// Origin: 5 edge functions appeared "version-drifted" in Wave 3.A #21
// because git log recorded against function paths during a no-content
// reorg (commit 111f213). Byte-compare showed no actual drift. The
// failure mode the audit flagged was: an MCP-side deploy that never
// writes the repo mirror. This test catches the inverse (a repo dir
// with no index.ts), which is the local-side counterpart. The
// MCP-side drift catch needs runtime API access (Supabase Management
// API + access token) and is filed as a follow-up CI workflow rather
// than a vitest unit test.

const FUNCTIONS_DIR = join(process.cwd(), 'supabase', 'functions');
const CONFIG_TOML = join(process.cwd(), 'supabase', 'config.toml');

// Functions that rely on the Supabase default verify_jwt:true (no
// config.toml entry needed). Adding to this list = an explicit "this
// function expects a user JWT" assertion. Removing a function from
// here = either it needs a config.toml entry (verify_jwt:false for
// shared-secret) or it's being retired.
const KNOWN_JWT_VERIFIED_FUNCTIONS = new Set([
  'parse-tournament-schedule',
  'send-tournament-message',
  'suggest-briefing-closer',
]);

function listFunctionDirs() {
  return readdirSync(FUNCTIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function configFunctionEntries() {
  const toml = readFileSync(CONFIG_TOML, 'utf8');
  const matches = toml.matchAll(/^\[functions\.([a-z0-9-]+)\]/gm);
  return Array.from(matches, (m) => m[1]).sort();
}

describe('Edge function directory parity (Wave 3.A #21 P1 closure / AP #63 candidate)', () => {
  it('every function directory contains an index.ts entry point', () => {
    const dirs = listFunctionDirs();
    const missing = dirs.filter((name) => {
      try {
        const stat = statSync(join(FUNCTIONS_DIR, name, 'index.ts'));
        return !stat.isFile();
      } catch {
        return true;
      }
    });
    expect(missing, `Functions missing index.ts: ${missing.join(', ')}`).toEqual([]);
  });

  it('every config.toml [functions.X] entry has a matching directory + index.ts', () => {
    const dirs = new Set(listFunctionDirs());
    const configFns = configFunctionEntries();
    const orphans = configFns.filter((name) => !dirs.has(name));
    expect(orphans, `config.toml entries with no matching directory: ${orphans.join(', ')}`).toEqual([]);
  });

  it('every function directory is either in config.toml or in the JWT-verified known list', () => {
    const dirs = listFunctionDirs();
    const configFns = new Set(configFunctionEntries());
    const unclassified = dirs.filter(
      (name) => !configFns.has(name) && !KNOWN_JWT_VERIFIED_FUNCTIONS.has(name),
    );
    expect(
      unclassified,
      `Functions with no config.toml entry AND not in KNOWN_JWT_VERIFIED_FUNCTIONS: ${unclassified.join(
        ', ',
      )}. Add a config.toml entry (for shared-secret functions per AP #31) or add to the known list above.`,
    ).toEqual([]);
  });

  it('KNOWN_JWT_VERIFIED_FUNCTIONS entries still exist as directories', () => {
    const dirs = new Set(listFunctionDirs());
    const dangling = Array.from(KNOWN_JWT_VERIFIED_FUNCTIONS).filter((name) => !dirs.has(name));
    expect(
      dangling,
      `KNOWN_JWT_VERIFIED_FUNCTIONS lists ${dangling.join(', ')} which no longer exist as directories. Remove from the known list.`,
    ).toEqual([]);
  });
});
