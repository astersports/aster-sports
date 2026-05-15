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
      // ──────────────────────────────────────────────────────────────────
      // eslint-plugin-react-hooks 7.1.1 — new rules set to 'warn', NOT 'off'
      // (Option C with constraints from 2026-05-13 Dependabot triage).
      //
      // The plugin's 7.1.x line ships React Compiler / React 19 idiom
      // checks. Each catches a real concern in the render-scheduling
      // model — JS-3 (PR #149) was exactly this class (stale closure on
      // Enter key). The existing codebase has ≥10 violation sites that
      // need per-site analysis. Setting to 'warn' instead of 'off':
      //   - Violations still surface in CI output for triage
      //   - Build doesn't fail, so the 7.1.1 bump can land
      //   - Existing inline `// eslint-disable-next-line` comments
      //     for these rules stay useful (vs. becoming unused-disable
      //     warnings under 'off')
      //
      // exhaustive-deps stays at error (pre-existing rule, codebase
      // clean post-PR #126 Wave 4.8 hygiene).
      //
      // FUTURE PROCESS (per reviewer's discipline note):
      //   1. Triage warnings into a tracked list (file:line + classification)
      //   2. Fix one PR at a time, each scoped to one violation
      //   3. When the warning count for a rule hits zero, promote that
      //      rule from 'warn' to 'error' and delete the disable.
      //
      // Don't drop all five rules to 'off' silently — that's the failure
      // mode the disable-and-forget anti-pattern warns about.
      // ──────────────────────────────────────────────────────────────────
      // set-state-in-effect promoted to 'error' after PR draining
      // Group A — 7 sites: useNeedsBriefing, useRideClaims, useRideOffers,
      // useRoster, useTournament, useLocations, useTournaments. All 7
      // shared the fetch-on-mount pattern. Fix: wrap the effect's
      // fetcher call in an inline async IIFE — React's canonical
      // idiom for data-fetching effects per react.dev. Makes the
      // async boundary syntactically visible.
      'react-hooks/set-state-in-effect': 'error',
      // purity promoted to 'error' after PR draining Group E1 —
      // useAttendanceData.js:82. Single repo-wide site; Date.now()
      // inside useMemo was the violation. Fix: lift `now` to state
      // (nowMs), refresh alongside data via existing refetch callback,
      // useMemo deps on nowMs. Lazy initializer useState(() => Date.now())
      // is exempt from the purity rule (runs once at mount, not on
      // re-render).
      'react-hooks/purity': 'error',
      // immutability + refs promoted to 'error' after PR draining
      // Group E2 — useScoreDraft.js (refs at line 47, immutability at
      // line 94). Both rules had only this 1 site repo-wide. Fix
      // pattern: useEffect-mediated ref writes + performSaveRef
      // indirection for self-recursive useCallback. Canonical React 19
      // idioms per react.dev/reference/react/useRef.
      'react-hooks/immutability': 'error',
      'react-hooks/refs': 'error',
      // preserve-manual-memoization promoted to 'error' after PR draining
      // Group D — useBriefingDraft.js, useEventDelete.js, useScheduleChangeAudit.js.
      // All 3 violations shared the optional-chain-in-deps shape
      // (`[user?.id]` / `[event?.id, …]`). React Compiler can only infer
      // the whole object as the dep; fix was to align deps to `[user]` /
      // `[event]`. Both refs are stable per AuthContext (useState +
      // useMemo'd value) and useEventDetail (state-backed hook).
      'react-hooks/preserve-manual-memoization': 'error',
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
