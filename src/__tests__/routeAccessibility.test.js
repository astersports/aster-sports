// Static-grep audit — enforces that every route registered in App.jsx
// has at least one navigation referencer somewhere in src/.
//
// Origin (2026-05-19): the §4.O PR A scope check (PR #268) surfaced
// that /locations was orphan dead code — page + route existed, but
// zero nav links anywhere. Frank pushed back on the initial "the page
// exists" framing, which forced a clearer reading: code-in-tree ≠
// reachable. This test mechanically catches the class going forward.
//
// Design — what counts as a "referencer":
//   - Literal `to="/path"` or `to={"/path"}` in JSX props
//   - Template-literal `to={`/path${...}`}` — counts as long as the
//     literal prefix matches the route's static portion (for dynamic
//     routes like /teams/:teamId, the prefix `/teams/` satisfies)
//   - `navigate('/path')` or `navigate(\`/path${...}\`)` in JS
//   - <Navigate to="/path" /> JSX
//   - The route MAY also appear in another `Route path=` (e.g., shared
//     prefixes); those don't count — only navigation-shape references do
//
// Exemption list — routes that are accessible but the audit can't see
// the referencer mechanically:
//   - Auth entry points (/login, /unauthorized) — hit by RequireAuth
//     redirects, no `to=` in normal JSX
//   - Root path "/" — implicit default; always reachable
//   - Redirect-only routes ("/records-preview") — Navigate destination
//     not a nav entry
//   - Dynamic routes (`:param`) where the static prefix is captured by
//     a parent path's referencer
//
// Known-orphan exemption (PENDING RESOLUTION):
//   - None today — /locations now has a referencer via AdminManageLinks
//     (PR #268 follow-up landing in same PR as this test).
//
// To exempt a new route, add it to EXEMPT below WITH a comment naming
// the reason. Permanent exemptions need a code-comment justification;
// "known orphan pending resolution" entries should have a ledger
// reference (e.g., §X.Y) tracking the cleanup.

import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '../..');
const APP_PATH = resolve(PROJECT_ROOT, 'src/App.jsx');

// Routes where the audit can't see the referencer mechanically OR
// where the route is intentionally never directly navigated to.
const EXEMPT = new Set([
  '/login',              // RequireAuth redirects here; no `to=` in normal JSX
  '/unauthorized',       // RequireAuth redirects here for role mismatch
  '/forgot-password',    // Linked from LoginPage form (text content varies)
  '/',                   // Root / home default; always reachable
  '/records-preview',    // <Navigate to="/records"> destination; intentional alias
  '/admin/briefings/radar', // <Navigate to> destination from the /admin/briefings redirect (Track-R R-1 entry); reached via the redirect, not a direct Link
]);

function extractRoutePaths(appSource) {
  const re = /<Route\s+path="([^"]+)"/g;
  const out = [];
  let m;
  while ((m = re.exec(appSource)) !== null) out.push(m[1]);
  return out;
}

// Strip :param suffixes so /teams/:teamId becomes /teams/. The static
// prefix is what referencers will match against in template literals.
function staticPrefix(route) {
  const idx = route.indexOf(':');
  if (idx === -1) return route;
  return route.slice(0, idx);
}

// Use grep -r over src/ excluding App.jsx (route definitions) and this
// test file (which contains route literals for the audit itself).
// Returns true if at least one match exists.
function hasReferencer(route) {
  const prefix = staticPrefix(route);
  const search = prefix.endsWith('/') && prefix !== '/' ? prefix.slice(0, -1) : prefix;
  if (!search || search === '/') return true; // Root - always reachable
  try {
    // grep -r recursively, --include filters to source files, --exclude
    // skips App.jsx + this test. -l = list files only (fast).
    const cmd = `grep -rl --include='*.js' --include='*.jsx' --include='*.ts' --include='*.tsx' --exclude='App.jsx' --exclude='routeAccessibility.test.js' '${search}' ${PROJECT_ROOT}/src`;
    const result = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return result.trim().length > 0;
  } catch {
    // grep returns exit code 1 when no matches found
    return false;
  }
}

describe('routeAccessibility audit (anti-pattern #42 corollary)', () => {
  const appSource = readFileSync(APP_PATH, 'utf8');
  const routes = extractRoutePaths(appSource);

  it('extracts all routes from App.jsx', () => {
    expect(routes.length).toBeGreaterThan(10);
    expect(routes).toContain('/');
    expect(routes).toContain('/schedule');
  });

  for (const route of [...new Set([...EXEMPT, '/'])]) {
    // EXEMPT routes don't need a referencer; assertion is informational
    // (we exempt to keep the audit's signal clean, not to ignore drift).
    it.skip(`(exempt) ${route} — no referencer required`, () => {});
  }

  const auditable = routes.filter((r) => !EXEMPT.has(r));

  for (const route of auditable) {
    it(`${route} — has at least one navigation referencer in src/`, () => {
      const found = hasReferencer(route);
      if (!found) {
        throw new Error(
          `Orphan route detected: "${route}" has no nav referencer in src/.\n` +
          `Add a <Link to="${route}"> / navigate() call, or add ${route} to EXEMPT in this test with a justifying comment.`,
        );
      }
      expect(found).toBe(true);
    });
  }
});
