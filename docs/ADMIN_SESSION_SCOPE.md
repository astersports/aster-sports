# ADMIN SESSION SCOPE — Next Session Prep

## Current Admin State
- 6 admin pages, 17 admin components, 2,196 total lines
- KPI grid, financial dashboard, season management, team management all built
- Quick actions: +Event, +Player, Financials, Announce, Message, Tournaments

## Priority Build Items (Next Session)

### Tier 1: Core Admin Operations

**1. Member/Family Directory Page**
- New page: `src/pages/AdminMembersPage.jsx`
- List all guardians with: name, email, phone, linked status, children, teams, payment status
- Search + filter by team
- Tap to expand: see children, payment history, send DM
- Route: `/admin/members`
- DB: `guardians` + `player_guardians` + `players` + `team_players` + `financial_accounts`

**2. Coach Assignment Management**
- Enhance `AdminTeamsPage.jsx` or new component
- Show which coaches are assigned to which teams (from `team_staff`)
- Assign/unassign coaches to teams
- Track game assignments (which coach covers which game)
- Per-session payout tracking (ties to `coach_payouts`)
- DB: `team_staff` + `coach_payouts`

**3. Dashboard Deep-Links**
- KPI cards tap through to relevant pages:
  - Players → `/admin/members`
  - Events → `/schedule`
  - Collected → `/admin/financials`
  - Outstanding → `/admin/financials?filter=overdue`
- Quick Actions: add `/admin/members` link

**4. Opponent Manager CRUD**
- New page: `src/pages/AdminOpponentsPage.jsx`
- List all opponents with CRUD (create, edit, merge duplicates)
- Route: `/admin/opponents`
- DB: `opponents` table (already exists, migration 008)

### Tier 2: Communication Engine

**5. Email/HTML Briefing Send**
- Tournament briefing already built (`tournamentBriefing.js`)
- Need: actual send capability via Supabase Edge Function or external email API
- Admin previews → taps Send → emails go to scoped recipients
- DB: `tournament_messages` table

**6. Notification Backend (auto_notifications column migration)**
- Migration: add `auto_notifications JSONB DEFAULT '{}'` to `organizations`
- Edge functions for Stream A (event reminders) + Stream B (RSVP nudges)
- Cron schedule: check events → generate notifications → send push/email

### Tier 3: Data Integrity & Scale

**7. CSV Schedule Importer**
- Replicate `FinancialImportPage.jsx` pattern for game schedules
- Paste CSV → map columns → batch insert events
- Critical for CYO onboarding (250+ games)

**8. Audit Trail Visibility**
- Admin overrides show who/when on affected items
- `[Override · Frank S. · 4:47 PM]` badge on RSVPs, ride cancels
- DB: `event_rsvp_audit` table (Phase 2 per CLAUDE.md)

**9. Calendar Sync Backend**
- Supabase Edge Function serving dynamic ICS feed
- `webcal://` URLs already scaffolded in PublicSchedulePage

## Files That Need Headroom (close to 150 lines)
- `KpiGrid.jsx`: 140 lines — need to extract Sparkline if adding tap-through
- `TeamFormSheet.jsx`: 143 lines — tight, may need split for coach assignment
- `AdminSeasonsPage.jsx`: 139 lines
- `FinancialDashboardPage.jsx`: 140 lines

## DB Migrations Needed
1. `auto_notifications JSONB DEFAULT '{}'` on `organizations`
2. `coach_game_assignments` table (coach_id, event_id, role, payout_amount)
3. `admin_audit_log` table (user_id, action, target_table, target_id, timestamp, details)

## Route Additions Needed in App.jsx
- `/admin/members` → AdminMembersPage
- `/admin/opponents` → AdminOpponentsPage
