# ASTERSPORTS PLATFORM — CLAUDE.md
> **Platform renamed → AsterSports (2026-06-01).** Lineage: Skyfire → Ember → ~~Vela~~ → AsterSports (Vela dropped —
> domain unavailable.) **Full internal namespace rename shipped 2026-06-01** (Frank's directive):
> the design-token prefix is now `--as-*` (was `--em-*`), animation/utility classes are `as-*`
> (was `em-*`), and brand consts are `ASTER_BRAND` / `ASTER_DISPLAY_NAME` in `src/lib/asterDefaults.js`
> (was `EMBER_*` / `emberDefaults.js`). No "Ember" remains in live `src/` naming. User-facing
> strings say "Aster Sports." Domain: `astersports.app`/`.io`/`.co` (the `.com` is a separate
> sports-equipment co — TM check pending). Mark: constellation-arrow (gold-on-navy, palette
> unchanged). Rebrand plan: `docs/AUDIT_VELA_REBRAND.md`. The *tenant* "Legacy Hoopers" is
> unchanged (a customer org; AsterSports is the platform above it). **Repo/deploy id renamed
> 2026-06-08:** the GitHub repo + Vercel deploy id `skyfire-app` → `aster-sports` (rename-in-place
> under the LegacyHoopers account; GitHub auto-redirects the old name), and the legacy
> `skyfire-app.vercel.app` alias was removed — production is `astersports.app`. **Repo org moved
> 2026-06-11:** the repo transferred to the `astersports` GitHub org — live remote is
> `github.com/astersports/aster-sports` (GitHub redirects the old org path) and the Vercel project
> lives under the `astersports` team (`vercel.com/astersports/aster-sports`). **Surviving legacy
> identifiers (deliberately NOT renamed):** the immutable `002_skyfire_foundation`
> migration filename + the `ember_live` CHECK-constraint data value in migrations; the `@ember`
> ICS `UID` suffix (`icalHelpers.js` + `team-feed`) → a calendar-dedup stable key, changing it
> duplicates events in subscribers' calendars; the dead `--sf-*` tokens that survive only in
> `docs/archive`; and historical `docs/` (incl. `EMBER_PENDING_LEDGER.md` + every `docs/archive/SKYFIRE_*.md` + `docs/EMBER_TENANCY_ARCHITECTURE_v3.md` + `docs/EMBER_PROGRAM_SETUP_SPEC_v2.md`) kept as-is to preserve
> the record. **Doctrine clause:** archive docs and brand-named planning docs are NEVER retroactively renamed; the names ARE the record. Wave 3.B #29 P0-4 catalog-refresh discipline applies only to live-state claims (file paths still mounted, line counts still accurate), not to filenames or historical references. No user-facing string says Skyfire, Ember, or Vela.
> Single source of truth for all Claude Code sessions.
> Place at project root: `~/aster-sports/CLAUDE.md`
> Branch: `main` (v2 retired May 11, 2026 — see `docs/archive/PRE_3_AUDIT_2026-05-11.md`)
> Last updated: June 11, 2026

---

## 0. ANTI-DRIFT RULES (READ FIRST — NON-NEGOTIABLE)

These rules override any instinct to "improve" or "interpret" the spec:

1. **NEVER change a CSS token value** from what's defined in this file. The hex values are final. Do not warm them, cool them, soften them, darken them, or substitute "better" alternatives.
2. **NEVER invent new tokens.** If a token isn't listed in section 3 below, it doesn't exist. Do not create `--as-shadow-xl`, `--as-border-strong`, `--as-bg-muted`, `--as-bg-subtle`, or any other token not explicitly listed.

   **Corollary:** new tokens are allowed when they close accessibility gaps,
   with explicit rationale in the token's CSS comment. The breach is a
   structural improvement, not arbitrary fragmentation. Locked instance:
   `--as-text-meta: #6B7280` (4.6:1) — the future addition that closes the
   `--as-text-tertiary` (#8896AB, 3.8:1) WCAG AA gap across ~40-60 surfaces.
   Tertiary preserved for non-text use (icons, dividers); meta is the new
   text-rank floor for AA compliance. Adoption of this corollary requires
   the token to carry an explicit comment naming the closed gap.
3. **NEVER rename tokens.** `--as-bg-card-hover` stays `--as-bg-card-hover`. Do not rename it to `--as-bg-subtle` or anything else. (Historical note: the entire prefix was renamed once, `--em-*` → `--as-*`, on 2026-06-01 as an explicit operator-directed platform rebrand — a single deliberate sweep, not piecemeal drift. The `--as-*` prefix is now the locked namespace; this rule governs going forward.)
4. **NEVER use hardcoded hex in components** except `team_color` inline from the database. Use `var(--as-*)` for everything. `#FFFFFF` in JSX → `var(--as-text-inverse)`.
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
grep -r 'as-shadow-xl\|as-border-strong\|as-bg-muted\|as-bg-subtle' src/ && echo "FAIL: invented tokens found" || echo "PASS"

# 3. No hardcoded #FFFFFF in components (only allowed in team_color swatches in TeamFormSheet)
grep -rn '#FFFFFF' src/ --include='*.jsx' | grep -v 'TeamFormSheet' | grep -v 'COLOR_SWATCHES' && echo "FAIL: hardcoded #FFFFFF" || echo "PASS"

# 4. All files ≤150 lines (with 4 documented exceptions — see §6 "Known >150 exceptions")
find src/ -name '*.jsx' -o -name '*.js' | grep -v __tests__ | xargs wc -l | awk '$1 > 150 && !/total/ && $2 !~ /(AuthContext\.jsx|kindMetadata\.js|familyGuideHelpers\.js|registry\.js)$/ {print "FAIL: "$2" is "$1" lines"}' || echo "PASS: all files ≤150 (excl. 4 documented exceptions)"

# 5. Lint + build
npm run lint && npm run build && echo "PASS: lint + build clean"
```

---

## 1. WHAT IS ASTER SPORTS

Multi-tenant SaaS platform for youth sports organizations. Replaces LeagueApps, Google Sheets, email/text, and spreadsheets with one mobile-first platform.

**Owner:** Olive Juice Inc (DBA Aster Sports). The platform is a separate legal entity from any tenant. Full ownership, product, agency, repo, and domain map: `docs/STRUCTURE.md` (canonical).

**Design benchmark:** Linear (information density), Apple Calendar (schedule visualization), Nike Run Club (engagement), iMessage (messaging feel), Stripe Dashboard (financial clarity). **NOT** TeamSnap. **NOT** a default Tailwind template.

**Pilot tenant (Organization #1):** Legacy Hoopers LLC, Westchester NY AAU youth basketball, grades 2-5. A separate company from Aster Sports; the first tenant on the platform.
- Legacy Hoopers co-founders: Frank Samaritano (Program Director) + Kenny Lane (Coaching Director). Kenny is part of Legacy Hoopers only, not Aster Sports.
- Assistant coach: Darien Gonzalez (paid per session)

**Live environment:**
- App: https://astersports.app
- Repo: github.com/astersports/aster-sports (public; org move 2026-06-11 — was LegacyHoopers)
- Supabase project: `vrwwpsbfbnveawqwbdmj`
- Admin: admin@legacyhoopers.org (user_id: `1e06a3d4-769b-42c0-b90b-92787410ee5a`, org_id: `e3e95e21-3571-4e9a-985a-d5d01480d4a6`)
- Local path: `~/aster-sports` | branch: `main`
- Deploy chain: PR against main, auto-merge per §15 once CI green (see section 12)

---

## 2. TECH STACK

| Layer | Technology |
|---|---|
| Frontend | React 19 + Tailwind CSS 4 + Vite 8 |
| Auth + DB | Supabase (PostgreSQL + Auth + Realtime + RLS + Storage) |
| Hosting | Vercel (auto-deploys from `main` branch) |
| Dev environment | HP Chromebook, ChromeOS Crostini, Node.js, Claude Code |

---

## 3. DESIGN TOKENS (LOCKED — COPY EXACTLY INTO index.css :root)

**These are the ONLY tokens that may exist. Do not add, remove, rename, or change any value.**

```css
:root {
  /* ─── Platform surfaces + text (COOL GRAY — NOT warm/beige) ─── */
  --as-bg-page:        #F7F8FA;
  --as-bg-card:        #FFFFFF;
  --as-bg-card-hover:  #F9FAFB;
  --as-bg-secondary:   #F1F3F5;
  --as-bg-tertiary:    #E9ECEF;
  --as-text-primary:   #1A1D23;
  --as-text-secondary: #4A5568;
  --as-text-tertiary:  #8896AB;
  --as-text-inverse:   #FFFFFF;
  --as-border-default: #E2E8F0;
  --as-border-subtle:  #EDF2F7;

  /* ─── Status (semantic) ─── */
  --as-success:        #16A34A;
  --as-success-soft:   #DCFCE7;
  --as-warning:        #D97706;
  --as-warning-soft:   #FEF3C7;
  --as-danger:         #DC2626;
  --as-danger-soft:    #FEE2E2;
  --as-info:           #3B82F6;
  --as-info-soft:      #EFF6FF;
  --as-neutral:        #9CA3AF;
  --as-neutral-soft:   #F3F4F6;
  --as-academy:        #7C3AED;
  --as-academy-soft:   rgba(124, 58, 237, 0.1);

  /* Achievement (palette role: gold = achievement ONLY — never act-now
     amber, never system cobalt). Operator-ratified 2026-06-05 (home-redesign
     D5); values from the v2 render. --as-gold-text on --as-gold-soft = 6.8:1 (AA). */
  --as-gold:           #B8860B;
  --as-gold-soft:      #FBF3DC;
  --as-gold-text:      #8F6708;

  /* ─── Brand (platform defaults — overridden per org at runtime) ─── */
  --as-header:         #151525;
  --as-accent:         #C9952E;
  --as-accent-hover:   #D4A843;
  --as-accent-soft:    rgba(201, 149, 46, 0.1);
  --as-text-on-dark:   #F5F0E8;

  /* ─── Decorative ─── */
  --as-flame-mid:      #E87520;
  --as-crimson:        #8B1A1A;
  --as-electric:       #4A9FFF;

  /* ─── Shadows (exactly three — no fourth) ─── */
  --as-shadow-sm:  0 1px 2px rgba(0,0,0,0.04);
  --as-shadow-md:  0 2px 8px rgba(0,0,0,0.08);
  --as-shadow-lg:  0 8px 24px rgba(0,0,0,0.12);
}
```

### Legacy Hoopers Org Overrides (applied at runtime via AuthContext)
```css
--as-header:       #4a8fd4;
--as-accent:       #4a8fd4;
--as-accent-hover: #5BA0E0;
--as-accent-soft:  rgba(74, 143, 212, 0.1);
--as-text-on-dark: #FFFFFF;
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

**LoginPage MUST reset brand tokens to platform defaults on mount** so the login always shows the platform default (navy header + gold accent) regardless of cached org colors.

### Tenant Data Boundary (no tenant facts in platform code or doctrine)
Tenant-specific values (team names, team colors, season names, competition-type display labels such as "League Play", staff names, "Futures Academy" naming) live in the org's database row and org config. They are never hardcoded in platform components and never asserted as universal rules in this doctrine. The platform reads them from the org (organizations.brand_colors, teams.team_color, competition_type, etc.). Section 10 (Legacy Hoopers Reference) is the PILOT tenant's example config, not platform law. Tenant #2 (St Patrick) will carry different values on every line.

### User Roles
| Role | Access |
|---|---|
| Admin | Full platform |
| Coach | Team-scoped |
| Parent | Player-scoped |

**Futures Academy** = `roster_type` on `team_players`, NOT a role. Headline selling point — never a footnote.

---

## 5. DATABASE SCHEMA (190 migration files in repo as of 2026-06-02 — consult the directory for the canonical count; registered-vs-mirror parity tracked separately per AP #21)

> The illustrative tables below capture the foundation (001–012) and select Wave migrations.
> They are NOT exhaustive, and the per-file 001–012 names below are partly stale (consult the directory for actual filenames). Actual count 190 files in `supabase/migrations/` (as of 2026-06-02).
> Source of truth for the full list is the migrations directory; consult it directly when
> reasoning about current schema.

| # | File | What It Does |
|---|---|---|
| 001 | foundation.sql | organizations, user_roles (membership; there is no `org_members` table), seasons, LH seed |
| 002 | programs_teams.sql | programs, team_staff, LH 5 teams seed |
| 003 | players_guardians.sql | players, guardians, player_guardians, roster_members, pricing_tiers, payment_plans, discount_codes, registrations, payments, form_fields, form_responses, waivers, waiver_signatures |
| 004 | activities.sql | events (was "activities" — table renamed mid-flight; migration filename retained per archive doctrine), event_change_audit |
| 005 | rsvp_checkin_interactions.sql | event_rsvps (was rsvps), check_ins, event_duties (was activity_duties), event_rides (was activity_rides), event_comments (was activity_comments), event_views (was activity_views), player_activations |
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
**Audit-day reconciliation (Wave 1+2.A, 2026-05-28):** 16 ghost migrations exist as repo files but are NOT registered in `supabase_migrations.schema_migrations` (the 5 originally documented below + 13 stale legacy-numbered `023_*`–`033_*` files that were renumbered to timestamp versions but never deleted from the repo — pre-PR-#566 state). Plus 29 orphan applied changes (DB-registered versions whose repo files were renamed to different timestamps, AP #21 mirror-discipline violations) — including 8 with NO repo mirror at all (backfilled in PR #566). Wave 2.A #23 reconciliation (PR #566): 6 AP #21 drift files renamed, 8 backfill mirrors written; the 13 stale files were slated for deletion but 6 (023_*–028_*) REMAIN present as of 2026-05-29 (deletion incomplete — D1-4). Schemas are live in production; if running `supabase db reset`, the 5 originally-documented ghosts are needed to recreate the schema.
- `20260504_messaging.sql` — messages table + message_reads + RLS
- `20260504_dm_threads.sql` — dm_threads (user_a/user_b) + messages.dm_thread_id + RLS
- `20260504_ride_requests.sql` — event_ride_requests table + RLS
- `20260504_game_results_cascade_delete.sql` — FK CASCADE on game_results.event_id
- `20260504_rls_cleanup_dangling_policies.sql` — drops orphaned org_announcements/message_drafts policies

### RLS Pattern
```sql
CREATE OR REPLACE FUNCTION current_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.user_roles
  WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;
-- Membership lives in user_roles (there is NO org_members table).
-- NEVER reference this function inside a user_roles RLS policy — infinite recursion.
```

### RLS Pattern: `auth.uid()` subselect wrapper

When writing RLS policies that reference `auth.uid()` (or any
`auth.<function>()`), wrap the call in a subselect:
`(SELECT auth.uid())` instead of bare `auth.uid()`.

Reason: bare `auth.uid()` causes Postgres to evaluate the function
once per row in the query plan. Subselect wrapping causes the planner
to evaluate once per query as an initplan. Significant query plan
improvement on large tables.

Detection: `get_advisors` flags this as `auth_rls_initplan` WARN
advisory.

```sql
-- BAD (per-row evaluation):
CREATE POLICY foo ON bar
  FOR SELECT
  USING (user_id = auth.uid());

-- GOOD (initplan, evaluated once per query):
CREATE POLICY foo ON bar
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));
```

Apply to all `auth.<function>()` references in RLS policies:
`auth.uid()`, `auth.role()`, `auth.jwt()`, `auth.email()`.

Origin: surfaced via `team_types` `auth_rls_initplan` advisory from
PR #451; fixed in parallel advisor hygiene migration 2026-05-22.

### Key Field Decisions (locked)
- `is_scrimmage` boolean on activities — NOT a separate activity_type
- `roster_type` on team_players — NOT a separate role (roster_members has no roster_type)
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

### Zone decomposition pattern for role-specific home pages

When a role-specific home page approaches the 150-line cap (anti-pattern
#6), mirror the established parent-home + coach-home decomposition pattern:

- `src/components/<role>-home/<Role>HomeAlertZone.jsx` — alert/notification
  surfaces (pending RSVPs, urgent items)
- `src/components/<role>-home/<Role>HomeSignalZone.jsx` — signal aggregation
  + display (recent activity, upcoming items)
- `src/components/<role>-home/<Role>HomeHeader.jsx` — page header
  sub-component

Reference instances: `src/components/parent-home/` (3 zone components,
established 2026-05-21) + `src/components/coach-home/` (3 zone components,
established 2026-05-21).

**Pending application:** `src/pages/AdminHomePage.jsx` is at 146/150
lines as of 2026-06-02 (was 142/150 at the 2026-05-22 baseline; grew
through registration-arc + rebrand work). The next material change
likely requires decomposition into `src/components/admin-home/`. Don't
decompose preemptively (§16.13: ship not gate by config) — wait for
the cap pressure trigger.

When the cap pressure triggers:
1. Create the 3 zone files in `src/components/admin-home/`
2. Extract corresponding sections from AdminHomePage.jsx
3. AdminHomePage.jsx becomes a thin wrapper (~50 lines)
4. Cross-surface invariant test per anti-pattern #43 to lock the
   per-role behavior

Decision routing: 2026-05-22 (Phase 3 Q8, claude.ai routing — Option B
locked after Q8 irony test fired on initial Option C single-line comment).

### Known >150 LOC exceptions (documented per Wave 3.B #29 P0-1, 2026-06-02)

The §0 verification grep #4 excludes these 4 non-test files. Each carries
the same cap-pressure-trigger discipline as the AdminHomePage zone
decomposition above — wait for the next material change, then split. Do
not preemptively decompose.

| File | LOC | Split shape when triggered |
|---|---|---|
| `src/context/AuthContext.jsx` | 172 | Auth state + org branding apply + cache wiring can split into `useAuthBranding` hook (extracts the useOrgBranding side effect) + `AuthOrgProvider` (separates org-load from session-load). Initial step: extract the `parentContext` derivation. || `src/lib/briefings/kindMetadata.js` | 169 | Per-kind metadata blocks (one per of 12 canonical `comms_messages.kind` values) — split per kind into `kindMetadata/<kind>.js` files + an `index.js` registry. Same shape as `RESOLVER_REGISTRY` per AP #28. |
| `src/lib/engine/resolvers/familyGuideHelpers.js` | 155 | New since 2026-05-29 (post-original-audit). Helpers cluster by section type — split into `familyGuideHelpers/{schedule,coaches,quick_links}.js` when next material edit lands. |
| `src/lib/engine/resolvers/registry.js` | 159 | New since 2026-05-29. Registry entries already structured per kind — the file's growth is from per-entry metadata, not logic. Split when adding 13th kind would push it past 175. |

**Adding to this list requires a chat-side review pass** (per §11.7 operational rule #7). Removing — i.e., split lands and file drops back under 150 — is mechanical: delete the row + update the §0 grep regex.

---

## 7. DESIGN SYSTEM (LOCKED — NO INTERPRETATION)

### Component Standards
- Tap targets: **44px minimum** (non-negotiable)
- Inputs: 44px height, `var(--as-bg-tertiary)` bg, 1.5px border, 10px radius, accent focus ring
- Cards: `var(--as-bg-card)`, `var(--as-border-default)`, 10px radius, `var(--as-shadow-sm)`
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
as-pulse, as-fade-in, as-pulse-dot, as-bounce-tap, as-fill-grow, card-expand, sheet-rise, toast-enter, as-bell-shake, spin

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
| 3-B | Calendar sync + public schedule + QR | ✅ DONE — public schedule page; calendar sync (PR #342 V-23 iCal); QR SHIPPED (`qrcode.react` + `ShareScheduleButton.jsx`) |
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

#### Financial data loaded (May 5–6, 2026)
LeagueApps import across two waves: May-5 initial import (100 accounts), May-6 retrospective Fall 2025 top-up for families who joined Spring 2026 first (64 additional accounts). Current state: 164 accounts across 3 seasons (Fall 2025 + Winter 2025-26 + Spring 2026), 244 transactions, $166,910 billed, $165,635 gross / $160,244 net to bank. Email-first dedup. DeMasi: 2 legitimate co-guardian rows (no merge needed). KHOJASTEH: family correctly modeled with both parents linked to Aubtin via player_guardians; financial_accounts attached to mom (Anjella Teimoori).

⬅ Status (reconciled 2026-06-02 — see EMBER_PENDING_LEDGER §4.0 + §4.BV for the verified index): in-app QR **SHIPPED** (`qrcode.react` dep + `ShareScheduleButton.jsx`) — the 3-B/6-A QR arc is no longer unbuilt. Already DONE since this list was written: 2-B weather (Open-Meteo, wired), 3-A location mgr UI (`/admin/locations`), schedule-change notifications, coach_roundup briefing, QR, **4-B auto-notifications** (Stream A handler gates on `organizations.auto_notifications.reminders_enabled` per Wave 3.A #19 P0-3 closure, PR #643; the operator settings UI — `AutoNotificationSettingsForm` at `/admin/settings` → Communications — shipped 2026-06-09 with the admin-gated `set_org_auto_notifications` RPC). BLOCKED: 5-C player stats/box score — §16.12 forbids per-player game stats in 2026 (do not build).

---

## 9. PROMPT RULES

1. Every prompt starts with: "Read CLAUDE.md before starting."
2. Every prompt ends with: "Build clean." + run the verification checklist from section 0.
3. Follow the design system EXACTLY — no interpretation.
4. **Never rewrite files >150 lines** — targeted edits or split.
5. **Forms with 3+ fields → FullScreenForm. Simple dialogs → BottomSheet.**
6. **Deploy chain after every commit** (see section 12).
7. All shared components in `src/components/shared/`.

### 9.1 Session pre-flight discipline (three-item opener)

Every Claude Code session begins with the following checks IN ORDER,
before any new work dispatches:

1. **Branch state check** (anti-pattern #35) — `git fetch origin &&
   git log --oneline origin/main..HEAD` + `git log --oneline HEAD..origin/main`.
   If either shows commits, halt and reconcile before any new work.

2. **get_advisors at schema-change session close** (anti-pattern #15 corollary)
   — if the prior session shipped schema migrations, run
   `mcp__supabase__get_advisors` on session-open to surface security/perf
   advisories generated by the prior session's schema changes.
   Skip if no schema migrations shipped.

3. **EMBER_PENDING_LEDGER §4 reconciliation** (anti-pattern #45) — verify
   the ledger reflects the prior session's PR closures. If the ledger is
   stale relative to merged PRs, reconcile before any new work dispatches.

4. **Parent-checkout leakage detection** (anti-pattern #52 refinement) —
   run `git diff --quiet HEAD || echo "WARN: parent checkout has
   unstaged changes — verify they are intentional, not agent-worktree
   leakage from prior session"`. Catches accumulated leakage from prior
   sessions' agent path-construction errors. If output shows WARN, run
   `git status --short` and `git stash list` to surface the leakage
   for review before any new work.

This discipline closes the gap between sessions — drift catches early
instead of accumulating across sessions. Cheap to run (< 2 minutes
total), high-ROI when it surfaces drift.

---

## 10. LEGACY HOOPERS REFERENCE (PILOT TENANT EXAMPLE, NOT PLATFORM LAW)

> Organization #1, the pilot tenant. These values live in the org's DB row and config, not in platform code. See §4 "Tenant Data Boundary." Tenant #2 (St Patrick) will differ on every line. Shown here as a concrete reference for pilot work.

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

1. `current_user_org_id()` referenced inside a `user_roles` RLS policy → infinite RLS recursion (membership is `user_roles`; there is no `org_members` table)
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
19. **Commit directly to main → bypasses CI gates and the PR review trail. Always branch + PR.**
20. **cmd='ALL' RLS policies must always have explicit with_check.** with_check=NULL on a write policy allows any column values that pass the USING qual, with zero constraint on the data being written. P0 anti-pattern by default. Wave 1G (Decision #110) caught this on event_rsvps, event_comments, event_duties. M5 methodology rule.
21. **Migration mirror files must be created in the same turn as MCP apply.** When Claude AI applies a migration via `apply_migration`, the mirror `.sql` file is created immediately with the canonical production version string as the filename prefix (e.g. `20260505161540_wave_7a_...sql`). Claude Code does NOT write migration files for schema applied via MCP — that creates version-string mismatches and duplicate files. The user moves the file into `supabase/migrations/` in the next round-trip.
22. **Never trust Claude Code's "committed and pushed" reports without verification.** Claude Code may report files as committed when they were actually auto-committed by pre-commit hooks with different content, or when the push targeted a different branch than expected. Always verify with `git log --oneline` + `git diff` after any claimed commit.
23. **Always REVOKE from PUBLIC before revoking from a specific role.** Postgres functions default to `EXECUTE` for the `PUBLIC` pseudo-role, which all real roles (anon, authenticated, service_role) inherit. Revoking from a single role does NOT remove inherited PUBLIC access — the role still has EXECUTE through PUBLIC. Wrong (silently no-op): `REVOKE EXECUTE ON FUNCTION foo FROM anon;`. Correct: `REVOKE EXECUTE ON FUNCTION foo FROM PUBLIC; REVOKE EXECUTE ON FUNCTION foo FROM anon;`. Same pattern for tables, sequences, schemas. When auditing, check `information_schema.routine_privileges` for the full grant chain including PUBLIC. Caught on Wave 1 P0 fix (May 5, 2026) when first REVOKE silently no-op'd and the migration transaction rolled back atomically.
24. **When auditing RLS via `pg_class.relrowsecurity`, filter by `relkind='r'`.** Views (`relkind='v'`) inherit RLS from underlying tables; `relrowsecurity=false` on a view is meaningless. Both audits in the May 5 audit-arc surfaced `notifications_queue` as "RLS disabled" — it's a view over `event_notifications` which has full RLS. False positive in two independent audits; use `relkind='r'` filter to avoid the same trap.
25. **PostgREST `.upsert(..., { onConflict: 'col' })` requires a UNIQUE or PK constraint on the named column(s).** A single-column conflict target fails with `42P10: there is no unique or exclusion constraint matching the ON CONFLICT specification` when the table only has a composite UNIQUE/PK. For composite targets, comma-separate every column: `onConflict: 'a,b,c'`. Combine with #18 (NOT NULL validates at INSERT phase even when conflict routes to UPDATE) and you can land two separate-cause PRs against the same upsert line. Caught May 9, 2026 in PR #38 follow-up to PR #37 — `staff_profiles_pkey` is `(user_id, org_id)`, not `(user_id)`. Always cross-check `pg_constraint` for `contype IN ('u','p')` before writing onConflict.
26. **Before shipping a fix PR for a failing operation, replay the failing operation directly via Supabase MCP `execute_sql` with the production payload.** This catches compounding bugs where the first hypothesis is partially right and a second separate-cause bug lurks behind it. PR #37 added a missing column to a payload (real fix for anti-pattern #18) but missed that the same line had a wrong onConflict spec (anti-pattern #25). One MCP replay between the two PRs would have surfaced both at once. Format: `INSERT/UPDATE/UPSERT ... <production payload> ... RETURNING ...;` — the error code (42501, 42P10, 23502, 23505 etc.) names the actual category instantly.

27. **Resolver and composer functions must be pure with injected IO.** Per the wave 4.2-A calendar-as-spine doctrine, `resolveX(anchor, options)` and `composeX(context, slice, overrides)` MUST NOT import the shared Supabase client at the top of the resolver module. Static imports of `'../../supabase'` trigger client init at test load and throw `Missing VITE_SUPABASE_URL...` because Vite's test runner doesn't bind production env vars. Always accept the client via `options.supabase` (required, not defaulted to global). Callers that need the production client (`digestSend`, cron in wave 4.3, UI hooks) import it themselves and pass it through. Composers must also remain side-effect-free — same input + same context + same slice + same overrides produce deeply-equal output. No fabrication: a null `location.name` renders "Location TBD"; a missing coach is omitted (not stamped with placeholder text). Caught when resolving wave 4.2-A-1 fixture-driven snapshot test.

28. **Calendar-anchored briefing kinds dispatch through `RESOLVER_REGISTRY` — not a switch on `state.kind`.** Per wave 4.2-A-8a, `src/lib/engine/resolvers/registry.js` is the single source of truth for resolver+composer mapping per kind. Each entry exposes `{ resolve, compose, anchorFromState, overridesFromState, sendPath }` with optional `blockedReason` class. `sendPath` is the dispatch discriminator: `composerSubmit` (main flow), `digestSend` (separate pipeline), `rsvpNudgeSend` (per-recipient mint short-circuit), `blocked` (cannot send today; throws the entry's `blockedReason`), `legacy` (free-form announcement / custom_message — not in the registry; getDispatchSendPath returns 'legacy' for unknown kinds). Adding a new calendar-anchored kind = one registry entry. Never re-introduce per-kind branching in `composerSubmit.js` or `PreviewPanel.jsx`. UI bridges between resolver context and Body components go through the `useResolverPreview` hook (not `useEffect` chains that mutate state).

29. **Per-recipient token substitution lives in a separate substitute helper, not in compose; renderer reads post-substitution field with fail-loud fallback.** Per wave 4.2-A-8b-b (rsvp) and wave 4.2-A-8c (callup), signed-token URLs are NOT minted in resolver or compose — those are pure. Compose emits LITERAL `{{token_*_url}}` placeholder strings inside a `<kind>_token_placeholders` field on the relevant section. The send pipeline (e.g. `sendRsvpNudge`, `sendAcademyCallupNotice`) calls `substitute<Kind>Tokens(content_sections, tokenMapByPlayer)` between compose and queue: the helper walks sections, replaces `<kind>_token_placeholders` with `<kind>_token_urls` (different field name, NOT in-place mutation of the same field). The atomic renderer reads ONLY `<kind>_token_urls` — if that field is missing, the renderer emits literal `{{token_*_url}}` strings as the href. That fail-loud fallback is the smoke-test signal: if a recipient ever sees an unsubstituted placeholder in a real email, the bug is unmissable instead of silently rendering a broken link. The two field names (placeholders vs urls) prevent accidental "I forgot to substitute" bugs from staying invisible. Per-player tokenMap keying preserved across both rsvp (truly multi-player) and callup (always single-player) for shape symmetry; the substitute helper validates section.player_id is present and throws otherwise. Same admin-BCC override pattern in both: `queueComposedMessages` accepts an `adminSample` override so admin BCC pins to a (typically placeholder-only) body, preventing admin taps from accidentally writing the first family's RSVP or call-up response. **CRITICAL: send helper MUST wrap the raw mint output into the handler URL** (`${HANDLER_BASE}?t=<token>&action=<response>`); returning the raw token from `mintXToken` produces broken `<a href="<raw_token>">` relative-link emails. The wrap belongs in the send helper, NOT in the substitute helper or the renderer (those stay agnostic to URL shape). Adding a new token-bearing kind = add the placeholder/urls field pair + a kind-specific substitute helper + a renderer that reads urls + a send helper that does the URL wrap. Locked instances: `substituteRsvpTokens` + `substituteCallupTokens`.

30. **Edge-function helpers shared with vitest live in two mirrored files, not one canonical file imported across trees.** Per wave 4.3-A, pure logic that needs to run BOTH in the Supabase Edge Function (Deno runtime, deployed standalone) AND under vitest (Node runtime, project-tree imports) lives in two files: `src/lib/cron/briefingCronHelpers.js` (vitest-covered source of truth) and `supabase/functions/<fn>/_helpers.ts` (Deno mirror). The two files are byte-near-identical apart from TS annotations — they MUST stay in sync. Why mirror instead of one canonical import: Supabase Edge Function deploys bundle the function directory only; cross-tree imports from `../../../src/...` are not guaranteed to resolve at deploy time. The pragmatic split keeps the function self-contained while letting vitest cover the logic in Node. Both files carry a header comment pointing at the other and at this anti-pattern. Adding logic to one without the other is the failure mode — vitest passes, deploy succeeds, but production runs different code than tests cover. When changing either file, change both in the same commit. Logic should use only standard ES + Intl (no Node fs, no Deno permissions APIs) so the two files can stay near-identical. Caught when wiring `briefing-auto-draft-tick` in wave 4.3-A.

31. **Edge functions using shared-secret auth must declare `verify_jwt = false` in `supabase/config.toml` AND a vitest assertion enforces the linkage.** Specific rule: if a function in `supabase/functions/*` authenticates via `CRON_SECRET`, URL-param tokens, or any non-JWT shared-secret pattern, the function MUST have a `[functions.<name>] verify_jwt = false` entry in `supabase/config.toml`. The audit test in `src/lib/__tests__/verifyJwtConfigAudit.test.js` enforces this — adding a new shared-secret function without the config entry fails the test. Without the entry, CI (`supabase functions deploy`) defaults to `verify_jwt:true` and the Supabase gateway rejects all invocations with `UNAUTHORIZED_INVALID_JWT_FORMAT` before the function code runs. Three production regressions caught by manual chat-side audits before the audit test landed: PR #48 (briefing-cron-dispatch), PR #51 (briefing-cron-dispatch + rsvp-token-handler redeploy), wave 4.3-E (briefing-auto-draft-tick + callup-token-handler). The audit test detects via grep for `CRON_SECRET`-style env vars, `searchParams.get('t'|'token')`, and `verify_*_token` RPC references — false positive (extra config entry) is preferable to false negative (gateway block).

32. **Migration `DO $$` verification confirms SQL semantics only; never the HTTP gateway path.** New shared-secret edge functions need either a `supabase/config.toml` entry (caught at deploy time by anti-pattern #31's audit test) or a chat-side curl smoke through the gateway (caught at runtime). `config.toml` is the static path; the vitest assertion enforces it deterministically. Migration verification blocks that test SQL roundtrips inside Postgres do NOT prove the HTTP path works. Wave 4.3-D's `DO $$` block confirmed `mint_callup_token` → `verify_callup_token` cycles in-DB but never reached the handler — gateway was silently rejecting until wave 4.3-E added the config entry. The two paths catch different bug classes: SQL-level (DO $$) confirms function bodies are correct; gateway-level (config.toml + audit test, or curl smoke) confirms the request can actually reach the function.

33. **Shared secrets used by edge functions live in `app_secrets`, not `Deno.env`.** Applies to: HMAC signing secrets, Bearer auth shared secrets, JWT signing secrets — any value read by an edge function at runtime that either authenticates the function's caller or signs artifacts the function emits. As of wave 4.3-G, every shared secret in this codebase lives in `app_secrets`: `rsvp_token_secret` (parent RSVP token HMAC), `callup_token_secret` (callup token HMAC), `cron_secret` (Bearer auth shared with pg_cron), `supabase_jwt_secret` (Supabase project JWT signing secret used by `briefing-cron-dispatch` to mint user JWTs for impersonated calls into `send-tournament-message`). The token-handler functions (rsvp, callup, unsubscribe) read their secrets via SECURITY DEFINER `verify_*_token` RPCs which internally `SELECT FROM app_secrets`. The two cron-driven functions (`briefing-cron-dispatch`, `briefing-auto-draft-tick`) read at request time via service-role SELECT through a shared `getAppSecret(supabase, name)` helper. Why this matters: rotation is `UPDATE app_secrets SET value = '...', rotated_at = now() WHERE name = '<name>';` — immediate, no dashboard ceremony, no Supabase CLI dependency. Provisioning is doable via MCP `apply_migration` from chat. The audit test in `src/lib/__tests__/verifyJwtConfigAudit.test.js` enforces this: ANY shared-secret function matching `Deno.env.get('*_SECRET')` fails CI. Initial population caveat for secrets that originate outside our control (the Supabase project's JWT secret is one): the value must be read once from the Supabase dashboard (Settings → API → JWT Settings) and inserted via `UPDATE app_secrets SET value = '...' WHERE name = 'supabase_jwt_secret';`; only the initial population requires a dashboard step, not ongoing management. **Exception:** platform-managed webhook signing secrets (e.g., `RESEND_WEBHOOK_SECRET` consumed by `resend-webhook-receiver`) stay in Deno.env because the signing party (Resend / SVIX) manages the key directly via the platform — moving them to app_secrets would create a sync gap. The audit test exempts `resend-webhook-receiver` for this reason. **Architectural seam flagged for future:** the dispatcher mints user JWTs because `send-tournament-message` has `verify_jwt:true`; cleaner long-term refactor is to (a) accept service-role auth in send-tournament-message with explicit `user_id` body param, or (b) bypass it entirely and have the dispatcher write to the comms queue directly. Either eliminates the need for `supabase_jwt_secret` in the dispatcher.

34. **Registry / dispatch-table removals must include caller migration in the same PR.** When removing an entry from `KIND_COMPOSERS`, `RESOLVER_REGISTRY.<kind>`, `SECTION_RENDERERS`, or any similar key-to-handler map, the PR MUST include a grep proving zero callers of that key, OR migrate every caller in the same PR. The failure mode is silent: `compose({kind:'<removed>'})` throws a runtime error that may be swallowed by an upstream try/catch (as it was in `useScheduleChangeAudit:55` and `useTournamentBriefing:86`), leaving an admin-reachable UI flow that appears to succeed (the toast fires from a sibling success path) but performs no work. Wave 4.4-T0d (PR #99) caught this on `schedule_change`: removed from `KIND_COMPOSERS` in Wave 4.2-A-8a, but `scheduleChangeSend.js:67` was never updated. Every admin schedule edit that elected "Notify families" did nothing for ~weeks (verified: 100% of `event_change_audit` rows had `dispatch_email_id IS NULL`). Pre-flight grep is mandatory before the removal PR opens: `grep -rn "compose({\\s*kind:\\s*['\"]<kind>['\"]" src/` plus the registry-keyed equivalent. If any non-test callers remain, either include them in the same PR or block the removal. Same rule applies to `RESOLVER_REGISTRY[<kind>]` deletions and to any future dispatch table introduced under the same pattern.

35. **Branch-divergence pre-flight gate.** Every CC session begins with `git fetch origin && git log --oneline origin/main..HEAD` and `git log --oneline HEAD..origin/main`. If either shows commits, halt and reconcile before any new work. PRE.3 audit (PR #93) caught a v2 branch 516 commits behind main with multiple stale assumptions — the entire chat-side audit chain was operating against a stale snapshot. The rule prevents the next branch-state surprise from corrupting a CC session's mental model of production reality. Pre-flight runs before reading any file, before designing any work — branch state first. Symptoms of skipping: audits citing files that have been deleted, code reviews flagging bugs already fixed, plans built on assumptions about a tree state that no longer matches `origin/main`. Cheap to run (one `git fetch` + two `git log` calls = <2 seconds), pays for itself the first time it surfaces drift.

36. **Destructured defaults on Supabase `.from(...)` / `.rpc(...)` results silently swallow errors.** The pattern `const { data: rows = [] } = await sb.from('foo').select(...).filter(...)` resolves `data` to `null` on ANY error path (column missing, RLS denied, transient DB issue, RPC name typo), and the `= []` default substitutes silently — callers get an empty result with zero diagnostic signal. Wave 5 PR 2 lost three smoke-test cycles to this: a bogus `.is('archived_at', null)` filter on a column that doesn't exist threw at PostgREST, the destructured default substituted `[]` for teams, and the LLM was being told the org has zero teams. Every parsed row came back with team blank → blocked commit → no visible error. PR #179 fixed the filter; this anti-pattern guards the entire failure class. **Correct pattern**: destructure `data` AND `error`; throw or surface `error` before using `data`; keep a `|| []` fallback ONLY for the success-with-zero-rows case (where `data` can still be `null` depending on PostgREST shape). Inline form: `const { data, error } = await sb.from(...)...; if (error) throw error; const rows = data || [];`. Same applies to `.rpc()` calls and to `Promise.all([...])` tuples — check each result's `error` separately. Audit grep: `grep -rEn "\\{\\s*data:\\s*\\w+\\s*=\\s*\\[\\]\\s*\\}" src/ supabase/functions/`. Fix the high-risk callsites (edge functions, cron paths, operator-facing hooks) on contact; leave broad sweep for a separate refactor PR.

37. **Query contract for org-scoped tables: `.eq('org_id', orgId)` MUST come before other filters on every `supabase.from('<org_scoped_table>')` chain.** Tables that carry an `org_id` column (the 39 canonical org-scoped tables — see CLAUDE.md §4-§5 or the audit-day 2026-05-16 final close doc for the list) MUST be filtered by org first, then by other predicates. RLS gates these at the DB layer, but application-layer org_id filtering is defense-in-depth — it prevents accidental cross-org data exposure if RLS ever fails-open and makes intent explicit at the query call site. The morning audit (2026-05-16) caught 5 P1 callsites where org_id was missing or implicit (e.g., `useDigestEvents.js:57` filtering tournaments by `.in('id', tournamentIds)` but assuming the tournament IDs came from an already-org-scoped query — true today, fragile under refactor). Audit grep: `grep -rEn "supabase\\.from\\('(<org_scoped_table>)'\\)" src/` then verify each chain starts with `.eq('org_id', orgId)`. **Exception:** tables that are FK-scoped via parent table RLS (no `org_id` column — `events` via `team_id` → `teams.org_id`, `event_rsvps` via `event_id` → `events`, `team_players` via `team_id` → `teams`, `player_guardians` via `player_id` → `players`, etc.) do NOT need org_id filtering because they don't carry the column — they inherit scope through their FK. Sub-agents frequently miss this distinction and flag FK-scoped tables as "missing org_id" — verify via `information_schema.columns WHERE column_name='org_id'` before flagging. (Anti-pattern caught during morning audit + Phase Beta B1, 2026-05-16.)

38. **Renderer-emit parity: every section kind emitted by a registered resolver MUST have a `SECTION_RENDERERS` handler in `composer.js`, registered in the same PR as the resolver.** When a resolver pushes a new section kind (e.g., `kid_color_pill`, `vip_header`) without a corresponding renderer registration, `renderSections()` silently skips the section and the composer emits an orphan-warning to console (`[engine/composer] No registered renderer for section kind "X"`). In production this manifests as missing email content with no visible error to the admin sending the briefing. The morning audit caught 6 orphan section kinds across `event_card`, `callup_card`, and 4 `tournament_recap` section types that had been silently empty for weeks (#205-#207 closed). **Sequencing inside a single PR matters too:** register renderer in `SECTION_RENDERERS` map FIRST in the commit, then wire resolver emissions. Reverse order means the resolver could be reviewed/cherry-picked separately and produce orphans on landing. Wave 5 PR 5b enforced this discipline inline (renderers + composer registration in same commit as resolver replacing stub). Audit grep: enumerate emitted section kinds across resolvers (`grep -rEn "kind: '[a-z_]+'" src/lib/engine/resolvers/`) and verify each appears in `composer.js` SECTION_RENDERERS. (Anti-pattern caught during morning audit + locked during Phase Gamma 5b, 2026-05-16.)

39. **Position+hedge pattern — when offering position X with defensible alternative Y as a hedge, Y is usually the truer position.** A reasoning failure mode where the author proposes a primary recommendation but immediately offers a counter-alternative as if covering their bets. The hedge is a tell: the author hasn't fully committed to the primary. The alternative is usually what they actually believe but didn't want to commit to alone. Check: when CC or Frank finds themselves writing "I recommend X but Y is also defensible," pause and ask whether Y is the truer position. Often it is. Frank's first instance: Gap 3's 3.11 orphan location_id case ("expand to cover orphan but YAGNI says only what we've seen is defensible too" — the YAGNI alternative was the truer position). CC's instance: Gap 4's Option 3 lean later self-corrected to Option 1 after applying this pattern. Discipline registered Tier 3 P0 resolution, 2026-05-17.

40. **Existing-infra hedge — when proposing dedicated approach with "or reuse existing infrastructure" as fallback, the dedicated approach is usually the right contract.** Variant of #39. The hedge ("we could just reuse `useActivities` and filter client-side") covers for incomplete architectural commitment. The existing infrastructure happens to return similar data, but its CONTRACT was shaped for a different purpose (UI display vs alert evaluation). Reusing it couples non-UI logic to UI hooks, creating refactor pressure later. Check: would you choose the dedicated approach if the existing infra didn't exist? If yes, choose it regardless of the existing infra. Instance: Gap 5 hybrid framing where CC proposed dedicated alert queries OR reuse of `useActivities` depending on Gap 8 — Frank pushed back, dedicated queries shipped regardless. The 2 alerts (`location_unassigned`, `data_integrity_event_location_missing`) get their own query contracts. Discipline registered Tier 3 P0 resolution, 2026-05-17.

41. **Routing-signal overshadow — when a message contains both routing signal AND embedded amendments to prior decisions, re-read the message once for routing AND once for state deltas.** Don't process as single-purpose. The routing signal (stop, go, move to next gap) can overshadow the embedded amendments, leaving stale state on the receiving side. Instance: Gap 7's "Locked. Stopping here." message contained (a) routing: stop for the night, (b) state delta: Gap 7 corrected from B to C. CC caught (a), missed (b). Discipline: when a stop/pause/transition message arrives, re-read once for routing AND once for state deltas. Worth explicit pause on transition messages — they're high-bandwidth and easy to skim. Discipline registered Tier 3 P0 resolution, 2026-05-17.

42. **Parallel-system buildup — before designing a new context, hook, or service for an architectural concern, grep the codebase for existing infrastructure that touches the same concern.** If found, ask whether the new code displaces or duplicates the existing system. Building parallel systems creates two sources of truth for the same concept, increases maintenance burden, and creates dead code if the new system fails to displace the existing one. Triggers for this check: spec language naming an architectural concept (e.g., "role context," "permission gating," "notification routing") rather than a concrete component. Architectural concepts almost always have existing infrastructure; concrete components might not. PR 4 origin case (Tier 3 v1): Gap 6's "GitHub model multi-role context" framing should have triggered "does useHomeRole already do this?" Instead, useActiveRole was built parallel (ActiveRoleProvider + useActiveRole + ActiveRoleContext.test) and shipped with zero consumers — useHomeRole was the load-bearing system the whole time, driving HomePage routing with 24h-expiry persistence to user_preferences.role_preferences. PR 6 pre-flight grep caught it; the parallel system was removed in PR #231 (delete ActiveRoleContext.jsx + its test + provider wrap from main.jsx). Detection signal (corollary, not the rule itself): if a hook/context has zero consumers after its introducing PR lands, the next PR surfacing this MUST wire or remove it. Registered 2026-05-17 from PR 6 pre-flight discipline catch.

43. **Cross-role fixes ship with a cross-surface invariant test.** When a fix corrects a value, label, or render that appears on multiple surfaces (Home, Schedule, Records, Teams, per role), the PR includes a test that asserts the invariant holds across all surfaces showing that concept. Pattern: render the surface fixtures with shared test data, assert the rendered output matches. Same shape as PR #234's `timezoneAuditPin.test.js` (static-grep audit catching any future `toLocale*` call without `timeZone` pin) and PR #237's threshold-inclusive boundary test (locking the `<= 72h` semantic at exactly 72h). If the invariant later breaks silently on one surface but not others, the test fails and forces the structural fix rather than a per-surface patch. Origin context: the L99 cross-role audit on 2026-05-18 surfaced 14 distinct bugs grouping into 4 drift classes (data-layer divergence, render-layer divergence, label/semantic divergence, cross-role behavior divergence). Without #43 as load-bearing discipline, cluster fixes ship and drift returns within weeks because new features re-introduce the same divergence patterns. With #43, every cluster fix locks its invariant in a test that survives session boundaries and prevents the next round of audits from rediscovering the same class of bug. The tracking ledger `docs/EMBER_PENDING_LEDGER.md` is the operational home for this discipline — Section 5 (UX patterns needing cross-surface propagation) and Section 14 (helper-extraction backlog) catalog the ongoing surface area. Registered 2026-05-18 from L99 cross-role audit consolidation.

44. **Trace the full state pipeline before ruling out a regression at the gate.** When a behavior looks wrong at a render gate (modal backdrop, loading skeleton, alert filter, conditional render guard), verify the gate's logic AND verify the upstream state that flows into it. A downstream gate can be structurally correct while an upstream hook outputs state that momentarily satisfies the "wrong" branch — and the gate has no way to catch that because the condition is technically met. Diagnostic pattern: when reviewing a gate, do not stop at "the gate logic is correct." Trace every state setter that feeds the gate's condition and assert each setter only fires when its preconditions are met. Pause-points in async chains (useEffect microtask ordering, promise resolution ordering, setState batching, useCallback closure capture) are the common failure surface. Origin case: PR #241 (Cluster 6.A3) closed a latent regression in PR #235 where AlertZone's gate logic was structurally correct (`if (loading && !hasAlerts) → skeleton`), but `useAlertEvaluator` output `(loading=false, alerts=[])` momentarily on initial render before configs were fetched — its empty-configs early return fired with `configs=[]` (the initial useState value) before the configs fetch resolved, flipping `loading=false` prematurely. AlertZone briefly rendered the green AllClearPill before re-rendering with the real alerts (amber) once configs loaded and evaluate re-fired. The fix lived upstream in the evaluator's state semantics (null sentinel for unfetched configs). CC's L99 D5 diagnostic missed this by stopping at AlertZone gate-logic review; Frank's smoke caught it. Drift-hedge per #43: hook-level loading-state tests that pin the hook mid-flight via paused promise resolvers (`useAlertEvaluator.loadingGate.test.js` is the reference shape). The discipline forward: any "this looks like a regression but the gate is fine" reading triggers an upstream trace before being ruled out. Registered 2026-05-18 from PR #241 origin case.

45. **When adding work to a planning/spec/handoff doc, reconcile EMBER_PENDING_LEDGER §4 in the same PR.** Locked decisions, spec items, audit findings, and queued PRs accumulate across multiple docs — `CUTOVER_WAVE_GAP_AUDIT`, `AUDIT_*`, `CC_SESSION_HANDOFF_*`, `*_DESIGN_SPEC.md`, `STATE_OF_AFFAIRS_L99_*`. Each doc captures its slice. `EMBER_PENDING_LEDGER.md` §4 is the canonical "pending build" view that every new session reads first to plan routing. Failure mode: a PR that adds (or removes, or re-scopes) work in a planning doc but doesn't update the ledger creates silent drift — next session reads the ledger, assumes it's complete, misses the new item. Multiplied across sessions, the ledger silently goes out of sync with the actual pending-work surface. Origin case: 2026-05-18 L99 close. PR #238 created `EMBER_PENDING_LEDGER.md` populated from "what I remember" rather than "what's in the doc set." Same-day follow-up audit (PR #243's commit 1) surfaced ~25+ additional items scattered across docs the ledger didn't reference. PR #242 + PR #243 ship the inventory expansion and this anti-pattern as the meta-fix. Rule: any PR that touches `docs/archive/CUTOVER_WAVE_GAP_AUDIT.md` / `docs/AUDIT_*.md` / `docs/CC_SESSION_HANDOFF_*.md` / `docs/*_DESIGN_SPEC.md` / `docs/STATE_OF_AFFAIRS_L99_*.md` MUST also update `docs/EMBER_PENDING_LEDGER.md` §4 in the same commit. Verification: **`ledger-reconcile-guard` CI check (live as of 2026-06-02)** — `.github/workflows/ci.yml` runs on every PR. Fails the check if any of `docs/AUDIT_*.md`, `docs/*_DESIGN_SPEC.md`, `docs/CC_SESSION_HANDOFF_*.md`, or `docs/STATE_OF_AFFAIRS_L99_*.md` is in the diff AND `docs/EMBER_PENDING_LEDGER.md` is NOT. `docs/archive/*` is exempt (historical, no reconcile needed). Treat the ledger as the canonical surface; planning docs as deep references.

**Practical mechanics:** when a PR touches a planning doc, add the corresponding §4 ledger entry in the SAME commit. The guard fires on the diff between PR base and head, so a fix-up commit on the same branch satisfies it (PR doesn't need to be re-opened). **There is no PR-body exemption mechanism** despite the error message hinting at one — the workflow doesn't parse the body, only the diff. If the ledger touch is genuinely not warranted (rare; usually means the planning-doc change is trivial — typo, link fix), add a one-line §4 reconciliation note saying so. That's cheaper than arguing with the guard.

**Common slip caught by the guard:** CC writes the planning-doc edit, commits, pushes, and only adds the ledger entry under CI pressure when the check red-X's. The right shape is to write the ledger entry FIRST (forces the reconcile in your head), then the planning doc edit, both in one commit. The guard is a backstop, not the routine.

Registered 2026-05-18 from L99 missed-builds audit closure. CI enforcement landed 2026-06-02 (PR #670 was the first time CC observed the guard firing live; chat-CC's silent ledger touch on that PR was the satisfying edit, caught after the merge in the §17.5 audit post-mortem).

46. **Code-only audits miss visual / cross-component rhythm. PRs that touch `*Card.jsx` / `*Row.jsx` / `*Tile.jsx` ship with one of: (a) a cross-surface invariant test, (b) a before/after screenshot, or (c) a typography token reference.** Origin case 2026-05-20: Frank reported "different font size on the upcoming games vs results section" on the Schedule games view. The first audit round read code and saw matching `fontSize: 17` literals after PR #351 — and concluded no divergence. The real divergence was that the past-state `MatchupCard` rendered a 2-line opponent column (opponent on top, date stacked below) while the upcoming state rendered a single line — different ROW HEIGHTS that read as "different font sizes" to a human eye but identical to a code reader. PR #359 follow-up inlined the date and shipped a cross-surface invariant test (`MatchupCardRowRhythm.test.jsx`) that locks: same `fontSize` for the primary signal in both states, same `fontSize` for the team name, and a structural assertion that no nested `<div>` re-introduces a multi-line stack. Discipline forward: any PR touching `*Card`, `*Row`, `*Tile` components includes one of the three guards. The invariant-test path is highest ROI (anti-pattern #43 application — catches regressions automatically in CI). Screenshot path is lowest effort. Token-reference path becomes more valuable once `src/lib/typography.js` exists as a named scale (deferred until divergence keeps recurring). Registered 2026-05-20.

47. **Branch-reset hazard: after a PR merges, switch to main FIRST (`git checkout main && git pull`), THEN branch off. Never `git reset --hard origin/main` on a feature branch with uncommitted or WIP work without stashing first.** Operational rule preventing silent work loss — different anti-pattern class than behavioral patterns that need load testing before promotion. Origin case 2026-05-20 PM: two occurrences in one session where CC ran `git reset --hard origin/main` while still on a feature branch carrying uncommitted edits (admin back-button rollout + program-health metric swap), wiping the WIP both times. Recovery cost was bounded (~5 min × 2) but the failure class is "lose-work-silently" which is the worst kind. The correct sequence after any merge: (1) `git checkout main`, (2) `git pull origin main`, (3) `git checkout -b <new-branch>`. If for any reason `git reset --hard` is needed on a feature branch, run `git stash` first. Promoted from candidate to registered at chat-side pressure-test 2026-05-20 PM — chat-side reasoning: "operational rule that prevents data loss, different anti-pattern class than behavioral question, register now don't wait for third occurrence." Calibration heuristic for promoting future candidates: mechanical operational rules with bounded-recovery-cost-today and worst-case-data-loss-tomorrow get promoted on first occurrence; behavioral patterns that need load testing wait for the third.

48. **PostgREST `.order(col, { foreignTable: 'X' })` applies to embedded subarrays, NOT to top-level parent rows.** Sorting parent result rows by a joined table's column requires JS-side sort after fetch. Two separate hooks (`useTeamGamesByTournament`, `useOrgTeamRecords`) shipped this bug class — both passed `foreignTable: 'events'` to `.order('start_at', ...)` expecting parent-row ordering and got DB insertion order instead. PR #349 and PR #358 both fixed by sorting in JS. Discipline forward: when you need parent rows ordered by a joined table's column, **always sort in JS after fetch** — the `.order` foreignTable hint is at best a no-op safety belt for parent-row sort. Pair with anti-pattern #36 corollary: when destructuring the response, include `error` and check it before trusting `data`. Registered 2026-05-20 PM as a corollary discipline (short entry, not a full anti-pattern per chat-side pressure-test recommendation).

49. **Full-paste discipline for planning/audit/spec/handoff docs.** When CC writes a planning, audit, spec, or handoff doc, the routine is: (a) create the doc, (b) commit + push + open PR per §12 + §15, (c) **paste FULL contents in chat in the same turn**. Plain text only. No triple-backtick wrap around the whole doc. Multi-message splits are allowed only when the doc exceeds single-message capacity. Splits ship in sequential messages within the same turn (not across turns). Header each split: "part N of M". If the doc exceeds reasonable multi-message capacity (>2000 lines), pause and ask claude.ai which sections need review. Never auto-summarize. Never defer the paste. The full doc IS the deliverable. The chat paste IS how claude.ai receives it. "I created the doc" without paste is not delivery. Origin cases: tools-inventory paste round-trip (2026-05-21, fenced and didn't render), Teams audit handoff (2026-05-21, summary-instead-of-full-paste). Widening rationale: original #49 covered "docs intended for claude.ai review" — the amendment widens to "any planning/audit/spec/handoff doc" because the operative question isn't intent but whether the doc will be reviewed at any point. Every audit/spec/handoff eventually needs review; pre-judging which ones need it now produces gaps.

50. **RETIRED 2026-05-28.** Superseded by Frank's line-by-line mandate
post-Wave-1 close. The original AP #50 surface-dependent methodology
(broad codebase → breadth-parallel; narrow surface → line-by-line;
broad surface line-by-line → 40% cascade — don't do this) is retired.

**Standing rule (replaces AP #50):** line-by-line per category,
regardless of surface breadth. §16.15 2-pass deep-read addendum per
category to close the cascade rate inherent to line-by-line at broad
scope. See PLATFORM_PRIORITIES.md §17.3 + §17.8.

Rationale: comfort over velocity. Empirical signal that drove the
retirement — home page LCP regressed to ~5s (vs §17.1 1.5s target)
without the surface methodology catching it because perf was deferred
to Wave 2 RUM-data availability. "Comfort level of clean code in
current state" is the operative criterion before next-phase build
engages, not perf budgets or architectural invariants alone.

Cross-references that previously cited AP #50:
- AP #56, #58, #59 — principles stand (stop-conditions, cross-batch
  synthesis, close-when-exhausted); "narrow-scope" framing was not
  in their active rule language, so no edit needed.
- AP #61 — reworded to drop the "parallel narrow-scope agents per
  AP #50" methodology line; pre-phase audit gate principle remains.

51. **Dead-feature mount retirement.** Surfaces that serve no current Frank workflow get retired, not gated by config. Engine Preview removal (PR #398, 2026-05-20) established the precedent. The gate-by-config pattern produces confusing future-Frank ("why is this here?") and accumulates dead-code mass. Promoted 2026-05-22 after 17+ dead-feature surfaces accumulated; promotion criterion (third NEW surface) overwhelmingly met.

    **Historical cleanup arc** (PRs that applied this AP — retained as a precedent ledger; current state verified per surface):
    - Engine Preview removal — PR #398 (2026-05-20)
    - TeamPlayerStats mount + TeamPlayerStats.jsx + PlayerStatsTable.jsx orphan files — Teams PR C (file-deletion confirmed 2026-06-02)
    - Header bell button — PR #449
    - InstallPrompt + WelcomeOverlay — file-deletion confirmed 2026-06-02 (no longer mounted at HomePage)
    - 8 orphan `SECTION_RENDERERS` entries — Batch 8b
    - `scheduleChange.js` legacy composer — Batch 8b F-7
    - `useSortedPlayers` dead export — Batch 6 P2-2
    - `useComposeBriefing.js` — deleted via PR #462
    - 5 `src/components/event/` orphans — Batch 5 (verify on next touch)
    - `phoenix.webp` — deleted via #631 post-rebrand

    Catalog refresh discipline: when a dead-feature item lands a removal PR, update this list in the same commit (current vs. retired). The 2026-06-02 audit (3B.29.P0-4) caught the "still mounted" specifics had gone stale; the list above was reconciled against actual file existence at that pass.

52. **Worktree-path discipline — agents working in isolated worktrees must
`pwd` confirm before any file write.**

Per anti-pattern #47's calibration framework (bounded recovery cost today,
worst-case data loss tomorrow), this is an operational discipline rule
worth pre-promoting on first occurrence. Recovery from worktree path
confusion is non-trivial (manual file reconciliation, potential lost
commits if mistakes compound). Pre-promotion is justified by the
asymmetric cost structure.

Discipline: every agent prompt that writes files in a worktree-isolated
context MUST include "Confirm with `pwd` first" as an explicit step.
Verification gate: agent reports `pwd` output in its summary; if absent,
the work is suspect.

Origin: 2026-05-21 PR #431 registered #52 as candidate. Pre-promoted to
registered under the cost-asymmetry rationale before second occurrence
to prevent accumulation.

   **Refinement (revised 2026-05-22 PM after empirical investigation):**
   `pwd` confirm is necessary but not sufficient. Edit tool is path-
   honest — it writes to whatever absolute path is given. The failure
   mode is AGENT path construction error: agents intend to edit a file
   in their worktree, construct the absolute path missing the
   `.claude/worktrees/agent-XXX/` prefix, and the edit lands at the
   parent checkout. Agents then check the worktree (which shows
   unchanged) and incorrectly report "silent revert" or "tool defaulted
   to parent."

   Discipline extension: every Edit/Write tool call in a worktree-
   isolated agent MUST construct the absolute path by prepending the
   agent's known worktree prefix (`/home/user/aster-sports/.claude/
   worktrees/agent-XXX/`) to any source-tree path. The prefix must be
   computed at agent session start and applied mechanically, not
   remembered attentionally.

   Empirical evidence (A.4 investigation 2026-05-22):
   - Edit with parent absolute path → modifies parent only (worktree
     unchanged)
   - Edit with worktree absolute path → modifies worktree only (parent
     unchanged)
   - 10-second wait test: no silent revert detected
   - Audit at investigation close: 9 git stashes existed in parent
     checkout, of which 6 are explicitly marked as agent-leakage from
     2026-05-21 and 2026-05-22 sessions. The prose discipline broke
     on its registration day (PR #473) despite explicit prompt
     instructions.

   Origin: 2026-05-21 PR #431 registered #52 as candidate. Initial
   refinement registered 2026-05-22 AM via PR #465. Empirical
   investigation 2026-05-22 PM confirmed the tool is path-honest;
   failure mode is agent input construction. CI gate proposed (see
   companion PR + EMBER_PENDING_LEDGER tracking).

53. **Session-level diff audits after high-output sessions (CANDIDATE —
promote on third instance with stable findings rate).**

After sessions with >15 PRs, dispatch a line-by-line audit of the session's
diffs (not the codebase, not the surfaces). Cost ~45 min agent run, value
is the discipline-validation data point.

Trigger: ≥15 PRs in session.

Promotion: on third instance with findings rate stable at <10% genuine
regression.

First instance: 2026-05-21 session-level audit (10 findings / 33 PRs /
9% genuine regression). Methodology validated: line-by-line at narrow
scope (per anti-pattern #50 refined criteria — AP #50 retired 2026-05-28, methodology cited historically) catches subtle cross-PR
+ diff-shape findings that breadth audits would miss.

54. **Agent prompts mandate same-MCP-burst PR ready-flip + auto-merge
enable.**

Agents creating PRs in draft state without flipping ready in the same
MCP burst as `create_pull_request` leave PRs stranded. GitHub doesn't
auto-merge drafts even when checks pass.

The implicit instruction "flip ready + auto-merge enabled" doesn't hold;
explicit verification step ("do not return success without confirming
PR is ready (not draft)") does.

Discipline: every agent prompt creating PRs MUST include this exact
phrasing as an explicit step:

  "Push + create PR + flip ready + enable auto-merge SQUASH **in the
  same MCP burst as create_pull_request**. Do not return success
  without confirming PR is ready (not draft) — verify via
  mcp__github__pull_request_read after enable_pr_auto_merge."

Origin: PRs #275/#276/#277 (anti-pattern #15 footnote — caught 2026-05-19).
Recurrence: PRs #439, #440, #441 (2026-05-21 — same slip class, same
session). Closure: PR #442 (2026-05-21 — explicit prompt held, PR shipped
ready in same burst).

Promoted 2026-05-22: 21 consecutive same-MCP-burst holds across two
sessions — 2026-05-21 (PRs #444-#457, 14 holds) + 2026-05-22 (PRs
#458-#464, 7 holds). Mechanism reliable, discipline locked.

55. **Agents must use actual PR# from create_pull_request response
    (CANDIDATE — promote on third instance).**

Agents creating PRs in same-MCP-burst order sometimes call
`enable_pr_auto_merge` before `create_pull_request` returns the actual
PR#, then guess at a PR# (which lands on a different PR than intended).
Two recurrences observed in session 2026-05-21:

- PR #446 agent guessed PR#444 before its own PR returned as #446
- PR #453 agent guessed PR#450 before its own PR returned as #453

Both stray calls landed on PRs that auto-merged anyway by design (no
observable harm), but the failure class is "auto-merge enabled on PR
you don't own." If the stray-target PR was held with `do-not-auto-merge`
label, the stray call would have force-shipped it.

Discipline: agent prompts must explicitly say "Use the actual PR number
from the create_pull_request response — do not guess." Enforcement:
`pull_request_read` confirmation after `enable_pr_auto_merge`.

Promotion: third instance with the explicit-prompt discipline still
holding (caught + fixed mid-flight).

Origin: session 2026-05-21 PRs #446 and #453.

56. **RETIRED 2026-05-29.** Superseded by Frank's "remove the capacity
discipline" directive after Wave 2.C close. The original AP #56
"audit cycles need external stop conditions" rule, including the
pre-locked session contract framing (max PRs, hard stop time, design
call moratorium, cluster engagement gate), is retired.

**Standing rule (replaces AP #56):** session continuation is the
operator's call, made in-session at any moment. No pre-locked
contracts. CC dispatches, ships, and continues until Frank signals
stop. The "external stop condition" framing wrongly suggested CC
should pre-design brake points; in practice Frank IS the external
direction, and his real-time signals (next move, "go," "stop,"
routing decisions) replace any pre-locked contract.

Rationale: every prior session where CC invoked AP #56/AP #59 to
close, Frank's actual signal was to continue. The discipline was
applying brakes the operator didn't want applied. Comfort over
velocity remains the §17.8 audit-gate criterion; capacity-pacing
inside a single session is not.

Cross-references that previously cited AP #56:
- AP #59 — also RETIRED in the same PR.
- AP #61 — "Stop conditions per AP #56 + AP #59" line dropped; the
  pre-phase audit gate principle remains.

See §4.AQ for the policy lock + Wave 2.C close.

57. **Supabase default privileges auto-grant EXECUTE to anon despite
    REVOKE FROM PUBLIC (extends anti-pattern #23).**

When creating SECURITY DEFINER functions in a Supabase project,
`REVOKE EXECUTE FROM PUBLIC` alone is INSUFFICIENT to deny anon
execution. Supabase project default privileges auto-grant EXECUTE on
new functions to the `anon` role regardless of PUBLIC grant state. The
discipline extension: also `REVOKE EXECUTE FROM anon` explicitly after
the PUBLIC revoke.

Verification: after CREATE FUNCTION + REVOKE FROM PUBLIC, inspect
`routine_privileges` for the actual grant chain. If `anon` still appears
with EXECUTE, an explicit REVOKE FROM anon is required.

Origin: session 2026-05-21 PR #455 (`assert_org_owns_*` SECDEF helper
library). Initial migration had REVOKE FROM PUBLIC; post-apply privilege
check showed anon retained EXECUTE; explicit REVOKE FROM anon added in
same PR.

Discipline extension: anti-pattern #23's "REVOKE FROM PUBLIC before
role" rule remains correct but isn't sufficient on Supabase. Migration
patterns for new SECDEF functions must include both REVOKE FROM PUBLIC
AND explicit per-role REVOKEs.

Promotion: third Supabase project encountering the same default-privilege
override. Likely promotes quickly because every new SECDEF function
exposes the pattern.

58. **Cross-batch pattern check in audit findings TXT.**

When multi-batch audits run sequentially (or in parallel waves with
findings synthesis between batches), each batch's findings TXT should
include a "cross-batch pattern check" section that compares its findings
against prior batches' findings.

Without synthesis, each batch surfaces its own findings independently,
missing the cumulative signal. With synthesis, cross-cutting patterns
(Pattern ALPHA #36 cascade, Pattern GAMMA #42 helper duplication, Pattern
BETA aria-live, latent timezone bugs) surface as single concerns
affecting multiple surfaces, rather than as N independent surface-specific
findings.

Origin: session 2026-05-21 L99 platform audit Batches 1, 12, 2a, 2b,
3, 4-11. Each batch's findings TXT included a "Pattern continuation from
prior batches" section. Validated across 14 batches — Pattern ALPHA grew
from 7 sites (Batch 1) to 25+ (after Batch 2b) to 55+ (after Batch 3),
and the cumulative signal justified a platform-wide sweep PR + audit
test rather than per-surface fixes.

Discipline: every audit batch's findings TXT includes a
pattern-continuation section referencing prior batches' patterns by name
(ALPHA, BETA, GAMMA, etc.). New patterns get registered with letter
names in the same TXT for downstream batches to reference.

**Promoted 2026-05-25** after third multi-batch audit with synthesis
discipline catching cross-cutting patterns:
- 2026-05-21 L99 platform audit (14 batches): Pattern ALPHA #36 cascade
  grew 7→25+→55+ across batches, justified a platform-wide sweep PR +
  audit test instead of per-surface fixes
- 2026-05-24 AM L99 compose-briefing audit (Batches A-F): PATTERN ALPHA
  (#37 ordering) + PATTERN BETA (auth discipline) registered and locked
  in §4.AF
- 2026-05-24 PM L99 compose-briefing Phase 3 (Batches G/H1/H2/I):
  PATTERN GAMMA candidate (AP #36 destructured-default) evaluated, did
  NOT lock (only 1 real instance survived synthesis after 3 H2 false
  positives); PATTERN ALPHA/BETA reconfirmed as non-recurring. The
  synthesis gate caught a 75% false-positive yield in Batch H2 before
  shipping, validating the "lock only at 3+ real instances post-
  synthesis" heuristic.

59. **RETIRED 2026-05-29.** Superseded by Frank's "remove the capacity
discipline" directive after Wave 2.C close. The original AP #59
"close session when audits run ahead of routing capacity" rule —
along with its 5 indicators (47+ PRs, parallel-agents-faster-than-
readable, no-review-pause, 3+ structural artifacts, take-stock
momentum) and "2-or-more triggers close" threshold — is retired.

**Standing rule (replaces AP #59):** session continuation is the
operator's call. CC does not pre-design session-close conditions or
invoke the indicators as a stop signal. Frank's real-time signals
(next move, "go," "stop," "1," "2," routing decisions) replace any
capacity-pacing heuristic.

Rationale: in every prior session where CC invoked AP #59 to close,
Frank's actual signal was to continue. The discipline applied brakes
the operator didn't want applied. Comfort over velocity remains the
§17.8 audit-gate criterion (it governs whether next-phase build
opens); capacity-pacing inside a single session is not.

Cross-references that previously cited AP #59:
- AP #56 — also RETIRED in the same PR.
- AP #61 — "Stop conditions per AP #56 + AP #59" line dropped; the
  pre-phase audit gate principle remains.

See §4.AQ for the policy lock + Wave 2.C close.

60. **Fact-grounding discipline — no inference where verification is
possible.** (CANDIDATE — promotes to permanent on third observed
instance with stable findings rate.)

Every claim about tool behavior, system state, schema, deployed code, or
user experience must be grounded in a verifiable source. Plausible-
sounding inference from docstrings, defaults, memory, or pattern-
matching is NOT a substitute for verification and compounds confidently-
stated wrong answers across sessions.

The source hierarchy that operationalizes this discipline lives at §11.7
as a permanent doctrine clause (generalized from AP #16.7.1's narrower
SDK case). This AP is the discipline statement that motivates §11.7.

**Tool-maximization sub-rule:** the MCP infrastructure IS the
verification layer. Inference becomes acceptable only after the source
hierarchy is exhausted. Using the tools IS the discipline, not a step
we skip when busy.

**Question-asking sub-rule:** when verification reveals genuine
uncertainty (source doesn't exist, can't be queried, user's report is
ambiguous), ask the user the specific question that would resolve it.
Cost of one clarifying question is bounded; cost of a wrong inference
compounds across sessions.

**Trigger patterns that mean STOP-and-verify:**
- About to write "the tool only does X" / "the system always Y" / "this
  was designed to Z" — what's the verifiable source?
- User pushes back with empirical contradiction ("this used to work,"
  "the bug is real," "you're wrong about that") — that pushback is
  data, not an obstacle. Reframe immediately. Default response: "you're
  right, what changed?" not "the docstring says otherwise."
- I genuinely don't know — say so + name the verification mechanism.

Origin case (2026-05-28): unfounded claims about GitHub MCP webhook
delivery during the L99 cleanup arc — claimed "I'll be notified when
the PR merges" across 7 PRs without verifying; defended the claim with
a docstring read when the user reported two months of working merge
notifications. Correct response on first pushback: treat the empirical
contradiction as authoritative, reframe as a regression, propose
diagnostic instrumentation.

Cross-reference: AP #16.7.1, AP #26, AP #39, AP #40, AP #44.

61. **Pre-phase-cutover audit gate — line-by-line per category before
transition.** (CANDIDATE — promotes to permanent on third observed
instance with stable findings rate.)

Before any phase cutover (cleanup arc → multi-program build,
current-season → next-season rollover, beta → GA), perform a
line-by-line bug + enhancement + redesign-potential review of every
audit category in scope per PLATFORM_PRIORITIES.md §17.5, with a
§16.15 2-pass deep-read addendum per category to close the cascade.

**Required outputs before the phase is "done":**
1. Bug surface (cross-role coverage per AP #43).
2. Enhancement surface (file:line + estimated lift + risk class).
3. Redesign-potential surface (added to the planning layer's backlog).
4. Routing decision (ship-this-phase / next-phase / defer, with
   rationale).

**Methodology:** L99 per §16.15. Line-by-line per category (AP #50
surface-dependent methodology RETIRED 2026-05-28). Cross-batch pattern
check per AP #58 surfaces cross-cutting findings. Audit-gate
enforcement per PLATFORM_PRIORITIES.md §17.8 — all §17.5 categories
close before the phase boundary opens.

Origin case (2026-05-28): the cleanup arc (PRs #543–#550) → multi-
program build cutover is the active phase boundary where this
discipline was first articulated. Wave 1 close (PRs #557–#563) then
surfaced the line-by-line mandate per §17.8.

Cross-reference: AP #43, AP #56, AP #58, AP #59.

62. **Interim workflow cannot be claimed as permanent contract.**
(CANDIDATE — promotes to permanent on third observed instance with
stable findings rate.)

When a regression forces an alternate workflow, that workflow is
INTERIM. It carries an explicit fix-condition or expiration. It does
not calcify into doctrine unless and until the regression is
permanently accepted as not-fixable.

**Trigger:** any time a workflow gets proposed in response to a tool
limitation or regression — STOP. Is the limitation permanent or is it
a regression? If regression, the workflow is interim; name the
expiration.

Origin case (2026-05-28): verify-before-stack proposed as workflow
during the GitHub MCP merge-webhook regression. Must remain framed as
interim until the webhook regression is closed.

63. **PATTERN A — same concept, divergent source/scope across surfaces.**
(Promoted 2026-05-29 from the Category #30 runtime/live-data audit —
7 instances, ≥3 threshold met.)

A metric, label, or status indicator that represents ONE real-world
concept ("is this family owed money?", "what's the final placement?",
"is this player confirmed?") must be computed from ONE source at ONE
scope wherever it renders. When two surfaces (or two cards on one
surface) derive the same concept from different sources or scopes, they
produce contradictory truths that a per-file code read cannot catch —
each callsite is individually correct; the contradiction is emergent.

**This is the dominant platform bug pattern.** Confirmed instances:
- Payment "collection 100%" (season-scoped) vs "overdue $1,275"
  (org-wide all-seasons) on one screen (BUG-1).
- Roster payment dot (legacy `roster_members.payment_status`, stale
  constant) vs financial truth (`family_balances`) (ROSTER-1).
- "Families owing" lane (active-season) vs overdue alert (all-seasons)
  (HOME-2).
- Academy badge (`players.member_type`) vs profile
  (`team_players.roster_type`) (ROSTER-3).
- Records header (hardcoded season literal) vs season-unscoped query
  (SCORE-1).
- Balance math netting (`useSeasonFinancials` payment/refund only) vs
  `family_balances` view (payment/refund/adjustment/fee) (HOME-4).
- Currency format (parent rounds dollars, admin shows cents) (HOME-6).

**Discipline:** before rendering any cross-surface metric, name its
single source + scope. Prefer a shared hook/view as the one source
(e.g. `family_balances` for all "owes money" surfaces; §11.5 ground-
truth tables for the canonical source per question). When scope
legitimately differs (a season % vs an all-time balance), LABEL the
scope on each surface so the two don't read as a contradiction. Lock
with an AP #43 cross-surface invariant test.

**Detection:** Category #30 runtime/live-data audit (render each
surface with production data; cross-check same-concept renders for
source/scope agreement). Cross-reference §11.5 for canonical sources.

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
| What size jersey/shorts is the kid wearing? | `player_equipment` (per player×season×sport) | Canonical home since PR 8 (§4.5 step 8). `roster_members.{jersey_size,shorts_size}` are kept in sync by the `align_player_equipment_from_roster_member` trigger (legacy mirror), but UI reads `player_equipment` |
| What is the kid's payment status for the season? | `financial_accounts` + `financial_transactions` | The legacy `roster_members.payment_status` column was **dropped 2026-06-02** (migration `20260602195535`); the derived value now lives on `player.payment_status` set by `useRoster` from `family_balances` |
| What teams is the current parent's child on? | `current_user_child_team_ids()` | SECURITY DEFINER; do not query underlying tables |
| What players can the current parent see in roster lists? | `current_user_teammate_player_ids()` | SECURITY DEFINER |
| Was the kid eligible for an event on `event_date`? | `roster_members.registered_at` / `left_at` | Date-windowed eligibility for attendance views |
| What's the parent's app context (kids + teams)? | `parent_context_v` view | Single helper used by AuthContext.parentContext |

**Rules:**
- Application code never reads from `roster_members` directly except for historical date windows in the attendance views. (Sizes moved to `player_equipment` in PR 8; the trigger keeps roster_members in sync as a legacy mirror, but new code reads `player_equipment`.)
- RLS policies never reference `roster_members` directly. They go through `current_user_*` helpers.
- New code that needs "is this kid on this team" reads from `team_players`.
- New code that needs "is this kid's parent allowed to see this row" reads from `current_user_teammate_player_ids()` or `current_user_child_team_ids()`.

**Documented exception callers** (Wave 4.8 hygiene PR #124 audit — re-run the grep `grep -rn "from.*roster_members\|\.from('roster_members')" src/` and reconcile against this list when adding a new caller):

| File:line | Exception kind | Rationale |
|---|---|---|
| `src/hooks/useAttendanceData.js:44` | sizes + historical view | jersey_number lookup for the per-player attendance grid; one of the 5 attendance views |
| `src/hooks/useEventRsvpCounts.js:33` | historical window | `left_at IS NULL` is the canonical date-windowed eligibility check (per the table row above) |
| `src/hooks/useRoster.js` | (resolved — sizes migrated) | Sizes now read from `player_equipment` (PR 8, §4.5 step 8), scoped to the team's season. roster_members is still queried here for membership + `jersey_number` + the `teams(season_id)` embed, but NOT for sizes. (Payment status reads `family_balances`, all-seasons, per Cat#30 ROSTER-1.) |
| `src/pages/SeasonRolloverPage.jsx:36` | historical view (season scope) | rollover wizard inherently shows a season's PAST roster, not current team_players state. Nested PostgREST relation `teams(...roster_members(...))` — missed by the L99 audit grep until PR #124 |
| `src/hooks/useSeasonRollover.js:49` | WRITE (not a read) | `.insert()` into roster_members. §11.5 read-restriction doesn't apply; membership writes legitimately go through roster_members |
| `src/components/roster/PlayerRow.jsx:59-62` | (resolved — no longer an exception) | The 6px payment dot now reflects `payment_status` derived from the canonical `family_balances` view (all-seasons) via `useRoster`, not the legacy `roster_members.payment_status`. Kept in this table as a closed-exception note; the legacy column is no longer read by any UI. |

If you add a new caller and it fits an existing exception kind, append it to this table. If it doesn't fit, the migration to team_players (or financial_accounts for payment fields) is the right move.

The two tables are kept in alignment by the trigger added in migration `20260505201932_wave4_roster_alignment_lock`. If they ever diverge, the trigger surfaces it as an INSERT/UPDATE failure rather than as silent UI bugs.

---

## 11.6. TEST FILE CONVENTIONS

| Layer | Path | Glob | Runner |
|---|---|---|---|
| E2E (Playwright) | `e2e/` | `e2e/**/*.spec.js` | `npx playwright test` (CI: `e2e` job) |
| Unit / integration (Vitest) | `src/` | `src/**/*.test.{js,jsx}` | `npm test` (CI: `lint-test-build` job) |

**Don't cross the streams.** A Playwright test landing as `*.test.js` gets picked up by Vitest and fails confusingly (no `page` fixture, no browser). A Vitest test landing in `e2e/` gets picked up by Playwright and fails confusingly (no `describe`/`it`, no jsdom).

The `e2e/` directory is the only place `*.spec.js` files exist; `src/` stays `*.test.js`-only. Both runners run as separate CI jobs in parallel — adding a test in the wrong place doesn't fail the right job, it just doesn't run there at all (silent miss).

Shared fixtures for E2E live in `e2e/_fixtures/` or `e2e/_helpers/` (underscore prefix keeps them out of the Playwright glob). Shared Vitest fixtures follow the existing `src/lib/__tests__/_fixtures.js` pattern.

---

## 11.7. OPERATIONAL DISCIPLINES (PERMANENT — operationalize AP #60 across sessions)

**Source hierarchy** — verify against the closest to ground truth available before claiming behavior. Generalizes the AP #16.7.1 pattern from SDK telemetry to all tool/system/user claims:

1. **Live system state** — Supabase MCP `execute_sql`, GitHub MCP `pull_request_read`, file `Read`, deployed runtime. Highest authority for current behavior.
2. **User's empirical report** — when the user reports observed behavior that contradicts a claim, the user's signal is authoritative. Reframe the model immediately; do not defend the inference.
3. **Installed source / type defs / migration files** — actual code paths, not just docstrings.
4. **Vendor / tool documentation** — only when (1)–(3) are unreachable.
5. **Inference / memory** — only when no verification is possible AND explicitly labeled as such ("I'm inferring because I can't query X").

**Operational rules** — apply to every session:

1. **Auto-merge stays armed on every PR.** Per §15 the default is `enable_pr_auto_merge` in the same MCP burst as `create_pull_request`.
2. **Verify-before-stack INTERIM workflow** during the GitHub MCP merge-webhook regression. Before opening a follow-up PR or stacking new work, `pull_request_read` the prior PR to verify its merge state. This rule expires when the webhook regression is closed (per AP #62).
3. **Source hierarchy applied to every claim.** Source 5 (inference) explicitly labeled.
4. **Pre-phase gate runs before every cutover** per AP #61.
5. **L99 methodology for every code review** — line-by-line per category with §16.15 2-pass deep-read addendum per PLATFORM_PRIORITIES.md §17.3 + §17.8 (AP #50 RETIRED 2026-05-28; surface-dependent methodology dropped).
6. **Cross-role coverage mandatory** on every user-facing surface per AP #43.
7. **Doctrine commits to CLAUDE.md require a fresh-context review pass before merge.** Mechanism: open a new chat session, paste the proposed doctrine artifact, ask for structural critique. The reviewer reads only the artifact, not the drafting conversation. This pattern was empirically validated by the Round 1 → Round 2 → Round 3 iteration on this doctrine (2026-05-28) — each round produced correction the previous round missed.

---

## 11.8. ARCHITECT COLLABORATION RULES (PERMANENT — operator-directed 2026-06-07)

The platform is built across three lanes: **CC** (Claude Code — implementation +
live verification), the **architect** (design lane — design, decisions, fork
ratification), and **Frank** (operator — ratifies + relays between lanes). Rules
for that collaboration:

1. **Every architect-review artifact is a committed plain-text `.txt` in `docs/`
   PLUS a full chat paste — always, no exceptions.** Applies to: gap findings,
   build specs, verification findings, close-out reviews, design-question docs,
   and any handoff intended for the architect's review. Plain text; no
   triple-backtick wrap around the whole doc; never a summary-instead-of-paste;
   never deferred ("I'll write it next"). The doc IS the deliverable; the chat
   paste IS how the architect receives it. This is the explicit architect-scoped
   restatement of §49's full-paste discipline — when in doubt, produce the doc.

2. **Division of labor.** CC verifies against the closest ground truth available
   (file:line, query results, deployed state — the §11.7 / AP#60 source
   hierarchy) and produces the artifact with evidence. The architect frames the
   decisions/forks and reviews. Frank ratifies and relays. CC does NOT settle an
   architectural fork unilaterally — it surfaces evidence + a labeled lean
   (AP#39: commit to the lean), and the architect/Frank decide.

3. **Round-trip is doc-to-doc.** Architect questions arrive as a doc; CC answers
   with an evidence-grounded doc, not inline prose, so the decision record stays
   durable across sessions. Frank's questions for the architect are carried
   verbatim inside CC's doc.

4. **Forks ratified before a phase closes.** A build phase (e.g. "programs") is
   not "closed" until its open architectural forks are ratified via a close-out
   review doc. CC writes the close-out review (audit result + open forks +
   triage); the architect's ratification is the close.

5. **Every session ends with a committed session-handoff `.txt`** that Frank can
   hand straight to the architect — `docs/CC_SESSION_HANDOFF_<date>.txt`. It
   states: what shipped (PRs, one line each), what's in flight / held, the
   decisions awaiting architect ratification, and the next action when those
   land. Plain text + full chat paste + delivered as a file (same discipline as
   the rest of §11.8). Produced when Frank signals session close OR on request —
   the handoff is the relay artifact, so "the session happened" without it is
   not a complete handoff. (Operator-directed 2026-06-07.)

6. **Whenever CC needs an architect DECISION, produce a committed `.txt`
   decision-request doc — never a scattered chat flag.** The doc states, per
   decision: the REQUEST (what is being decided, one line), the CONTEXT/EVIDENCE
   (file:line or query result grounding it), the OPTIONS each with its
   REQUIREMENTS (what that choice entails to build), and CC's labeled LEAN
   (AP#39 — commit to it; the architect/Frank decide). Multiple open decisions
   batch into one `docs/ARCHITECT_DECISION_REQUEST_<date>.txt`. Same delivery as
   the rest of §11.8: committed file + full chat paste + delivered as a file.
   This is the decision-specific restatement of §11.8 rule 1 — it applies to
   DECISIONS the architect must make (forks, rulings, build-or-defer calls), NOT
   to pure verification asks or status recaps (those stay as-is). The point: a
   decision the architect must make is a durable artifact, not a line in chat
   that scrolls away. (Operator-directed 2026-06-09.)

---

## 12. DEVELOPMENT WORKFLOW

```bash
# Resume every session
cd ~/aster-sports && claude

# Branch off main per change (never commit directly to main)
git checkout main && git pull origin main
git checkout -b <type>/<short-description>      # e.g. fix/rsvp-count, chore/repo-tidy
# ... edit, commit ...
git push -u origin <branch>
gh pr create --base main --head <branch> --title "..." --body "..."
# Auto-merges per §15 once CI is green and there are no review comments.

# Wait ~60s for Vercel deploy after merge, test on phone.
```

The v2 → main merge dance from earlier in the project is retired. v2 is gone (May 11, 2026). All work flows through PRs against `main`.

10. **Every Claude Code prompt ends with manual verification steps.** The prompt MUST end with a numbered checklist Frank can walk through in the app (e.g., "1. Log in as admin. 2. Navigate to X. 3. Verify Y renders."). Don't merge a PR to main until the checklist passes.

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

    **Claude Code's responsibility, on every PR, end-to-end:**

    1. **Create the PR** (draft OK as the initial state — keeps the description clean for amendment before the merge fires).
    2. **Immediately after creation, mark the PR ready** (`draft: false` via `update_pull_request`) AND **enable auto-merge** (`enable_pr_auto_merge` with `mergeMethod: SQUASH` for single-commit PRs, `MERGE` for multi-commit). GitHub's native `--auto` flag will then merge automatically the instant the last required check turns green. No human in the loop. No Claude polling.
    3. **If `enable_pr_auto_merge` fails** with `mergeable_state: unstable` ("required checks are failing") **AND** all visible check_runs report `conclusion: success`, the API is reading a stale combined-status. Fallback: wait until check_runs all show `completed` + `success`, then call `merge_pull_request` directly (squash for single-commit). This bypass works when GitHub's combined-status lags behind individual check_runs.
    4. **Frank stays no-touch.** Claude Code drives the entire create → ready → auto-merge → verified-merge cycle in the same session.

    **Mechanism: GitHub's native `--auto` flag (via `enable_pr_auto_merge` MCP, equivalent to `gh pr merge <PR#> --auto --squash --delete-branch`), NOT a background bash wait-loop.** The bash pattern (`until ...; do sleep ...; done; gh pr merge`) races against mid-flight commits — if a reviewer asks for a refinement after the wait-loop is armed but before CI completes, the loop sees the pre-refinement state go green and merges; the new commit gets stranded. GitHub's native `--auto` flag re-evaluates required checks on every push and only merges when all are green simultaneously. See May 13, 2026 race condition (#152) for the lesson source — that PR exists because PR #151's broadening commit got stranded by exactly this race.

    **Anti-pattern caught 2026-05-19 (PRs #275/#276/#277 stuck):** creating a PR as `draft: true` and NOT flipping to ready leaves the PR stranded — GitHub doesn't auto-merge drafts even when required checks pass. The CLAUDE.md spec said "Claude Code marks ready before merging" but Claude Code was leaving every PR as draft and relying on external mechanisms to flip them. Three PRs stacked up "ready but draft + checks-green" before Frank surfaced "275 is still hung up." Discipline lock: step (2) above is mandatory on every PR creation. Marking-ready-+-enable-auto-merge happens in the same MCP burst as `create_pull_request`, not as a deferred step.

    No path-based exceptions. Schema migrations, CLAUDE.md edits, RLS policies, edge function deploys to prod, and financial schemas all auto-merge once CI is green and there are no unresolved review comments — same as any other PR. If Frank wants to hold something for review, use the label or request a reviewer.

    Goal: Frank stays no-touch. Claude Code is responsible for verifying CI green + zero review comments before pressing merge. Anti-pattern #22 still applies — verify the merge with a follow-up `pull_request_read` after.

---

## 13. COMMUNICATIONS ENGINE HTML RULES (Phase 6)

When generating tournament briefing HTML for LeagueApps + email delivery:

1. **Inline-styled only.** No `<style>` blocks. LeagueApps strips them.
2. **Table-based layout.** No `<div>` wrappers in rules sections.
3. **`<span>` + `<br>` for inline content.** Not `<p>` tags inside list rows.
4. **Standard bullets.** Use `&#8226;` not unicode bullets.
5. **Brand colors** (canonical source: `src/lib/engine/colors.js` — per AP #39, live engine is the truer position):
   - Header: dark navy #0f172a (`TEXT_NAVY`) — was #1e3a5f in older docs; reconciled to engine value 2026-06-02
   - Accent: cobalt #4a8fd4 (`COBALT`; NOT old sky blue #29b6f6) — matches org brand_colors + §3/§16.11
   - Accent (eyebrow contrast variant): #2563eb (`COBALT_DEEP`, passes WCAG AA at 4.6:1)
   - Game-day arrival callout: orange #e05c2a
6. **Audience scoping for tournament messages:** scope to `tournament_rosters` table, NOT team roster. Read via `src/lib/tournamentRosters.js` / inline `.from('tournament_rosters')` (there is no `getTournamentRecipients` helper).
7. **Recipient preview before send:** show "Active: X · Futures: Y · Recipients: Z guardians" chip.
8. **Canonical 12 kinds for `comms_messages.kind`** (production `comms_messages_kind_check`, verified 2026-05-29): weekly_digest, schedule_change, game_recap, games_recap, tournament_prelim, tournament_recap, announcement, custom_message, rsvp_nudge, academy_callup_notice, coach_roundup, family_guide. The 7 transitional legacy values have been backfilled and dropped. The table rename (tournament_messages → comms_messages) and enum rename (message_type → kind) shipped in foundation migration `20260508234920_comms_foundation_polymorphic_rename`. (Note: `games_recap` is the plural multi-game digest, distinct from singular `game_recap`.)

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

**Name-text-only fallback (no location row, no street address): GOOGLE search link ONLY.** Never emit an Apple deep link from a bare venue NAME — Apple name-search mis-resolves. Apple requires coords or a street address. The wizard writes `events.location_id` (FK) since the 2026-06-13 locations audit, so the name-only path is legacy/import-residue only.

For tournament events with `tournament.schedule_status='draft'` or null, hide the map UI entirely and render a "Schedule releases Wednesday" placeholder instead. Map appears only after schedule_status advances to preliminary/final/live/complete. This guard applies to EMAIL surfaces too — `composeTournamentPrelim` skips the venue sections for draft/null tournaments (2026-06-13 audit).

**Waze removed entirely 2026-06-13 (operator-directed).** Waze name/address search mis-routed even with verified coords on Frank's device (it sent "East Coast Sports & Fitness" to Rippowam; the verified-coord fix didn't resolve it on-device either), so `getDirectionUrls` was cut to `{ google, apple }` and the Waze button dropped from the event detail Location tab. The event detail Location tab now renders an Apple/Google two-way stack from `getDirectionUrls`, subject to the name-text-only rule above.

---

## 16. ELITE DESIGN PRINCIPLES (LOCKED APRIL 26, 2026)

### 16.1 Optimistic UI everywhere — but scope-aware

Per-row writes (RSVPs, rides, duties, score entry one-game-at-a-time) ship optimistic. Bulk operations (TourneyMachine paste import, batch admin actions) stay pessimistic with confirm-after-validate. Cascading admin time-edits (event time change → cascades to RSVPs/rides/duties/notifications) stay pessimistic.

Microcopy on rollback: "Looks like that didn't go through. Try again?"

### 16.2 Density (home-level, 2-state)

Density is a single home-level setting (`minimal` | `maximum`) stored in `user_preferences.card_density` and applied uniformly to all home cards. It governs card verbosity only and never gates whether a Needs-you item appears. Per-section density scoping is retired.

**Ratified by Frank 2026-06-05** (home-redesign GO packet) — supersedes both the prior 3-level (MIN/MED/MAX) locked decision and the per-section (NowSection-scoped) model. The `useDensity` hook is 2-state (`minimal`/`maximum`); the dead `medium`/3-level references in `DensityToggle.jsx` were removed in the same change. `card_density` stays the JSONB storage (one home/default key now, not a per-section map). No migration.

History: density was scoped from "everywhere" → NowSection (Apr 30, 2026, IA Map v1, Decision 2) → home-level 2-state (Jun 5, 2026). The per-section storage map reached 1 of ~9 candidate surfaces before the home redesign collapsed it to one home-level control.

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

**Stream B: RSVP nudges** (the team is short on confirmed players)
- **Trigger (operator-locked 2026-06-05):** an upcoming game with **fewer than N
  confirmed "going" RSVPs** drafts a nudge, where **N is org-configurable via
  `organizations.auto_notifications.rsvp_min_going`, default 5** ("you need 5 to
  field a game"). This replaced the prior `<70%`-of-active-roster coverage model.
- **Auto-DRAFT into the Radar only** — admin reviews + sends. NOTHING auto-fires
  to families (deliberate: avoid flooding parents).
- Nudge targets the kids who haven't confirmed going (non-responders / not-going).
- Event-proximity window: games starting within the next **48h** of now
  (`handleRsvpLowGoing`). **Operator-widened 2026-06-05 from 24h to 48h** — more
  lead time to rally players for a short-rostered game (resolves the prior open
  FLAG). The window bound is `RSVP_NUDGE_WINDOW_HOURS` in the AP #30 mirror pair.
- Threshold + going-floor + window decisions live in the AP #30 mirror pair
  `src/lib/cron/rsvpNudgeThreshold.js` ↔
  `supabase/functions/briefing-auto-draft-tick/_rsvpNudgeThreshold.ts`; the IO
  handler is `briefing-auto-draft-tick/_handlers.ts:handleRsvpLowGoing` (the DB
  trigger_event value stays `rsvp_low_24h_before`). Operator control surfaces in
  `AutoNotificationSettingsForm` (a 3-control FullScreenForm at `/admin/settings`
  → Communications; Stream B → "Minimum confirmed going"). Named `…Form` not
  `…Sheet` per the 2026-06-09 A2 sign-off — AP#15 reserves "Sheet" for 1-2 control
  dialogs, and a 3-control FullScreenForm would contradict that vocabulary.

Both streams run independently. Both are admin-configurable.

**Stream B model RESOLVED 2026-06-05** (was: Wave 3.A #19 P1-1 SPEC-vs-IMPL
drift, flagged 2026-05-29 / restated 2026-06-02). The prior "24-hour
coverage-threshold anchored on event start" impl and the older "T-4h + T-1h
anchored-on-RSVP-lock-deadline" spec are both superseded by the operator's
"fewer than N confirmed going (default 5), auto-DRAFT" decision above. The
Sunday weekly digest remains auto-DRAFT-only (not auto-SEND), unchanged.

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

### 16.7.1 SDK telemetry — two-surface enrichment

Third-party analytics/observability SDKs leak privacy at **two distinct surfaces**:

(a) **What the SDK auto-attaches client-side.** Fixable via SDK config — `property_denylist`, `beforeSend`-style hooks, autocapture flags. Operates on the outbound payload before transport.

(b) **What the vendor enriches server-side at ingest.** Fixable only via the vendor's project-level toggle, pipeline transformation, or upstream proxy. The SDK has no visibility into these fields — they're appended after the SDK's payload arrives.

**SDK-side filters cannot strip server-enriched fields.** Assuming they can ships a no-op as a privacy fix. Audit both surfaces on every SDK wire-up.

**Source hierarchy for SDK mechanism verification:** (1) official vendor docs, (2) installed version's type defs (`node_modules/<sdk>/dist/*.d.ts`), (3) installed source, (4) vendor-staff GitHub comments (with skepticism). **Never** community Q&A as primary source — PostHog's own `docs-search` tool warns against it explicitly. Memory: `verify-sdk-mechanism-against-installed-source` (2026-05-13).

#### Current state — PostHog (project 421610, posthog-js@1.373.4)

- **SDK auto-capture (resolved 2026-05-13):** Non-geo fields (URL, path, UA, device, viewport, UTM, click IDs, plus `$initial_` mirrors) stripped via `property_denylist` in `src/lib/posthog.js`. Geo properties intentionally NOT in the list — they're server-enriched.
- **Server-side GeoIP enrichment (unresolved):** `$geoip_*` + `$initial_geoip_*` (city, lat/long, postal, timezone, NY subdivision — ~30 fields total) attach to every person profile at ingest. Canonical fix per PostHog staff is disabling the GeoIP transformation at `/pipeline/transformations`; not findable on our tier as of 2026-05-13. **Help desk ticket pending.** Until resolved, authenticated parent geo persists on PostHog's servers — accessible only to PostHog admins of project 421610.
- **Historical cleanup (skipped):** Without server-side enrichment disabled, re-login re-enriches; cleanup would be undone. Will run alongside the help desk fix when it lands.

#### Current state — Sentry (project javascript-react, @sentry/react v8+)

- **Server-side IP/geo enrichment (resolved 2026-05-13):** "Prevent Storing of IP Addresses" toggle at `/settings/projects/javascript-react/security-and-privacy/` flipped. Available on all plans.
- **Defensive in-code (no-op today, armed for future):** `beforeSend` in `src/lib/sentry.js` strips `event.user.geo` and `event.user.ip_address`. Sentry enriches these at ingest, after `beforeSend` runs in our default config (`sendDefaultPii: false`), so the strip is a no-op today. Activates if anyone later flips `sendDefaultPii: true` — at which point the SDK attaches IP/geo client-side and the strip catches them pre-transport.

#### Three corrections caught this session (2026-05-13)

Each caught by first-party verification, not reviewer framing:

1. Initial spec: SDK-side `property_denylist` on `$geoip_*` — caught by source-grep against `node_modules/posthog-js`. Those fields are server-enriched; the denylist runs pre-transport; would have shipped a no-op as a privacy fix.
2. Second spec: PostHog "Discard client IPs and GeoIP data" project toggle — caught by `docs-search`. Real label is "Discard client IP data" (no GeoIP in label); per docs, the toggle only discards raw IP after enrichment runs.
3. Third spec: `$geoip_disable` super-property on `posthog-js` — caught by `docs-search`. Documented for server SDKs only (`posthog-node` defaults to it); open bug GH #31154 for alias/merge events on browser SDK (which our `identify` after Supabase auth uses).

The third correction triggered the verification gate that produced the current scope.

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

- Initial bundle: ≤ 350 KB compressed (entry chunk ~115 KB gz as of 2026-06-02 — was ~85 KB gz at PR #150 / 2026-05-13; growth absorbed by registration arc, rebrand consts, and Sentry/PostHog wiring. Re-measure when bundle conversation comes up next.)
- FCP: ≤ 1.5s on 4G
- TTI: ≤ 2.5s on 4G
- 60fps scrolling on iPhone 11
- Long lists (>30 items) must virtualize

### 16.10.1 ErrorBoundary exemption from bundle-budget lazy-load discipline

ErrorBoundary (`src/components/ErrorBoundary.jsx`) is the last-resort
error capture for the app. It uses a STATIC `import * as Sentry from
'@sentry/react'` import despite §16.10's lazy-load preference for
third-party SDKs.

Rationale: lazy-loading Sentry inside `componentDidCatch` means error
capture itself depends on a chunk loading successfully — exactly when
chunk loading may be failing (the typical cause of the error reaching
ErrorBoundary). The failure mode "error happens → ErrorBoundary catches
→ tries to lazy-load Sentry to report → lazy-load fails because of the
same network issue → Sentry never reports" makes the bundle savings
worthless and loses observability of the most-important error class.

Discipline: ErrorBoundary is the documented exception. Other Sentry
consumers (AuthContext SDK identify, etc.) continue to lazy-load via
`requestIdleCallback` per §16.10. Adding a second exception requires
the same fail-loud reliability rationale.

Bundle cost: ~80KB chunk space, one-time at app load. Acceptable
trade-off for last-resort error capture reliability.

### 16.11 First impressions

- Login: platform default brand (navy header #151525 + gold accent #C9952E), constellation-arrow mark. Tenant colors like LH cobalt #4a8fd4 apply at runtime AFTER login, never on the login screen. (phoenix.webp was deleted post-rebrand per AP #51.)
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

### 16.14 Detail page pattern — hero + section-summary collapsibles

Locked 2026-05-20 from the L99 event detail redesign (PRs #392 / #393 / #394).
Frank-flagged that event detail had grown to ~3200px of always-on chrome on
a 14-kid game day (auto-expanded ArrivalBoard alone was ~1500px).

**The rule:** detail pages — event, tournament, team, player, location —
use a single hero card at the top + collapsible sections for everything
else. Avoid mid-page always-on chrome.

**Hero card contract:**
1. **Title + primary metadata** — venue, opponent, date, time, arrival on
   one card.
2. **State summary at a glance** — RSVP progress bar, score line, or
   equivalent. The user sees state without expanding anything.
3. **Per-role action stack** — buttons for the 1-2 actions the user
   in this role / event-type / time-window most needs.
4. **Cancelled / past / draft variants** rendered as in-place treatments
   on the hero (red border, score line, "schedule pending" subtitle), not
   as separate strips floating above or below.

**Collapsible contract for everything else:**
1. **Closed by default** unless context demands otherwise (game-day +
   parking notes is the documented exception per Q3 sub).
2. **Section header shows summary text** so users can read state
   without expanding (e.g., `RSVPs · 11/13 going · 2 out`).
3. **Compact summary on iPhone** via `matchMedia (max-width: 414px)`
   when full text wraps awkwardly.

**Anti-patterns (don't do these on a detail page):**
- Floating destructive button at page bottom (Cancel/Delete go in
  header overflow menu).
- Auto-expand based on time window alone (the L99 ArrivalBoard
  auto-expand was the worst offender — coach taps to open).
- Two different surfaces showing the same data (RsvpSummaryBlock +
  EventRosterLockCard both showed RSVP counts; consolidated into hero).
- Diagnostic copy visible to parents that they can't act on (per
  anti-pattern #45 follow-up + PR #387's "No guardians linked").

When building a new detail page, the hero exists before the first
collapsible. When refactoring an old one, find the floating chrome
first.

### 16.15 L99 redesign template

L99 page/surface redesigns follow a canonical methodology before any
PR A code lands:

(a) Initial audit pass — file-by-file code-level read of the full
    mount tree, screenshots if available, findings catalogued by
    severity (P0/P1/P2/P3) with file:line references.

(b) Deep-read addendum — second pass across the full mount tree
    catching what the initial pass missed. Cascade pattern originally
    observed under the AP #50 candidate (retired 2026-05-28): ~40%
    miss rate without the addendum.

(c) Anti-pattern catalog cross-reference — every finding tagged
    against the registered anti-patterns in §11. Surfaces "patterns
    we already have rules for" vs. "new pattern surfacing here."

(d) Per-role wireframes — for any surface that renders different
    UX per role (parent / coach / admin / view-as), wireframes
    drawn for each variant before PR A scope locks.

(e) Explicit out-of-scope list — what this redesign does NOT touch
    so the deferred surface area is visible.

All five elements ship in the audit doc before any PR A code lands.
The audit doc is the canonical artifact; the PR sequence implements
the locked decisions.

Reference instances: L99 event detail redesign (PRs #392/#393/#394,
2026-05-19), L99 Teams audit (PR #408, 2026-05-21), L99 platform-wide
audit (PR #409, 2026-05-21).

### 16.16 Two-bucket config doctrine — consumption is the gate, not the schema

Locked 2026-06-09 from the S3 → S4/S5 settings spend. A populated config
table is NOT a wired config table: a redesign can orphan its config
substrate silently (the shell-contract-v2 Home retired
`dashboard_section_visibility` + `quick_actions_config` without dropping
them; `circuit_rules` / `division_fees` were specced for editors nothing
reads).

**The rule:** build a settings editor for a value ONLY when —
  (a) **read-now** — a shipped surface (app hook/page OR edge function)
      reads that value today, OR
  (b) **multi-tenant onboarding** genuinely needs it (different orgs
      customizing the same surface).
Everything else stays **hardcoded and dormant**. "Config-driven" is a
multi-tenant *feature*, not a default — it earns its keep when many orgs
customize, not for a single-org pilot with one good hardcoded surface.
Do NOT ship a writer for config nothing reads (repeats the DR-1
dead-control trap).

**Mandatory Step-0 before any settings surface is specced or built:** grep
`src/` AND `supabase/functions/` for the table name / jsonb key and confirm
a shipped surface READS it. If nothing reads it → STOP, report (S3-class),
descope or schedule a consumer first. Prefer a one-time **batch**
consumption audit over per-surface Step-0 checks when multiple surfaces are
queued — one round-trip, durable artifact (the reference instance:
`docs/SETTINGS_CONSUMPTION_AUDIT_2026-06-09.txt`, which triaged S4–S9 in a
single pass and collapsed the active pilot settings set to S1/S2/S7/S9).

**Reconcile relics in-schema, don't just leave them:** orphaned config gets
a `COMMENT ON TABLE ... IS 'DEPRECATED: …'` tag + a row in
`docs/DEPRECATIONS_REGISTRY.md` so discovery + grep surface the warning
automatically. Do NOT drop a relic table without a fresh grep proving zero
references (a Phase-4 reseed may reuse it). Reference: migration
`20260609225312_deprecate_unwired_config_relics`.
