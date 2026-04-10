# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Skyfire — multi-tenant SaaS platform for youth sports organizations. Each organization is fully isolated by `organization_id` on every table.

**Organization #1:** Legacy Hoopers LLC, a Westchester NY youth basketball program (grades 2-5, Spring 2026 season). Co-founders: Frank Samaritano (Program Director), Kenny Lane (Coaching Director).

### Roadmap

- **2026:** PWA (Progressive Web App) — mobile-first, installable from browser
- **2027:** Native mobile apps (iOS / Android)

### Legacy Hoopers Teams (org #1)

- 11U Girls — AAU/Zero Gravity circuit
- 10U Black — AAU/Zero Gravity circuit
- 10U Blue — League Play only
- 9U Boys — League Play only
- 8U Boys — AAU/Zero Gravity circuit

## Tech Stack

- **Frontend:** React + Tailwind CSS
- **Auth + Database:** Supabase (RLS enforces org isolation)
- **Payments:** Stripe Connect (one connected account per organization)
- **Hosting:** Vercel
- **Domain:** app.legacyhoopers.org (org #1), custom domains per org planned

## Multi-Tenant Architecture

Every data table includes an `organization_id` column (FK to `organizations`). All RLS policies scope queries to the user's organization. No cross-org data leakage is permitted.

- `organizations` — tenant registry (name, slug, sport, branding, Stripe account, subscription plan)
- `organization_settings` — per-org config (timezone, season label, feature flags)
- `user_roles` — maps auth.users to a role within a specific organization

### Subscription Plans

- **Starter** (default) — core features
- **Pro** — advanced analytics, custom domain
- **Elite** — full platform, priority support

### Branding

Each organization stores `brand_colors` (jsonb) in the `organizations` table with four keys:

| Key | CSS Custom Property | Skyfire Default | Legacy Hoopers |
|-----|-------------------|-----------------|----------------|
| `header` | `--sf-header` | `#151525` | `#4a8fd4` |
| `accent` | `--sf-accent` | `#C9952E` | `#4a8fd4` |
| `accent_hover` | `--sf-accent-hover` | `#D4A843` | `#5BA0E0` |
| `text_on_dark` | `--sf-text-on-dark` | `#F5F0E8` | `#FFFFFF` |

`AuthContext` sets these as CSS custom properties on `<html>` when the org loads, with per-key fallbacks to Skyfire defaults. All components use `var(--sf-*)` tokens — never hardcode brand colors in markup.

## User Roles

Roles are scoped per organization:

- **Admin**: full access to all modules within their organization
- **Coach**: their team's schedule, roster, session logging
- **Parent**: their child's team schedule and roster

## Development

```bash
npm run dev      # Start Vite dev server
npm run build    # Production build
npm run preview  # Preview production build locally
```

Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Architecture

- `src/lib/supabase.js` — Supabase client singleton
- `src/context/AuthContext.jsx` — Auth state + role + organization fetched from `user_roles` joined to `organizations`
- `src/components/RequireAuth.jsx` — Route guard; accepts `allowedRoles` array
- `src/components/ErrorBoundary.jsx` — Root error boundary (catches React crashes)
- `src/components/Layout.jsx` — App shell with responsive nav (role-aware, org-branded)
- `src/pages/` — Route-level components (Login, ForgotPassword, Dashboard, Schedule, PublicSchedule, Roster, Admin, AdminEvents, AdminLocations, AdminOpponents, Unauthorized)
- `supabase/migrations/` — SQL migrations (RLS-enabled, org-scoped)

Role and organization are stored in `public.user_roles` + `public.organizations` (not in JWT claims), fetched on auth state change.

## Migrations

- `001_user_roles.sql` — Initial user_roles table with RLS
- `002_skyfire_foundation.sql` — Organizations, org settings, user_roles org scoping, Legacy Hoopers seed data
- `003_core_data_model.sql` — Seasons, teams, players, team_players, guardians, player_guardians, team_staff, events; org-scoped RLS via `current_user_org_id()` helper; Legacy Hoopers Spring 2026 seed (5 teams); `updated_at` triggers
- `004_schedule_extensions.sql` — Events table extensions (status, jersey, arrival, rides, multi-day, attachments, indoor, coach_notes, parent_event_id); event_changes, event_duties, event_rsvps, event_rides, event_comments tables; team_color on teams; Legacy Hoopers team color seeds; RLS via `event_org_matches()` helper + public read policies
- `005_interactive_features.sql` — rsvp_deadline on events; notifications_queue table (org-scoped, status-indexed)
- `006_locations_opponents.sql` — locations table (name, address, sub_locations text[]); opponents table (name, notes); org-scoped RLS; Legacy Hoopers venue seeds (St. Patrick's Gym, WCC Gym, Rippowam Gym, Westchester County Center)
