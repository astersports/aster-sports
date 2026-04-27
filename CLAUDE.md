# SKYFIRE PLATFORM — CLAUDE.md
> Single source of truth for all Claude Code sessions.
> Place at project root: `~/legacy-hoopers-app/CLAUDE.md`
> Branch: `v2` (clean rebuild) — prototype preserved on `main`
> Last updated: April 20, 2026

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
| Team | Color |
|---|---|
| 11U Girls | `#7C3AED` |
| 10U Black | `#18181B` |
| 10U Blue | `#2563EB` |
| 9U Boys | `#DC2626` |
| 8U Boys | `#EA580C` |

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

## 5. DATABASE SCHEMA (v2 — 38 Migrations applied as of April 26, 2026)

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
| 2-B | Schedule + weather + density | ⚠ PARTIAL — schedule + density done; weather not wired |
| 2-C | Activity CRUD wizard | ✅ DONE |
| 2-D | RSVP + event detail + check-in | ✅ DONE |
| 2-D2 | Ride board + duties + comments | ✅ DONE |
| 2-D3 | Game day checklist + running late | |
| 2-E | Availability heatmap | |
| 3-A | Location + opponent mgr | ⚠ PARTIAL — locations seeded (9 venues), no mgmt UI |
| 3-B | Calendar sync + public schedule + QR | |
| 3-C | Home dashboard + inline RSVP | ✅ DONE |
| 4-A | Team chat + announcements | |
| 4-B | Save & Message Team + auto-notifications | |
| 5-A | Quick score entry + records | |
| 5-B | Live scoring interface | |
| 5-C | Player stats + box score | |
| 6-A | Parent onboarding + QR invites | ⚠ PARTIAL — auto-link guardians done; QR invites not |
| 7-A | Financial dashboard | |
| 7-B | Multi-org + season rollover | |
| 7-C | PWA + auth upgrades | ✅ DONE — sw.js, manifest, install prompt, apple-touch-icon |

⬅ NEXT unbuilt items: 2-D3 (game day), 2-E (availability), 3-B (calendar sync), 4-A/B (messaging), 5-A/B/C (scoring), 6-A QR invites, 7-A (finance), 7-B (multi-org). Plus finish partials: 2-B weather, 3-A location mgr UI.

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
| Team | Age | Circuit | Practice | Color | Sort |
|---|---|---|---|---|---|
| 11U Girls | 11U | AAU (Zero Gravity) | Wed, WCC | `#7C3AED` | 1 |
| 10U Black | 10U | AAU (Zero Gravity) | Wed, WCC | `#18181B` | 2 |
| 10U Blue | 10U | League Play | Tue, WCC | `#2563EB` | 3 |
| 9U Boys | 9U | League Play | Tue, WCC | `#DC2626` | 4 |
| 8U Boys | 8U | AAU (Zero Gravity) | Wed, WCC | `#EA580C` | 5 |

### Naming Rules
- Number first: "10U Black" never "Boys 10U Black"
- Records page: ALL CAPS with full gender
- Never "CYO" publicly — always "League Play"
- "Futures Academy" — never "practice roster"
- Sort: oldest to youngest always

### Season
Spring 2026: March 23 – June 14. Grades 2–5.

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
8. **7 message types in `tournament_messages.message_type` ENUM:** preliminary_schedule, final_schedule, rsvp_lock, saturday_night_scenarios, weekend_recap, week_ahead, schedule_change.

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

### 16.2 Density propagates everywhere

Every new list, card, or section component:
- Reads `useDensity(sectionKey)` from `usePreferences` Context
- Renders MIN/MED/MAX variants
- Exposes density chevron via SectionShell.titleAction OR per-card override

**Adaptive density rule (locked):**
- T-4h before any event: that specific card auto-elevates to MAX
- Manual chevron tap overrides adaptive elevation for the rest of the session
- Idle days = user's last manually-set density

**Future enhancement (not in 5E-2d):** Tournament weekends auto-MAX at T-24h instead of T-4h, given parents need lead time for hotels/rides/gear.

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
