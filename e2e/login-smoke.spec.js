// Read-only smoke test: confirms the login page renders end-to-end through
// the production build (vite build → vite preview). No auth, no data writes,
// no PostHog/Sentry interaction.
//
// What this test catches:
//   - The build doesn't render at all (blank page, 500, JS bundle errors)
//   - The login page is missing required elements (form, brand)
//   - Vite preview can't serve the build
//   - CI integration of Playwright is broken
//
// What this test does NOT catch:
//   - Anything behind auth (use Playwright PR #2-4 for those)
//   - RSVP flow (PR #3)
//   - Briefing send (PR #4)
//   - Vercel-specific runtime behavior (this runs against `vite preview`,
//     not the Vercel preview URL)

import { expect, test } from '@playwright/test';

test.describe('Login page — anonymous smoke', () => {
  test('loads at /login and renders the sign-in form', async ({ page }) => {
    await page.goto('/login');

    // The HTML <title> is set in index.html. Platform renamed Ember → Vela
    // (2026-06-01, rebrand R1). Match the historical names too so this test
    // survives any future wrapper without rewriting.
    await expect(page).toHaveTitle(/Skyfire|Legacy Hoopers|Vela|Ember/i);

    // The login form exposes an email input + a submit button. We assert on
    // role-based queries (not on visible text) so the test survives copy
    // changes — checking that the *interaction surface* exists, not the
    // exact wording of any label.
    const emailInput = page.getByRole('textbox', { name: /email/i });
    await expect(emailInput).toBeVisible();

    const submitButton = page.getByRole('button', { name: /sign in|log in/i });
    await expect(submitButton).toBeVisible();
  });

  test('redirects to /login when visiting an auth-gated route unauthenticated', async ({ page }) => {
    // Visit the protected home route. The router-level <Protected> wrapper
    // should redirect to /login. This validates that auth gating is wired,
    // even without testing the auth flow itself.
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });
});
