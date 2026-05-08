# SKYFIRE PLATFORM — DESIGN & CODE AUDIT PACKAGE

## Contents
1. `CLAUDE.md` — Complete platform spec (tokens, schema, rules, architecture)
2. `full-source.txt` — All 21,295 lines of source code (JSX, JS, CSS)
3. `design-tokens.css` — CSS custom properties (colors, shadows, spacing)
4. `file-tree.txt` — Complete file listing (270+ files)
5. `file-sizes.txt` — Every file sorted by line count
6. `import-map.txt` — Component dependency graph
7. `git-log.txt` — 80+ commits from this session
8. `package.json` — Dependencies and scripts

## Tech Stack
- React 18 + Vite + Tailwind CSS
- Supabase (PostgreSQL + Auth + Realtime + RLS + Storage)
- Vercel hosting (auto-deploy from main)
- Bundle: 296KB compressed (350KB budget)

## Architecture
- 270+ source files, all ≤150 lines
- 70 custom hooks
- 3 roles: Parent, Coach, Admin
- Design tokens: 35 CSS variables (cool gray palette)
- Multi-tenant with org-scoped RLS

## Key Design Decisions
- Mobile-first (375px primary target)
- 44px minimum tap targets
- Team color system (5 teams, inline hex from DB)
- 3-density event cards (compact/default/detailed)
- Optimistic UI with rollback on all mutations
- Kindness microcopy on all error/empty states
- No sf-fade-in on scroll container ancestors (iOS Safari fix)
- No window.focus listeners (use visibilitychange)
- useActivities called once per page, passed as props

## Session Changes (May 7-8, 2026)
- Fixed iOS Safari touch event bug (transform on PageTransition)
- Fixed infinite refetch loop in count hooks
- 40-item deployment across 8 batches
- Full platform audit (parent/coach/admin)
- Design review against Linear/Nike Run Club/Apple Calendar/Stripe
