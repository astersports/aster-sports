/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'

// Wave 4.4-C2b: per-file environment override pattern. Global env stays
// node (fast; existing tests need no DOM). Component tests opt into
// jsdom individually via the `// @vitest-environment jsdom` file-header
// directive. setupFiles always runs — its jest-dom matcher import is
// a no-op when the test environment is node.

// Wave 3.B #25 P1 closure: Sentry source-map upload. Active only when
// SENTRY_AUTH_TOKEN is set in the build env (Vercel). The plugin is
// only added to the plugin list when the token is present; missing
// token means no Sentry plugin instance + no sourcemap output — never
// blocks the build (CI without secrets, local builds, PR previews
// without the env all stay clean). Production stack traces previously
// lost source-mapping because uploads weren't configured.
const sentryToken = process.env.SENTRY_AUTH_TOKEN

export default defineConfig({
  build: {
    // Generate hidden sourcemaps so the Sentry plugin can upload them
    // without bundling the .map URL into the user-visible chunk. The
    // plugin deletes them after upload by default.
    sourcemap: sentryToken ? 'hidden' : false,
  },
  plugins: [
    react(),
    tailwindcss(),
    sentryToken && sentryVitePlugin({
      authToken: sentryToken,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      // Don't fail the build if upload fails — observability is best-effort.
      errorHandler: (err) => { console.warn('[sentry-vite-plugin]', err.message) },
    }),
  ].filter(Boolean),
  test: {
    setupFiles: ['./src/test/setup.js'],
    // Wave 4.8 6c: scope discovery to src/ so vitest doesn't try to
    // load Deno test files under supabase/functions/ (they import
    // from https:// URLs which Node's ESM loader rejects). Deno tests
    // run in the function deploy bundle, not under vitest.
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
  },
})
