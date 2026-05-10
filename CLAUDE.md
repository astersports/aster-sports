# SKYFIRE PLATFORM — CLAUDE.md
> Single source of truth for all Claude Code sessions.
> Place at project root: `~/legacy-hoopers-app/CLAUDE.md`
> Branch: `v2` (clean rebuild) — prototype preserved on `main`
> Last updated: May 5, 2026

---

## 0. ANTI-DRIFT RULES (READ FIRST — NON-NEGOTIABLE)

These rules override any instinct to "improve" or "interpret" the spec:

1. **NEVER change a CSS token value** from what's defined in this file. The hex values are final. Do not warm them, cool them, soften them, darken them, or substitute "better" alternatives.
2. **NEVER invent new tokens.** If a token isn't listed in section 3 below, it doesn't exist. Do not create `--em-shadow-xl`, `--em-border-strong`, `--em-bg-muted`, `--em-bg-subtle`, or any other token not explicitly listed.
3. **NEVER rename tokens.** `--em-bg-card-hover` stays `--em-bg-card-hover`. Do not rename it to `--em-bg-subtle` or anything else.
4. **NEVER use hardcoded hex in components** except `team_color` inline from the database. Use `var(--em-*)` for everything. `#FFFFFF` in JSX → `var(--em-text-inverse)`.
5. **NEVER use percentages or dvh for overlay heights on iOS.** Use `window.visualViewport.height` (JS) for any viewport-relative sizing. Or use full-screen fixed overlays (position: fixed; inset: 0).
6. **NEVER use BottomSheet for forms with 3+ fields.** Use FullScreenForm. BottomSheet is only for RSVP confirmations, filter pickers, and 1-2 button dialogs.
7. **If a design decision isn't in this file, ASK — don't improvise.**
8. **ALL prompts contain exact code blocks.** When a prompt says "change X in file Y," it includes the literal JSX/CSS to copy-paste — not a description of what to write. Claude Code's job is to locate the insertion point and apply the exact code. If exact code is not provided in the prompt, ASK for it — do not interpret or improvise the implementation.
9. **NEVER refactor, rename, restructure, or remove comments** from code that the prompt doesn't specifically ask you to change. Touch only what the prompt tells you to touch. If a file has 90 lines and the prompt changes 3 of them, the other 87 lines must be byte-identical after the edit.

### Verification Checklist (run before reporting "Build clean")
```bash
# 1. No warm palette remnants
grep -r '#F7F5F0\|#EAE6DD\|#E5E0D6\|#4A4852\|#1C1B1F\|#B3261E\|#1E5FAE\|#2E7D4F\|#B86E00' src/ && echo "FAIL: warm palette found" || echo "PASS"

# 2. No invented tokens
grep -r 'sf-shadow-xl\|sf-border-strong\|sf-bg-muted\|sf-bg-subtle' src/ && echo "FAIL: invented tokens found" || echo "PASS"

# 3. No hardcoded #FFFFFF in components (only allowed in team_color swatches in TeamFormSheet)
grep -rn '#FFFFFF' src/ --include='*.jsx' | grep -v 'TeamFormSheet' | grep -v 'COLOR_SWATCHES' && echo "FAIL: hardcoded #FFFFFF" || echo "PASS"

# 4. All files ≤150 lines
find src/ -name '*.jsx' -o -name '*.js' | xargs wc -l | awk '$1 > 150 && !/total/ {print "FAIL: "$2" is "$1" lines"}' || echo "PASS: all files ≤150"

# 5. Lint + build
npm run lint && npm run build && echo "PASS: lint + build clean"
```

---

## 1. WHAT IS SKYFIRE

Multi-tenant SaaS platform for youth sports organizations. Replaces LeagueApps, Google Sheets, email/text, and spreadsheets with one mobile-first platform.

**Design benchmark:** Linear (information density), Apple Calendar (schedule visualization), Nike Run Club (engagement), iMessage (messaging feel), Stripe Dashboard (financial clarity). **NOT** TeamSnap. **NOT** a default Tailwind template.

**Organization #1:** Legacy Hoopers LLC — Westchester, NY AAU youth basketball, grades 2–5.
- Co-founders: Frank Samaritano (Program Director) + Kenny Lane (Coaching Director)
- Assistant coach: Darien Gonzalez (paid per session)

**Live environment:**
- App: https://skyfire-app.vercel.app
- Repo: github.com/LegacyHoopers/skyfire-app (private)
- Supabase project: `vrwwpsbfbnveawqwbdmj`
- Admin: admin@legacyhoopers.org (user_id: `1e06a3d4-769b-42c0-b90b-92787410ee5a`, org_id: `e3e95e21-3571-4e9a-985a-d5d01480d4a6`)
- Local path: `~/legacy-hoopers-app` | branch: `v2`
- Deploy chain: push v2 then merge to main (see section 12)

---

## 2. TECH STACK

| Layer | Technology |
|---|---|
| Frontend | React 18 + Tailwind CSS + Vite |
| Auth + DB | Supabase (PostgreSQL + Auth + Realtime + RLS + Storage) |
| Hosting | Vercel (auto-deploys from `main` branch) |
| Dev environment | HP Chromebook, ChromeOS Crostini, Node.js, Claude Code |

---

## 3. DESIGN TOKENS (LOCKED — COPY EXACTLY INTO index.css :root)

**These are the ONLY tokens that may exist. Do not add, remove, rename, or change any value.**

```css
:root {
  /* ─── Platform surfaces + text (COOL GRAY — NOT warm/beige) ─── */
  --em-bg-page:        #F7F8FA;
  --em-bg-card:        #FFFFFF;
  --em-bg-card-hover:  #F9FAFB;
  --em-bg-secondary:   #F1F3F5;
  --em-bg-tertiary:    #E9ECEF;
  --em-text-primary:   #1A1D23;
  --em-text-secondary: #4A5568;
  --em-text-tertiary:  #8896AB;
  --em-text-inverse:   #FFFFFF;
  --em-border-default: #E2E8F0;
  --em-border-subtle:  #EDF2F7;

  /* ─── Status (semantic) ─── */
  --em-success:        #16A34A;
  --em-success-soft:   #DCFCE7;
  --em-warning:        #D97706;
  --em-warning-soft:   #FEF3C7;
  --em-danger:         #DC2626;
  --em-danger-soft:    #FEE2E2;
  --em-info:           #3B82F6;
  --em-info-soft:      #EFF6FF;
  --em-neutral:        #9CA3AF;
  --em-neutral-soft:   #F3F4F6;
  --em-academy:        #7C3AED;
  --em-academy-soft:   rgba(124, 58, 237, 0.1);

  /* ─── Brand (Skyfire defaults — overridden per org at runtime) ─── */
  --em-header:         #151525;
  --em-accent:         #C9952E;
  --em-accent-hover:   #D4A843;
  --em-accent-soft:    rgba(201, 149, 46, 0.1);
  --em-text-on-dark:   #F5F0E8;

  /* ─── Decorative ─── */
  --em-flame-mid:      #E87520;
  --em-crimson:        #8B1A1A;
  --em-electric:       #4A9FFF;

  /* ─── Shadows (exactly three — no fourth) ─── */
  --em-shadow-sm:  0 1px 2px rgba(0,0,0,0.04);
  --em-shadow-md:  0 2px 8px rgba(0,0,0,0.08);
  --em-shadow-lg:  0 8px 24px rgba(0,0,0,0.12);
}
```

### Legacy Hoopers Org Overrides (applied at runtime via AuthContext)
```css
--em-header:       #4a8fd4;
--em-accent:       #4a8fd4;
--em-accent-hover: #5BA0E0;
--em-accent-soft:  rgba(74, 143, 212, 0.1);
--em-text-on-dark: #FFFFFF;
```

### Team Colors (inline style from DB — the ONLY acceptable inline hex)
Team colors source from `src/lib/constants.js` (`TEAM_COLORS`, the production v14 palette
sourced from `records-v14_2.html`). Renderers read `team_color` inline from the joined
`teams.team_color` column via composer; never hardcoded in component or renderer files.
The actual values live in `constants.js` to stay in sync with what production renders —
look there for the canonical hex per team.

---

## 4. MULTI-TENANT ARCHITECTURE

Every table includes `org_id` FK → organizations. All RLS policies scope to user's org.

### Branding Per Org
`brand_colors` (jsonb) on organizations table. Applied by AuthContext on login.

**LoginPage MUST reset brand tokens to Skyfire defaults on mount** so the login always shows dark navy regardless of cached org colors.

### User Roles
| Role | Access |
|---|---|
| Admin | Full platform |
| Coach | Team-scoped |
| Parent | Player-scoped |

**Futures Academy** = `roster_type` on `roster_members`, NOT a role. Headline selling point — never a footnote.

---

## 5. DATABASE SCHEMA (v2 — 67 Migrations applied as of May 5, 2026)

| # | File | What It Does |
|---|---|---|
| 001 | foundation.sql | organizations, org_members, seasons, LH seed |
| 002 | programs_teams.sql | programs, team_staff, LH 5 teams seed |
| 003 | players_guardians.sql | players, guardians, player_guardians, roster_members, pricing_tiers, payment_plans, discount_codes, registrations, payments, form_fields, form_responses, waivers, waiver_signatures |
| 004 | activities.sql | activities, activity_changes |
| 005 | rsvp_checkin_interactions.sql | rsvps, check_ins, activity_duties, activity_rides, activity_comments, activity_views, player_activations |
| 006 | messaging.sql | messages, message_reactions, message_reads |
| 007 | notifications.sql | notifications |
| 008 | locations_opponents.sql | locations, opponents, FK additions, LH venue seeds |
| 009 | invites.sql | team_invites |
| 010 | scoring.sql | game_results, game_plays |
| 011 | financials.sql | Phase 7 — TBD |
| 012 | indexes_views.sql | all performance indexes |

#### Wave migrations (May 4–5, 2026 — canonical version strings)
| Version | Name | What It Does |
|---|---|---|
| 20260504190331 | wave_1h_rls_with_check_hygiene_24_policies | WITH CHECK on 24 ALL/UPDATE policies |
| 20260504213434 | wave_3b_hardening_anon_column_grants | Column-level anon grants on events/game_results/tournaments |
| 20260504230402 | wave_5b_game_plays_table | game_plays for live scoring play-by-play |
| 20260505024916 | wave_2d3_event_arrivals_and_checklist_state | event_arrivals + coach_checklist_state on events |
| 20260505115253 | wave_7b2_season_rollover_schema | seasons.status + season_rollovers audit table |
| 20260505120640 | wave_7a_financials_schema | financial_accounts + financial_transactions + coach_payouts |
| 20260505140316 | wave_7a_add_processing_fee_cents | processing_fee_cents column + family_balances view |
| 20260505161540 | user_roles_self_privilege_escalation_fix | Split user_roles_self into SELECT + INSERT(parent only) |

#### Ghost migrations (applied via SQL editor, not registered — known divergence)
5 migrations exist as repo files but are NOT registered in `supabase_migrations.schema_migrations`. Their schemas are live in production. If running `supabase db reset`, these files are needed to recreate the schema.
- `20260504_messaging.sql` — messages table + message_reads + RLS
- `20260504_dm_threads.sql` — dm_threads (user_a/user_b) + messages.dm_thread_id + RLS
- `20260504_ride_requests.sql` — event_ride_requests table + RLS
- `20260504_game_results_cascade_delete.sql` — FK CASCADE on game_results.event_id
- `20260504_rls_cleanup_dangling_policies.sql` — drops orphaned org_announcements/message_drafts policies

### RLS Pattern
```sql
CREATE OR REPLACE FUNCTION current_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM org_members
  WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
-- NEVER call this on org_members — infinite recursion
```

### Key Field Decisions (locked)
- `is_scrimmage` boolean on activities — NOT a separate activity_type
- `roster_type` on roster_members — NOT a separate role
- `member_type` on players: 'roster' | 'futures_academy'
- `channel` on messages: 'announcement' | 'chat' | 'dm'
- `home_away` on activities: 'home' | 'away' | 'neutral' | 'tbd'
- `activity_duties` = per-slot rows (3 slots = 3 DB rows)
- `game_results` separate table from activities
- `competition_type` stores internal value — public display maps league_play to "League Play", never "CYO"

---

## 6. FILE ARCHITECTURE (v2)

Every component file ≤150 lines. Split if larger.

Key rules:
- **Forms with 3+ fields → FullScreenForm.jsx** (full-screen overlay)
- **Simple dialogs (RSVP, confirmations) → BottomSheet.jsx**
- All shared components in `src/components/shared/`
- All admin components in `src/components/admin/`

---

## 7. DESIGN SYSTEM (LOCKED — NO INTERPRETATION)

### Component Standards
- Tap targets: **44px minimum** (non-negotiable)
- Inputs: 44px height, `var(--em-bg-tertiary)` bg, 1.5px border, 10px radius, accent focus ring
- Cards: `var(--em-bg-card)`, `var(--em-border-default)`, 10px radius, `var(--em-shadow-sm)`
- Buttons: primary (accent bg, inverse text) / secondary (accent border) / destructive (danger bg, inverse text) / ghost
- Button press: `scale(0.97)` + `vibrate(50)`
- Modals: `rgba(0,0,0,0.3)` backdrop — **never bg-black/50**
- Icons: Lucide React only, 16/20/24px, stroke-width 1.75
- Badges: 6px radius, 11px text, weight 500
- Avatars: 24/32/40/56px

### Typography
Inter (400/500/600/700). Scale: 24/20/17/15/13/11px.
- Headers: tracking-tight, line-height 1.2
- Body: line-height 1.5
- Event time: 17px bold always
- Labels: tracking-wide uppercase, 11px, weight 500

### Spacing
4px grid: 4/8/12/16/20/24/32/48px.
- Card padding: 16px comfortable, 12px compact
- Card gap: 12px comfortable, 6px compact

### Border Radius
6px (badges) / 10px (cards, inputs) / 16px (modals) / 9999px (avatars)

### Shadows
Only three: sm / md / lg (see section 3 for exact values). **No fourth shadow.**

### Animations (10 total, all behind prefers-reduced-motion)
sf-pulse, sf-fade-in, sf-pulse-dot, sf-bounce-tap, sf-fill-grow, card-expand, sheet-rise, toast-enter, sf-bell-shake, spin

---

## 8. BUILD PROMPT ORDER

| # | Prompt | Status |
|---|---|---|
| 1-A | Skeleton + auth + layout + shared | ✅ DONE |
| 1-B | Admin home + season mgr + team mgr | ✅ DONE |
| RESET | Foundation Reset (token + visual fix) | ✅ DONE |
| 2-A | Roster + player/guardian CRUD | ✅ DONE |
| 2-B | Schedule + weather + density | ⚠ PARTIAL — schedule + density done; weather wired to coach/admin home |
| 2-C | Activity CRUD wizard | ✅ DONE |
| 2-D | RSVP + event detail + check-in | ✅ DONE |
| 2-D2 | Ride board + duties + comments | ✅ DONE |
| 2-D3 | Game day checklist + running late | ✅ DONE — arrival board, parent status buttons, coach checklist |
| 2-E | Availability heatmap | ✅ DONE — per-player attendance grid with streak fire icon |
| 3-A | Location + opponent mgr | ⚠ PARTIAL — locations seeded (9 venues), no mgmt UI |
| 3-B | Calendar sync + public schedule + QR | ⚠ PARTIAL — public schedule page done; calendar sync + QR not |
| 3-C | Home dashboard + inline RSVP | ✅ DONE |
| 4-A | Team chat + announcements | ✅ DONE — channels, DM threads, unread badges, message deletion |
| 4-B | Save & Message Team + auto-notifications | |
| 5-A | Quick score entry + records | ✅ DONE — records page with standings + tournament scorebooks |
| 5-B | Live scoring interface | ✅ DONE — play-by-play, stats tab, subs sheet, fouls, undo toast |
| 5-C | Player stats + box score | |
| 6-A | Parent onboarding + QR invites | ⚠ PARTIAL — auto-link guardians done; QR invites not |
| 7-A | Financial dashboard | ✅ DONE — season picker, net-to-bank, LeagueApps import, record payment |
| 7-B | Multi-org + season rollover | ✅ DONE (7-B.2) — 5-step rollover wizard with atomic execution |
| 7-C | PWA + auth upgrades | ✅ DONE — sw.js, manifest, install prompt, apple-touch-icon |

#### Financial data loaded (May 5, 2026)
LeagueApps import: 70 families, 100 accounts (40 Fall 2025 + 60 Spring 2026), 105 transactions. $102,765 billed, $97,374 net to bank. Email-first dedup, orphan-merge for 2 families (DeMasi, KHOJASTEH).

⬅ NEXT unbuilt: 4-B (auto-notifications), 5-C (player stats), 3-A location mgr UI, 3-B calendar sync + QR, 6-A QR invites. Plus finish partials: 2-B weather API polish.

---

## 9. PROMPT RULES

1. Every prompt starts with: "Read CLAUDE.md before starting."
2. Every prompt ends with: "Build clean." + run the verification checklist from section 0.
3. Follow the design system EXACTLY — no interpretation.
4. **Never rewrite files >150 lines** — targeted edits or split.
5. **Forms with 3+ fields → FullScreenForm. Simple dialogs → BottomSheet.**
6. **Deploy chain after every commit** (see section 12).
7. All shared components in `src/components/shared/`.

---

## 10. LEGACY HOOPERS REFERENCE

### Teams (oldest to youngest)
| Team | Age | Circuit | Practice | Sort |
|---|---|---|---|---|
| 11U Girls | 11U | AAU (Zero Gravity) | Wed, WCC | 1 |
| 10U Black | 10U | AAU (Zero Gravity) | Wed, WCC | 2 |
| 10U Blue | 10U | League Play | Tue, WCC | 3 |
| 9U Boys | 9U | League Play | Tue, WCC | 4 |
| 8U Boys | 8U | AAU (Zero Gravity) | Wed, WCC | 5 |

Team colors live in `src/lib/constants.js` (`TEAM_COLORS`, production v14 palette).
Renderer code reads `team_color` from joined `teams.team_color` via composer — never
hardcodes hex. Source of truth = `constants.js`; this table no longer mirrors hex
to prevent drift.

### Naming Rules
- Number first: "10U Black" never "Boys 10U Black"
- Records page: ALL CAPS with full gender
- Never "CYO" publicly — always "League Play"
- "Futures Academy" — never "practice roster"
- Sort: oldest to youngest always

### Seasons
- **Spring 2026** (active): March 23 – June 14. Grades 2–5. 60 families, $70,242 billed.
- **Fall 2025** (archived): Historical LeagueApps import. 40 families, $32,522 billed.

### Staff
| Name | Role | Email |
|---|---|---|
| Frank Samaritano | Program Director | admin@legacyhoopers.org |
| Kenny Lane | Coaching Director | coachkenny@legacyhoopers.org |
| Darien Gonzalez | Assistant Coach | coachdarien@legacyhoopers.org |

---

## 11. ANTI-PATTERNS (NEVER DO)

1. `current_user_org_id()` on org_members → infinite RLS recursion
2. `bg-black/50` → `rgba(0,0,0,0.3)` inline
3. `max-height` expand/collapse → ref-based height
4. Sequential `await` in loops → `.in('id', [...ids])`
5. `document.getElementById` in React → state
6. Rewrite files >150 lines → targeted edits
7. Constants in multiple files → `lib/constants.js`
8. Hardcode hex → CSS variables only (except team_color from DB)
9. "CYO" publicly → "League Play"
10. "Boys 10U" → "10U Boys"
11. Sky blue `#29b6f6` → cobalt `#4a8fd4`
12. Scrimmage as activity type → `is_scrimmage` boolean
13. Duties as one row → per-slot rows
14. Futures Academy as role → `roster_type`
15. **BottomSheet for multi-field forms → FullScreenForm**
16. **Invent CSS tokens → forbidden**
17. **Change CSS token values → forbidden**
18. **CSS % or dvh for overlay heights → JS visualViewport**
19. **Deploy without merging v2 → main → nothing ships**
20. **cmd='ALL' RLS policies must always have explicit with_check.** with_check=NULL on a write policy allows any column values that pass the USING qual, with zero constraint on the data being written. P0 anti-pattern by default. Wave 1G (Decision #110) caught this on event_rsvps, event_comments, event_duties. M5 methodology rule.
21. **Migration mirror files must be created in the same turn as MCP apply.** When Claude AI applies a migration via `apply_migration`, the mirror `.sql` file is created immediately with the canonical production version string as the filename prefix (e.g. `20260505161540_wave_7a_...sql`). Claude Code does NOT write migration files for schema applied via MCP — that creates version-string mismatches and duplicate files. The user moves the file into `supabase/migrations/` in the next round-trip.
22. **Never trust Claude Code's "committed and pushed" reports without verification.** Claude Code may report files as committed when they were actually auto-committed by pre-commit hooks with different content, or when the push targeted a different branch than expected. Always verify with `git log --oneline` + `git diff` after any claimed commit.
23. **Always REVOKE from PUBLIC before revoking from a specific role.** Postgres functions default to `EXECUTE` for the `PUBLIC` pseudo-role, which all real roles (anon, authenticated, service_role) inherit. Revoking from a single role does NOT remove inherited PUBLIC access — the role still has EXECUTE through PUBLIC. Wrong (silently no-op): `REVOKE EXECUTE ON FUNCTION foo FROM anon;`. Correct: `REVOKE EXECUTE ON FUNCTION foo FROM PUBLIC; REVOKE EXECUTE ON FUNCTION foo FROM anon;`. Same pattern for tables, sequences, schemas. When auditing, check `information_schema.routine_privileges` for the full grant chain including PUBLIC. Caught on Wave 1 P0 fix (May 5, 2026) when first REVOKE silently no-op'd and the migration transaction rolled back atomically.
24. **When auditing RLS via `pg_class.relrowsecurity`, filter by `relkind='r'`.** Views (`relkind='v'`) inherit RLS from underlying tables; `relrowsecurity=false` on a view is meaningless. Both audits in the May 5 audit-arc surfaced `notifications_queue` as "RLS disabled" — it's a view over `event_notifications` which has full RLS. False positive in two independent audits; use `relkind='r'` filter to avoid the same trap.
25. **PostgREST `.upsert(..., { onConflict: 'col' })` requires a UNIQUE or PK constraint on the named column(s).** A single-column conflict target fails with `42P10: there is no unique or exclusion constraint matching the ON CONFLICT specification` when the table only has a composite UNIQUE/PK. For composite targets, comma-separate every column: `onConflict: 'a,b,c'`. Combine with #18 (NOT NULL validates at INSERT phase even when conflict routes to UPDATE) and you can land two separate-cause PRs against the same upsert line. Caught May 9, 2026 in PR #38 follow-up to PR #37 — `staff_profiles_pkey` is `(user_id, org_id)`, not `(user_id)`. Always cross-check `pg_constraint` for `contype IN ('u','p')` before writing onConflict.
26. **Before shipping a fix PR for a failing operation, replay the failing operation directly via Supabase MCP `execute_sql` with the production payload.** This catches compounding bugs where the first hypothesis is partially right and a second separate-cause bug lurks behind it. PR #37 added a missing column to a payload (real fix for anti-pattern #18) but missed that the same line had a wrong onConflict spec (anti-pattern #25). One MCP replay between the two PRs would have surfaced both at once. Format: `INSERT/UPDATE/UPSERT ... <production payload> ... RETURNING ...;` — the error code (42501, 42P10, 23502, 23505 etc.) names the actual category instantly.

27. **Resolver and composer functions must be pure with injected IO.** Per the wave 4.2-A calendar-as-spine doctrine, `resolveX(anchor, options)` and `composeX(context, slice, overrides)` MUST NOT import the shared Supabase client at the top of the resolver module. Static imports of `'../../supabase'` trigger client init at test load and throw `Missing VITE_SUPABASE_URL...` because Vite's test runner doesn't bind production env vars. Always accept the client via `options.supabase` (required, not defaulted to global). Callers that need the production client (`digestSend`, cron in wave 4.3, UI hooks) import it themselves and pass it through. Composers must also remain side-effect-free — same input + same context + same slice + same overrides produce deeply-equal output. No fabrication: a null `location.name` renders "Location TBD"; a missing coach is omitted (not stamped with placeholder text). Caught when resolving wave 4.2-A-1 fixture-driven snapshot test.

28. **Calendar-anchored briefing kinds dispatch through `RESOLVER_REGISTRY` — not a switch on `state.kind`.** Per wave 4.2-A-8a, `src/lib/engine/resolvers/registry.js` is the single source of truth for resolver+composer mapping per kind. Each entry exposes `{ resolve, compose, anchorFromState, overridesFromState, sendPath }` with optional `blockedReason` class. `sendPath` is the dispatch discriminator: `composerSubmit` (main flow), `digestSend` (separate pipeline), `rsvpNudgeSend` (per-recipient mint short-circuit), `blocked` (cannot send today; throws the entry's `blockedReason`), `legacy` (free-form announcement / custom_message — not in the registry; getDispatchSendPath returns 'legacy' for unknown kinds). Adding a new calendar-anchored kind = one registry entry. Never re-introduce per-kind branching in `composerSubmit.js` or `PreviewPanel.jsx`. UI bridges between resolver context and Body components go through the `useResolverPreview` hook (not `useEffect` chains that mutate state).

---

## 11.5. GROUND-TRUTH TABLES (CANONICAL SOURCES)

The schema has multiple tables that look like they describe the same thing
but encode different concerns. Reading from the wrong one creates the bug
class that produced the "Milo filter" issue. Always read from the canonical
source for the question you're asking.

| Question | Canonical source | Notes |
|---|---|---|
| Which kids are on a team right now? | `team_players` | `roster_type` in rostered/futures, `status` in active/inactive |
| What jersey does a kid wear on a team? | `team_players.jersey_number` (text) | Keep aligned with `roster_members` via alignment trigger |
| What size jersey/shorts is the kid wearing? | `roster_members` | Sizes live here and only here |
| What is the kid's payment status for the season? | `financial_accounts` + `financial_transactions` | Not `roster_members.payment_status` (legacy column) |
| What teams is the current parent's child on? | `current_user_child_team_ids()` | SECURITY DEFINER; do not query underlying tables |
| What players can the current parent see in roster lists? | `current_user_teammate_player_ids()` | SECURITY DEFINER |
| Was the kid eligible for an event on `event_date`? | `roster_members.registered_at` / `left_at` | Date-windowed eligibility for attendance views |
| What's the parent's app context (kids + teams)? | `parent_context_v` view | Single helper used by AuthContext.parentContext |

**Rules:**
- Application code never reads from `roster_members` directly except for sizes and historical date windows in the 5 attendance views.
- RLS policies never reference `roster_members` directly. They go through `current_user_*` helpers.
- New code that needs "is this kid on this team" reads from `team_players`.
- New code that needs "is this kid's parent allowed to see this row" reads from `current_user_teammate_player_ids()` or `current_user_child_team_ids()`.

The two tables are kept in alignment by the trigger added in migration `20260505201932_wave4_roster_alignment_lock`. If they ever diverge, the trigger surfaces it as an INSERT/UPDATE failure rather than as silent UI bugs.

---

## 12. DEVELOPMENT WORKFLOW

```bash
# Resume every session
cd ~/legacy-hoopers-app && claude

# ALWAYS use this full chain — never skip the merge
git add -A && git commit -m "description" && git push origin v2 && git checkout main && git merge v2 && git push origin main && git checkout v2

# Wait 60s for Vercel deploy, test on phone
```

10. **Every Claude Code prompt ends with manual verification steps.** The prompt MUST end with a numbered checklist Frank can walk through in the app (e.g., "1. Log in as admin. 2. Navigate to X. 3. Verify Y renders."). Don't merge v2 → main until checklist passes.

11. **Files over 150 lines are a P0 blocker.** If the prompt results in a file > 150 lines, stop and split in the SAME commit. Do not ship "will refactor later."

12. **Every parent-facing message/briefing generator ships with device-frame preview.** The compose UI must render the output in 375px (mobile), 600px (desktop email), and plain-text frames before admin can copy/send. No exceptions, no "preview in Session X."

13. **Bundle size budget: 350KB total compressed.** Run `npm run build` and check the dist/assets/*.js sizes. If total exceeds 350KB, do not merge. Code-split or remove dependencies.

14. **Accessibility is non-negotiable.** All interactive elements must have aria-label or visible text. All form inputs must have associated <label>. Tab order must be logical. Run `npx @axe-core/cli` before parent rollout.

15. **Claude Code auto-merges its own PRs** once ALL of the following hold:
    - All required CI checks are completed and green (no pending, no failures)
    - Zero unresolved review comments
    - PR is not in `draft` state (Claude Code marks ready before merging)
    - Default merge method is `squash` for single-commit PRs, `merge` for multi-commit feature PRs
    - PR base is `main` and `mergeable_state` is `clean`
    Manual override (per-PR, rare):
    - Apply the `do-not-auto-merge` label to hold a PR pending Frank's review
    - Request a reviewer other than Claude Code
    No path-based exceptions. Schema migrations, CLAUDE.md edits, RLS policies, edge function deploys to prod, and financial schemas all auto-merge once CI is green and there are no unresolved review comments — same as any other PR. If Frank wants to hold something for review, use the label or request a reviewer.
    Goal: Frank stays no-touch. Claude Code is responsible for verifying CI green + zero review comments before pressing merge. Anti-pattern #22 still applies — verify the merge with a follow-up `pull_request_read` after.

---

## 13. COMMUNICATIONS ENGINE HTML RULES (Phase 6)

When generating tournament briefing HTML for LeagueApps + email delivery:

1. **Inline-styled only.** No `<style>` blocks. LeagueApps strips them.
2. **Table-based layout.** No `<div>` wrappers in rules sections.
3. **`<span>` + `<br>` for inline content.** Not `<p>` tags inside list rows.
4. **Standard bullets.** Use `&#8226;` not unicode bullets.
5. **Brand colors:**
   - Header: dark navy #091c36
   - Accent: cobalt #1e3a5f (Migration 029, NOT old sky blue #29b6f6)
   - Game-day arrival callout: orange #e05c2a
6. **Audience scoping for tournament messages:** scope to `tournament_rosters` table, NOT team roster. Use `getTournamentRecipients(tournament_id)` helper.
7. **Recipient preview before send:** show "Active: X · Futures: Y · Recipients: Z guardians" chip.
8. **Canonical 9 kinds for `comms_messages.kind`** (matches `BRIEFINGS_COVERAGE_L99.md` §1 + production `briefing_templates.kind_check` + `briefing_triggers.kind_check`)**:** weekly_digest, schedule_change, game_recap, tournament_prelim, tournament_recap, announcement, custom_message, rsvp_nudge, academy_callup_notice. Verified against production via Supabase MCP. The table rename (tournament_messages → comms_messages) and enum rename (message_type → kind) ship together in foundation migration `20260508234920_comms_foundation_polymorphic_rename`. Note: `comms_messages.kind_check` currently allows 7 transitional legacy values (tournament_preliminary, tournament_final, tournament_rsvp_lock, tournament_recap_interim, tournament_recap_final, multi_team_notice, custom) for compatibility with historical data; these will be backfilled and dropped in wave 4.1d-6 once code emit paths are fully migrated (wave 4.1d-5 retires the `tournament_preliminary` and `custom` emit sites).

---

## 14. STR_REPLACE INDENTATION DRIFT (PRE-FLIGHT FOR CLAUDE.AI HANDOFFS)

Documented pattern across 5+ commits this session: when claude.ai writes str_replace OLD blocks for files it did not author verbatim earlier in the same conversation, the OLD will be over-indented by exactly 2 spaces per level relative to the actual file.

**Pre-flight:** Before applying any multi-line str_replace OLD, count leading spaces on the file's actual line and match them. Don't trust claude.ai's inferred indent. Strip 2 leading spaces from every line in OLD if first attempt fails.

**Implication for prompt writing:** When generating str_replace prompts that target files NOT authored verbatim earlier in the conversation, explicitly note the file's actual indentation pattern in the prompt header. Or instruct claude.ai to read the verbatim source via grep + cat first and re-anchor before generating OLD blocks.

---

## 15. MAP URL PRIORITY (Phase 1+ canonical pattern)

When constructing map deep links across the app, priority order is:

1. `location.google_maps_url` (Frank-verified pin from gym-locations-v4.html or admin-curated)
2. `location.lat` + `location.lon` (geocoded coordinates)
3. `location.address` (text fallback, encodeURIComponent)

If none of the above are present, render a "Location TBD" non-link.

For tournament events with `tournament.schedule_status='draft'` or null, hide the map UI entirely and render a "Schedule releases Wednesday" placeholder instead. Map appears only after schedule_status advances to preliminary/final/live/complete.

Apple Maps + Waze URL formats are deferred — currently only Google "Get Directions" button renders on event detail Location tab. Helper `src/lib/mapsUrls.js` still exports apple/waze URLs for the day they are re-added.

---

## 16. ELITE DESIGN PRINCIPLES (LOCKED APRIL 26, 2026)

### 16.1 Optimistic UI everywhere — but scope-aware

Per-row writes (RSVPs, rides, duties, score entry one-game-at-a-time) ship optimistic. Bulk operations (TourneyMachine paste import, batch admin actions) stay pessimistic with confirm-after-validate. Cascading admin time-edits (event time change → cascades to RSVPs/rides/duties/notifications) stay pessimistic.

Microcopy on rollback: "Looks like that didn't go through. Try again?"

### 16.2 Density (NowSection-scoped)

NowSection components on parent and coach home pages read `useDensity` and render MIN/MED/MAX variants. Density may extend to other surfaces when a specific user need is named; the `useDensity` hook + `user_preferences.card_density` JSONB storage are ready for extension. Default density is MED. Other surfaces ship with one well-tuned density.

Scoped down from "everywhere" on Apr 30, 2026 (IA Map v1, Decision 2). Prior aspiration: every list/card/section reads `useDensity` and exposes a chevron. Reality through Wave 3c-a.2: 1 of ~9 candidate surfaces complies (NextUpCard router on parent home). Cost to extend (~3-4 sessions, threading through 8 components) outweighed marginal payoff at typical 5-10 item list lengths. Storage backbone retained for re-entry when a real user need surfaces.

### 16.3 Kindness microcopy mandate

| Don't | Do |
|-------|-----|
| "Error 403" | "Looks like you don't have access. Contact your admin." |
| "Network error" | "Couldn't reach the server. Try again in a moment." |
| "Invalid input" | "That doesn't look right. Check the format and try again." |
| "Operation failed" | "Looks like that didn't go through. Try again?" |
| "No data" | "No events here yet — but Coach Kenny is plotting something good." |

Every microcopy decision: warmth + clarity + actionability.

### 16.4 Accessibility is table stakes (Phase 1.5 Elite Polish)

Non-negotiable for every new component:
- aria-label on every interactive element
- Live regions on state-changing surfaces
- prefers-reduced-motion honored
- Keyboard nav (Tab, Enter, Space, Esc)
- Color contrast ≥ 4.5:1 body, ≥ 3:1 UI elements
- Dynamic Type (Phase 5 native)
- VoiceOver test before any persona's home page passes 95%

ELITE-28 ships CONTINUOUSLY — not a Phase 1.5 step.

### 16.5 Notification cadence — TWO STREAMS (clarified)

**Stream A: Event reminders** (don't forget your event)
- 3-day · 1-day · 4-hour cadence
- Admin-configurable per org/team
- Suppressed by Quiet Mode unless severity 'critical'

**Stream B: RSVP nudges** (you haven't RSVP'd yet)
- T-4h + T-1h before RSVP-lock deadline
- Banner + push at both intervals
- Email weekly digest Sunday 6 PM
- SMS reserved for cancellations + admin 'critical' only

Both streams run independently. Both are admin-configurable.

### 16.6 Translation scope (Phase 3 lock)

Bidirectional EN ↔ ES:
- All UI labels translation-routed (Phase 1 strings must be extractable)
- Admin messages auto-translated before send (admin previews both)
- Reverse: parent writes Spanish, coach reads auto-translated EN with "view original" toggle ALWAYS visible
- Never gate features behind language preference

**Anti-pattern reminder:** translation interface uses FullScreenForm, not BottomSheet (per CLAUDE.md anti-pattern #15).

### 16.7 Privacy locks (always-on)

- **Streaks**: family-private. Coach sees own team's aggregate %. No public leaderboard.
- **Attendance trending arrows**: parent = own child only · coach = own team only · admin = all
- **Anonymous suggestion box**: default identifiable, anonymous toggle as escape valve
- **Photo wall**: admin pre-approves first 30 days per user, then trusted-contributor auto
- **Birthday auto-wishes**: opt-in via guardian_notification_prefs

**Implementation pattern reminder:** streaks UI uses ref-based height for expand/collapse (per anti-pattern #18).

### 16.8 Audit log visibility

Every coach/admin override: timestamped, author-tagged, surfaced to affected parents.
- Format: "[Override · Coach Kenny · 4:47 PM]"
- Schema: `event_rsvp_audit` table (Phase 2)

### 16.9 Real-time presence pattern

When data changes that another user might care about:
- Subtle toast: "Sara K just RSVP'd ✓" (auto-dismiss 4s)
- Activity stream on event detail (last 10 actions)
- "Coach Kenny is editing" indicator on concurrent edits

Migration 039 (Phase 1 Step 5G) adds Realtime publication to event_rsvps.

### 16.10 Performance budgets (hard limits)

- Initial bundle: ≤ 350 KB compressed (currently ~102 KB)
- FCP: ≤ 1.5s on 4G
- TTI: ≤ 2.5s on 4G
- 60fps scrolling on iPhone 11
- Long lists (>30 items) must virtualize

### 16.11 First impressions

- Login: cobalt #4a8fd4 + phoenix mark (ELITE-49)
- First-time tour: 3 dismissible tooltips on first home visit
- "What's new" changelog: 3-line summary once per shipped feature
- Empty states with brand voice
- Loading states: SectionSkeleton (Step 5B) shape-matched

### 16.12 Game stats vs engagement stats (CRITICAL DISTINCTION)

| Category | Per-player allowed in 2026? | Examples |
|----------|------------------------------|----------|
| Game stats | NO (team-level only locked) | Points, rebounds, assists, steals, +/- |
| Engagement stats | YES (per-player allowed) | Attendance, RSVP timeliness, sessions completed |

ELITE-13 streaks, ELITE-15 yearbook, ELITE-16 YoY are all engagement stats — NOT game stats. No conflict with prior lock.

### 16.13 The Elite Stack — implementation gate

Before merging any feature to main, ask:

1. Optimistic UI applied where applicable? (16.1)
2. Density-aware? (16.2)
3. Kindness microcopy passed? (16.3)
4. Accessibility shipped? (16.4)
5. Notification cadence followed? (16.5)
6. Strings translation-extractable? (16.6)
7. Privacy locks honored? (16.7)
8. Audit trail if override? (16.8)
9. Presence toast where appropriate? (16.9)
10. Performance budget respected? (16.10)

If any answer is no, feature is not ready to merge.
