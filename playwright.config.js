// Playwright config for Aster Sports E2E tests.
//
// Scope per the staged Playwright rollout:
//   PR #1 (this scaffold) — one read-only smoke test (login page renders).
//                           No auth, no data writes. Validates CI integration.
//   PR #2  — login (auth-gated, no data writes)
//   PR #3  — RSVP (parent UI + magic-link via rsvp-token-handler)
//   PR #4  — briefing send
//
// Runs against a local `vite preview` server (not the deployed Vercel preview)
// to keep CI self-contained for PR #1. Future PRs targeting auth-gated routes
// may switch to Vercel preview URL once test-team / test-org doctrine lands.
//
// chromium-only by design — covers the dominant browser without pulling
// Firefox + WebKit (~600 MB saved in CI).

import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Spin up `vite preview` automatically. Reuses if already running locally.
  webServer: {
    command: `npm run preview -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
