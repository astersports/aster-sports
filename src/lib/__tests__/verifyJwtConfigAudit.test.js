// Wave 4.3-E (P0 hotfix) — verify_jwt config audit.
//
// Enforces CLAUDE.md anti-pattern #31: every edge function in
// supabase/functions/* that uses shared-secret auth (CRON_SECRET,
// URL-param token, custom HMAC verify RPC) MUST be declared with
// `[functions.<name>] verify_jwt = false` in supabase/config.toml.
//
// Without the declaration, `supabase functions deploy` (run by CI on
// every push) defaults to verify_jwt:true, and the Supabase gateway
// rejects all invocations with UNAUTHORIZED_INVALID_JWT_FORMAT before
// the function code's own shared-secret check can run.
//
// Three production regressions this year caught by manual chat-side
// audits (PR #48 briefing-cron-dispatch, PR #51 redeploy regression,
// wave 4.3-E briefing-auto-draft-tick + callup-token-handler). This
// test fails fast on the next CI run if a future shared-secret
// function ships without the entry.

import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const FUNCTIONS_DIR = 'supabase/functions';
const CONFIG_TOML = 'supabase/config.toml';

// Patterns that indicate the function authenticates via something OTHER
// than a Supabase user JWT. Conservative — false positive (extra config
// entry) is preferable to false negative (gateway block).
const SHARED_SECRET_PATTERNS = [
  // Env-var shared secrets (CRON_SECRET, RESEND_WEBHOOK_SECRET, etc.).
  // Excludes JWT-secret env vars used for IMPERSONATION on JWT-verified
  // functions like send-tournament-message (mints a user JWT for the
  // downstream call but is itself JWT-verified).
  /Deno\.env\.get\(["'][A-Z_]+_SECRET["']\)/,
  // URL-param token-based auth (rsvp/callup handler style).
  /searchParams\.get\(["'](t|token)["']\)/,
  // Token-verify RPC presence (signed-link handler style).
  /verify_rsvp_token|verify_callup_token|verify_unsubscribe_token/,
];

// Functions to exclude from shared-secret detection even if a pattern
// matches. send-tournament-message reads SUPABASE_JWT_SECRET for JWT
// MINTING (not auth verification); the function itself is JWT-verified.
const EXCLUDE_FUNCTIONS = new Set(['send-tournament-message']);

function detectsSharedSecretAuth(source) {
  return SHARED_SECRET_PATTERNS.some((p) => p.test(source));
}

// Tiny TOML reader scoped to [functions.<name>] blocks. Real TOML
// parsing is overkill — the file is hand-edited with stable shape.
function parseConfigToml(toml) {
  const result = {};
  const lines = toml.split('\n');
  let currentFn = null;
  for (const line of lines) {
    const sectionMatch = line.match(/^\[functions\.([\w-]+)\]\s*$/);
    if (sectionMatch) { currentFn = sectionMatch[1]; result[currentFn] = null; continue; }
    if (/^\[/.test(line)) { currentFn = null; continue; }
    if (currentFn) {
      const kvMatch = line.match(/^verify_jwt\s*=\s*(true|false)\s*$/);
      if (kvMatch) result[currentFn] = kvMatch[1] === 'true';
    }
  }
  return result;
}

function listFunctionDirs() {
  return readdirSync(FUNCTIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

describe('Edge function verify_jwt config audit (CLAUDE.md anti-pattern #31)', () => {
  const config = parseConfigToml(readFileSync(CONFIG_TOML, 'utf-8'));
  const functionDirs = listFunctionDirs();

  it('parses at least one [functions.<name>] block from config.toml', () => {
    expect(Object.keys(config).length).toBeGreaterThan(0);
  });

  for (const funcName of functionDirs) {
    it(`${funcName}: shared-secret auth → requires verify_jwt = false`, () => {
      if (EXCLUDE_FUNCTIONS.has(funcName)) return;
      const indexPath = join(FUNCTIONS_DIR, funcName, 'index.ts');
      const source = readFileSync(indexPath, 'utf-8');
      if (!detectsSharedSecretAuth(source)) return;
      const declared = config[funcName];
      expect(declared, `Function "${funcName}" uses shared-secret auth but supabase/config.toml has no [functions.${funcName}] verify_jwt = false declaration. Without it, CI redeploys default to verify_jwt:true and the gateway rejects all invocations.`).toBe(false);
    });
  }
});
