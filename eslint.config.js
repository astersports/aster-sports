import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  // Node + browser context: build configs, scripts, and Playwright e2e
  // tests. Configs need Node globals (process, __dirname). e2e tests run
  // in Node (the test runner) but straddle browser context via Playwright's
  // page.evaluate() and similar fixtures, so include both globals sets so
  // either is allowed without no-undef tripping.
  // Application source under src/ stays browser-only via the next block.
  {
    files: [
      '*.config.{js,mjs,cjs}',
      'scripts/**/*.{js,mjs,cjs}',
      'e2e/**/*.{js,mjs}',
    ],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^[A-Z_]' }],
      'sort-imports': ['warn', { ignoreCase: true, ignoreDeclarationSort: true, allowSeparatedGroups: true }],
      // Wave 4.8 Hardening (PR #121) — ban hardcoded prod Supabase hostname.
      // The pilot project id leaked into 2 send pipelines (rsvpNudgeSend,
      // academyCallupSend) and broke multi-org portability. Force callers
      // through ${import.meta.env.VITE_SUPABASE_URL} so a project rename
      // never requires a code change.
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/vrwwpsbfbnveawqwbdmj\\.supabase\\.co/]",
          message: 'Hardcoded Supabase URL — use `${import.meta.env.VITE_SUPABASE_URL}` instead.',
        },
      ],
    },
  },
])
