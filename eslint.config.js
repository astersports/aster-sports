import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  // Node-context config files (root-level *.config.js, scripts/) need
  // process / __dirname / etc. as known globals so 'no-undef' doesn't trip.
  // Application source under src/ stays browser-only.
  {
    files: ['*.config.js', 'scripts/**/*.{js,cjs}'],
    languageOptions: {
      globals: globals.node,
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
