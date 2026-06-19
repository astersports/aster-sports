# Aster Sports

Multi-tenant SaaS platform for youth sports organizations. Replaces LeagueApps, Google Sheets, email/text, and spreadsheets with one mobile-first platform.

**Live:** https://astersports.app
**Owner:** Olive Juice Inc (DBA Aster Sports)
**Pilot tenant:** Legacy Hoopers LLC, Westchester NY AAU youth basketball, grades 2-5

> Aster Sports (the platform and company) is separate from Legacy Hoopers (a basketball org that is the pilot tenant inside the app). Full ownership, product, agency, repo, and domain map: [`docs/STRUCTURE.md`](./docs/STRUCTURE.md).

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 · Tailwind · Vite |
| Auth + DB | Supabase (Postgres + Auth + Realtime + RLS + Storage) |
| Hosting | Vercel (auto-deploy from `main`) |
| Email | Resend (via Supabase Edge Functions) |

## Quickstart

```bash
git clone git@github.com:astersports/aster-sports.git
cd aster-sports
npm install
cp .env.example .env   # then fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev            # http://localhost:5173
```

## Common scripts

```bash
npm run dev      # Vite dev server with HMR
npm run build    # production build (must stay ≤350KB compressed — see CLAUDE.md §12 #13)
npm run lint     # ESLint
npm test         # Vitest
```

## Workflow

All work flows through PRs against `main`. Branches auto-merge once CI is green and there are no unresolved review comments — see [`CLAUDE.md`](./CLAUDE.md) §15 for the rules.

```bash
git checkout main && git pull
git checkout -b <type>/<short-description>
# ... edit, commit ...
git push -u origin <branch>
gh pr create --base main --head <branch> --title "..." --body "..."
```

Pre-flight before any new work (per CLAUDE.md anti-pattern #35):

```bash
git fetch origin
git log --oneline origin/main..HEAD   # ahead?
git log --oneline HEAD..origin/main   # behind?
```

## Where things live

| | |
|---|---|
| **Ownership + product + repo structure** | [`docs/STRUCTURE.md`](./docs/STRUCTURE.md) |
| **Source of truth for everything** | [`CLAUDE.md`](./CLAUDE.md) — design tokens, schema, anti-patterns, workflow |
| Live planning + status | [`docs/EMBER_PENDING_LEDGER.md`](./docs/EMBER_PENDING_LEDGER.md) |
| Current state-of-affairs | [`docs/STATE_OF_AFFAIRS_L99_v6.md`](./docs/STATE_OF_AFFAIRS_L99_v6.md) |
| Components | `src/components/` (≤150 LOC each) |
| Hooks | `src/hooks/` |
| Pages | `src/pages/` |
| Migrations | `supabase/migrations/` (~171 migration files / 179 registered — consult the directory) |
| Edge functions | `supabase/functions/` |
| Historical / superseded docs | `docs/archive/` |

## Hard rules (the ones most likely to trip up new contributors)

These are full-detail in [`CLAUDE.md`](./CLAUDE.md) §0 and §11 — short list here:

- **No hardcoded hex** in components. Use `var(--as-*)` tokens. Only exception: `team_color` inline from the database.
- **No invented CSS tokens.** The token list in CLAUDE.md §3 is exhaustive.
- **Files >150 lines are a P0 blocker.** Split in the same commit.
- **Forms with 3+ fields → `FullScreenForm`**, not `BottomSheet`.
- **Read from canonical sources** per §11.5 ground-truth tables (`team_players` for team membership, `financial_accounts` for payment status, etc. — not `roster_members`).
- **Branch off main and PR.** Don't commit directly to `main` (bypasses CI gates).

## License

Proprietary, Olive Juice Inc (DBA Aster Sports).
