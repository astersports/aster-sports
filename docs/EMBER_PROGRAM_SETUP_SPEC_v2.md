# EMBER Program Setup & Registration Spec v2

**Status:** Replaces v1.0, the v1.1 comparison report, and the v1.2 St Pats review. Authored from 54-screenshot LeagueApps teardown + 523 LH registration rows + 195 St Pats rows + L99 audit + 11 design decisions locked across F1-F4 + Path C quality framework.

**Date:** 2026-05-29 · **rev 2.1** (2026-05-29): three microcopy wins folded from the locked HTML mockup + reviewer audit incorporated (ledger §4.BC).
**Author:** Claude (chat) + Frank Samaritano
**Pilot org:** Legacy Hoopers (permanent free through 2027)
**Second tenant:** St Patrick's CYO Armonk, planned 2027-28

**Quality bar (Path C):** Parent-facing surfaces (§2, §5, §6, §7, §8) ship at 10/10 — full state matrices, signature moments, micro-interactions, voice, edge cases. Admin-facing surfaces (§3, §9) ship at MVP quality — happy path + critical states, polish in dedicated pass post-pilot.

---

## Table of contents

1. [Product thesis](#1-product-thesis)
2. [Identity & multi-org family experience](#2-identity--multi-org-family-experience) — 10/10
3. [Admin program-setup wizard](#3-admin-program-setup-wizard) — MVP
4. [Multi-tenant multisport data model](#4-multi-tenant-multisport-data-model)
5. [Public parent registration flow](#5-public-parent-registration-flow) — 10/10
6. [Family Home](#6-family-home) — 10/10
7. [Communication integration](#7-communication-integration) — 10/10
8. [Payment Lifecycle UI](#8-payment-lifecycle-ui) — 10/10
9. [Admin season detail](#9-admin-season-detail) — MVP
10. [Design system references](#10-design-system-references)
11. [Out of scope for v2](#11-out-of-scope-for-v2)
12. [Open questions resolved](#12-open-questions-resolved)

---

## 1. Product thesis

LeagueApps is brutal to administer. Admins sit through a 4-hour training to stand up a season. TeamSnap retains parents on schedule and photos but has no registration. GameChanger retains parents on stats but is one feature deep. SportsEngine retains nobody because everything feels 2014.

Ember's wedge is two-sided:

**Admin side:** Open a season, divisions, and registration in under 2 minutes on a phone with zero training. Match LeagueApps capability that matters. Cut complexity everywhere else.

**Parent side:** One identity, all kids, all orgs, one home. Conflict resolution that no other app in the category can do because they're each siloed per org. The reason parents never want to leave: nothing else gives them the cross-org view of their actual life.

The technical bet is that **global identity at the parent layer** plus **org-scoped operations at the admin layer** creates a defensible product that absorbs the work currently scattered across LeagueApps + TeamSnap + GameChanger + Google Calendar + Mailchimp + Stripe Dashboard.

The business bet is that the operator who spends 4-8 hours a week writing parent briefings manually (Frank, today) becomes the customer who pays $99-$249/month to get those hours back. Pricing tiers: Starter $39, Growth $99, Pro $249. LH pilot is permanent-free through 2027 in exchange for being the design partner.

---

## 2. Identity & multi-org family experience

**Quality bar: 10/10.** This is the surface that creates the moat.

### 2.1 Identity model

One Ember identity per email. Global, not org-scoped. The `user_roles` table is one row per `(user_id, org_id)` pair — schema already supports it.

```
auth.users (Supabase)
  └─ user_roles (user_id, org_id, role)  ← many rows per user when multi-org
      └─ organizations (org_id)
```

`fsamaritano@gmail.com` has one identity. Three kids: Milo (8U at LH), Charlie (11U at LH, also 4G at St Pats), Rowan (7G at St Pats). When St Pats onboards in 2027, Frank's `user_roles` gets a second row. No new account.

### 2.2 The three-stage brand experience

Updates `EMBER_TENANCY_ARCHITECTURE_v3.md` Section 1 (Brand model). Previously two stages, now three:

| Stage | When | Branding | Surface |
|---|---|---|---|
| **0 — Family** | User has roles in 2+ orgs, viewing Family Home | Ember default (Phoenix + gold, navy backdrop) | Family Home, global Messages, cross-org Schedule |
| **1 — Pre-auth** | Not signed in | Ember default | Login page |
| **2 — Org-scoped** | User has drilled into a specific org's content | Org's brand (cobalt for LH, future for St Pats) | Team detail, event detail, org-specific schedules, payments |

The flip from Stage 0 to Stage 2 happens when the parent taps into a specific org's content (a kid's team page, an event from that org, the Billing detail for that org). Phoenix + gold for the family-level view, org colors for the org-level view. Single-org parents see Stage 2 only (Family Home picks up their one org's branding because there's no ambiguity).

### 2.3 AuthContext logic changes

Today: load 1 org row, apply branding.

v2: load all `user_roles` for `auth.uid()`. Branch on count:

```
if (orgs.length === 1) {
  // Single-org parent. Existing behavior.
  applyBranding(orgs[0].brand_colors)
  route('/home')  // org-branded home
} else {
  // Multi-org parent.
  // No branding applied (Ember defaults active).
  route('/family')  // Family Home, Ember-branded
}
```

### 2.4 Cross-org data federation

The `useUnifiedParentActivities` hook (specced in prior chats, exists in production for single-org multi-kid) extends to query across all orgs the user has roles in:

```sql
SELECT * FROM events
WHERE team_id IN (
  SELECT team_id FROM team_players WHERE player_id IN (
    SELECT player_id FROM player_guardians WHERE guardian_id = current_guardian_id()
  )
)
-- No org_id filter at this query layer. RLS handles per-org access enforcement.
ORDER BY start_at ASC
```

RLS policy on `events` table is already org-scoped via `current_user_org_ids()` (plural — small change from existing `current_user_org_id()`). This is the only RLS change required.

### 2.5 Edge cases

- **User has roles in 0 orgs.** Just signed up, hasn't been invited to any org yet. Lands on `/onboarding` with "Your invite is on the way" copy. Polled every 30s for new role assignment. Once one appears, auto-redirect.
- **User has 1 role and it's revoked.** Sign out automatically with toast: "Your access to Legacy Hoopers was removed. Contact your admin if this is an error."
- **User has 2 roles and 1 is revoked.** Family Home updates in next query cycle (~30s) to show only remaining org. No interruption.
- **Multi-org user with 0 kids in any org.** Family Home shows "Add your first child" CTA (parent app shouldn't be the place for orgs without family).

### 2.6 Signature moment

The signature moment of this layer is invisible: **the parent never thinks about "which app" they're in.** It's just "Ember." That's the foundation everything else builds on.

---

## 3. Admin program-setup wizard

**Quality bar: MVP.** Polish post-pilot.

### 3.1 Entry & flow

From Admin Home: single CTA `+ New program`. First screen is the program-type picker (resolves F5 Q3 — `program` is top-level, `season` is one type of program).

```
What are you setting up?

  [ Season ]      Recurring practices + games + tournaments
  [ Tryouts ]     Date-based evaluation, feeds a season
  [ Camp ]        Multi-day skills program, often co-ed
  [ Interest list ]  Lead capture before registration opens (deferred to Phase 6)
```

Seasons get the 5-step flow from v1.0. Tryouts and Camps get 3-step flows.

### 3.2 Season wizard (5 steps, ~90s with Copy-from-prior)

| Step | Decisions | Defaults | Time |
|---|---|---|---|
| 1. Sport + dates | Sport (chips), name, start/end | Sport pre-picked to org primary; name auto from dates | 20s |
| 2. Divisions | Add divisions OR Copy from prior season | Copy-prior unlocks if a prior season exists | 30s |
| 3. Fees | Base fee, per-division override, line-item add-ons, payment plan | Last season's fee pre-filled, 3-installment plan default ON | 15s |
| 4. Registration window | Opens, closes, public URL slug, early-bird | Opens = today+14d, closes = season start - 7d, slug auto-from name | 10s |
| 5. Review & launch | Visual review, launch CTA | All defaults locked unless admin edited | 15s |

Per-division gender picker (Q1 resolution): Season picker shows **M / F only**. Camp picker shows **Co-Ed (default), M, F**. Tryout picker shows **M / F only** (tryouts feed seasons).

### 3.3 Camp wizard (3 steps)

| Step | Decisions | Defaults |
|---|---|---|
| 1. Camp basics | Name, sport, dates, location, gender (Co-Ed default) | Co-Ed default per Q1 |
| 2. Sessions + capacity | Daily start/end times, days per week, max capacity per session | Single-session default |
| 3. Pricing + launch | Per-session or full-camp fee, registration window | Full-camp price, registration opens immediately |

### 3.4 Tryout wizard (3 steps)

| Step | Decisions | Defaults |
|---|---|---|
| 1. Tryout basics | Name, sport, dates, location, gender, **which season this feeds** | Linked season required (drives Promote-to-Season flow) |
| 2. Capacity + fee | Max per date, $25-100 typical fee | $25 default |
| 3. Custom questions | "Will attend optional 2nd tryout?", "AAU membership held?" | Both pre-loaded as Safety Block extensions |

### 3.5 Critical states (MVP requirement)

- **Loading:** Skeleton screens for division list, fee preview
- **Empty:** "No prior seasons to copy" → admin proceeds with manual setup
- **Error:** URL slug collision with another program in same org → inline cobalt error, suggested alternative
- **Save as draft:** Auto-save every 30s to `program_drafts` table, resume on next visit (Path C polish-pass item, not MVP)

### 3.6 Polish-pass scope (deferred)

- Real-time diff preview on Copy-from-prior
- Inline validation as admin types (date sanity, capacity vs roster size)
- Resume-from-draft UX
- Onboarding tooltips for first-time admins

---

## 4. Multi-tenant multisport data model

Final reconciled schema. Folds v1.0 + v1.1 + v1.2 + F1-F4 decisions.

### 4.1 Table relationships

```
organizations (org_id PK)
  ├─ family_cap_policy JSONB             ← F4 D6: per-org family pricing
  ├─ acceptable_age_range INT4RANGE      ← St Pats 8-18, LH 4-14
  └─ sports (sport_id, org_id)
      └─ programs (program_id, org_id, sport_id, program_type, parent_program_id NULLABLE)
          ├─ program_type ENUM('season','tryout','camp','clinic','interest_list','evaluation')
          │   └─ v1 ships 3: season, tryout, camp. Others deferred.
          ├─ divisions (only when program_type='season')
          │   ├─ division_fees (line items)
          │   │   ├─ fee_type ENUM('base','add_on','discount','early_bird','prorated','family_discount')
          │   │   └─ auto_apply_rule JSONB    ← F1.v1.2: address-based geo rules
          │   └─ teams (team_id, division_id)
          ├─ registrations (registration_id, program_id, player_id)
          │   ├─ team_id NULLABLE                ← Unallocated until placed
          │   ├─ registration_tier ENUM('full_roster','practice_roster','practice_player')
          │   ├─ waitlist_state ENUM('none','on_list','promoted_credit','promoted_pay','refund_released')
          │   ├─ promoted_from_registration_id NULLABLE   ← tryout → season link
          │   ├─ status ENUM('pending','confirmed','waitlist','cancelled','payment_overdue')
          │   ├─ sms_opt_in_p1 / sms_opt_in_p2 BOOL
          │   ├─ emergency_contact_name/phone/relationship
          │   ├─ secondary_contact_name/phone
          │   ├─ medical_notes TEXT
          │   ├─ conduct_acknowledged_at TIMESTAMPTZ
          │   └─ custom_responses JSONB        ← St Pats CCD, AAU membership, etc.
          ├─ registration_fees (registration_id, fee_id, amount_cents)
          ├─ payment_plans (registration_id, schedule)
          ├─ tryout_sessions (program_id, datetime, capacity)
          └─ tryout_attendees (registration_id, session_id, evaluation_note)
players
  ├─ grade_school_year INT
  ├─ school TEXT
  ├─ aau_member_id TEXT NULLABLE
  └─ can_have_own_account BOOL (computed, age >= 13)
player_equipment (player_id, season_id, sport_id)
  └─ jersey_size, shorts_size, jersey_number, status
```

### 4.2 Critical decisions baked into the schema

| Decision | Resolution | Schema reflection |
|---|---|---|
| F5 Q1 — Co-Ed | Camps only, not seasons | Gender column on `divisions` enforces M/F. Camps store gender on `programs` row directly with Co-Ed allowed. |
| F5 Q2 — Required fields | Per-program forms with Safety Block | `programs.form_template JSONB`. Safety Block is a copyable template, not an inheritance chain. Inheritance deferred to Phase 6. |
| F5 Q3 — Programs as top | `programs` parent of divisions | `seasons` table retired as a top-level entity. Becomes a backwards-compat view: `CREATE VIEW seasons AS SELECT * FROM programs WHERE program_type='season'`. |
| F1.v1.1 — `program_type` | 6 values defined, 3 ship in v1 | ENUM has all 6; UI exposes only season/tryout/camp. clinic/interest_list/evaluation are valid in schema but hidden in UI. |
| F1.v1.1 — `registration_tier` | 3 ship in v1 | `full_roster | practice_roster | practice_player`. `call_up` removed (it's a roster action, not a reg tier). |
| F1.v1.2 — Family-cap | Per-org JSONB policy, applied at checkout | `organizations.family_cap_policy JSONB`. Computed server-side at registration time. Audit trail via `registration_fees` row with `fee_type='family_discount'`. |
| F4 D6 — Family-cap UI | Inline at checkout + Billing summary | No schema change; pure UI surface. |

### 4.3 RLS posture

- `current_user_org_ids()` (plural) replaces `current_user_org_id()` (singular) for parent-side queries. Returns array of org_ids the user has roles in.
- Admin-side queries continue using `current_user_org_id()` because admin can only operate within one org at a time.
- `events` and downstream tables use `WHERE org_id = ANY(current_user_org_ids())` for parent SELECT policies.
- Write policies remain org-scoped (parent writes RSVP to event X → policy checks parent has access to event X's org).

### 4.4 Foreign-key cascade rules

| Parent | Child | On Delete |
|---|---|---|
| organizations | programs | RESTRICT (no accidental org wipe) |
| programs | divisions | CASCADE |
| programs | registrations | RESTRICT (must cancel registrations first) |
| divisions | division_fees | CASCADE |
| divisions | teams | RESTRICT |
| registrations | registration_fees | CASCADE |
| players | registrations | RESTRICT |
| players | player_equipment | CASCADE |

### 4.5 Migration order (v1 ship)

1. `programs` table + `program_type` ENUM
2. Backfill `programs` from existing `seasons` data
3. Create `seasons` backwards-compat view
4. `divisions` extensions (`grade_min/max`, `gender`, `state`, `team_color`)
5. `division_fees` + `auto_apply_rule`
6. `registrations` + all new columns
7. `registration_fees`
8. `player_equipment`
9. `tryout_sessions` + `tryout_attendees`
10. `players` extensions
11. `organizations.family_cap_policy` + `acceptable_age_range`
12. RLS policy updates: `current_user_org_ids()` function, parent SELECT policies

Each migration includes pre-flight `SELECT` verification, post-flight `DO $$ ... END $$` verification block per CLAUDE.md Rule 7 / Rule 19. Applied via Supabase MCP `apply_migration` with explicit GO gate.

---

## 5. Public parent registration flow

**Quality bar: 10/10.** This is the conversion surface.

### 5.1 Signature moment

**Family-cap math animates inline as the parent adds kids.** Pierce family adding kid 2, kid 3, kid 4 sees the discount line appear and grow in real time. No surprise at checkout. The Stripe Elements pulse on payment is the second beat.

### 5.2 Entry — the program list

Parent arrives at `legacyhoopers.org/spring-2026` (the slug from wizard Step 4). Page shows the program hero + division grid.

```
┌─────────────────────────────────┐
│  [Knight logo]                  │
│  Legacy Hoopers · Spring 2026   │
├─────────────────────────────────┤
│                                 │
│  Pick a division                │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 11U Girls           OPEN  │  │  ← green pill
│  │ Grade 6 · Wed 6:30pm      │  │
│  │ $800                      │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ 10U Blue        WAITLIST  │  │  ← amber pill
│  │ Grade 5 · Tue 7:00pm      │  │
│  │ $800 · $100 deposit       │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ 8U Boys      OPENS FEB 24 │  │  ← cobalt pill
│  │ Grade 3 · Tue 5:30pm      │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

### 5.3 Four-step flow

**Step 1 — Player.** Name, DOB, grade. DOB + grade validates against division's grade band. Mismatch shows inline cobalt suggestion ("11U Girls is for grade 6. Your player is grade 5. Did you mean 10U Blue?") with tap-to-switch CTA.

**Step 2 — Guardian.** Name, email, phone, address, relationship. Address triggers server-side check against `division_fees.auto_apply_rule` for parishioner/non-parishioner pricing (St Pats). Result reflected on Step 4 with inline note ("Non-parishioner fee applied because address is outside parish zip 10504"). SMS opt-in checkbox visible inline. "+ Add co-guardian" expands second guardian fields (62% of LH players have 2 parents).

**Step 3 — Optional details.** Jersey size, shorts size (chip pickers), emergency contact (skip if same as guardian), medical notes, custom responses (CCD agreement for St Pats, AAU membership held for tryout flow). All optional unless org marked as required.

**Step 4 — Pay.** Cart breakdown with line-item fees, family-cap math, payment method.

### 5.4 The multi-child flow (resolves F1.v1.2)

After Step 4 confirmation:

```
✓ Charlie registered for 11U Girls.
  $475 paid.

  Want to register another child for this season?

  [ + Add another child ]   [ Done ]
```

Tap `+ Add another child` → loops to Step 1 with a "Adding Eleanor" header. Skips Step 2 (guardian + address already known). Optional details at Step 3. Step 4 cart accumulates:

```
Charlie's 4G Girls           $475
Penelope's 3G Girls          $475
Eleanor's 3G Girls           $475
Thomas's 4B Boys             $475
─────────────────────────────────
Subtotal                   $1,900
Family discount (St Pats)   -$972  ← animates in as 3rd, 4th kid added
─────────────────────────────────
Total                        $928

[ Pay $928 ]
```

One Stripe charge for the whole family. One confirmation email. Account auto-created from guardian email post-payment.

### 5.5 State matrix

| State | Treatment |
|---|---|
| Loading (initial program list) | Skeleton division cards |
| Empty (no divisions yet) | "Registration opens soon. Add your email to be notified." with mailing list capture |
| Error (network) | Inline cobalt banner + retry CTA. Cart state preserved. |
| Error (payment declined) | Stripe Elements shows inline error. Cart preserved. "Try another card" CTA. |
| Edge: returning parent (existing account) | Email at Step 2 triggers magic-link sent. Parent verifies email, returns to Step 3 with prior info pre-filled. |
| Edge: kid already registered for this division | Step 1 detects via email + name match. "Eleanor is already registered for 3G Girls. Edit her info or register a different child?" |
| Edge: division goes full mid-registration | Step 1 detects on next server check. "10U Blue is now full. Join the waitlist for $100 deposit, or pick another division." |

### 5.6 Voice notes

- Confirmation email subject: "Welcome to Spring 2026, Charlie's all set" (not "Registration confirmation #12847")
- Empty program list: "Spring 2026 isn't open yet. Drop your email — we'll send the link the moment it opens" (not "No programs available")
- Payment success: "Charlie's in. Coach Kenny will be in touch the week of March 9." (specific human commitment, not "Thank you for your purchase")
- **Cart reassurance (v2.1, mockup-derived — three benefits in 11 words):** "One charge · one confirmation · account auto-created from your email."

### 5.7 Micro-interactions

- Stripe Elements card field: ⏱ 200ms entry slide-in. Submit button shows spinner replaced with checkmark (150ms hold) before redirect — the "yes, you did it" beat from `EMBER_TENANCY_ARCHITECTURE_v3.md` §20.2.
- Family-cap discount line: appears with 250ms fade + 50ms upward translate. Subtle gold tint pulse for 600ms after appearing (the "you saved money" celebration).
- Step transitions: 200ms slide-left for forward, 200ms slide-right for back. `useReducer` for cart state, no re-mount.
- Haptic on every primary CTA tap (`navigator.vibrate(15)`).

### 5.8 The signature retention beat

Returning parent (16 LH players in 3+ seasons) gets a push notification when their kid's next season opens. Tap → app opens to a pre-filled Step 1 ("Charlie, 6th grade, $0 due — confirm to register"). 8-tap re-registration max. The kid's data, the parent's data, the address, the card on file all carry forward. The friction goes from 4 minutes (first-time registration) to 30 seconds (returning).

---

## 6. Family Home

**Quality bar: 10/10.** The signature surface. The reason parents never want to leave.

### 6.1 Signature moment

**Cross-org conflict resolution.** No other app in the category can do this. The moment a parent sees "Charlie has 11U Girls practice at LH AND 4G Girls practice at St Pats at the same time" surfaced with a single-tap resolution, the moat is real.

### 6.2 Layout

Three vertical sections. Sticky header. Bottom nav fixed.

```
┌─────────────────────────────────┐
│ [phoenix] Family              ⚙│  ← Ember-default header
│ Good morning, Frank             │
├─────────────────────────────────┤
│ NEXT UP                         │
│ ┌───────────────────────────┐  │
│ │ ⏰ in 3h 20m  •pulsing    │  │
│ │ Milo · 8U Boys practice   │  │
│ │ 🛡 LH · WCC Gym 5:00 PM   │  │
│ │ [✓ Going] [? Maybe] [✗]   │  │
│ └───────────────────────────┘  │
├─────────────────────────────────┤
│ MY KIDS                         │
│ ┌──────┐ ┌──────┐ ┌──────┐    │  ← horizontal strip
│ │ Milo │ │Charlie│ │Rowan │    │
│ │ 8U   │ │11U•4G│ │ 7G   │    │
│ │ 🛡●  │ │🛡⛪   │ │  ⛪  │    │
│ └──────┘ └──────┘ └──────┘    │
├─────────────────────────────────┤
│ THIS WEEK                       │
│                                 │
│ Mon Mar 16                      │
│  ┌───────────────────────────┐ │
│  │ 5:00 PM Milo  8U Boys     │ │
│  │ 🛡 WCC Gym                │ │
│  └───────────────────────────┘ │
│                                 │
│ Tue Mar 17                      │
│  ╔═══════════════════════════╗ │
│  ║ ⚠ 6:00 PM Charlie         ║ │  ← red 2px ring
│  ║   has two events at this  ║ │
│  ║   time   [Resolve →]      ║ │
│  ╚═══════════════════════════╝ │
│  ┌───────────────────────────┐ │
│  │ 7:00 PM Milo  8U Boys     │ │
│  └───────────────────────────┘ │
├─────────────────────────────────┤
│ Family  Schedule  Messages  Acct│  ← bottom nav
└─────────────────────────────────┘
```

### 6.3 Conflict resolution flow

Tap `Resolve` → full-screen:

```
┌─────────────────────────────────┐
│ ← Cancel                        │
├─────────────────────────────────┤
│ Charlie's 6:00 PM conflict      │
│ Tuesday, March 17               │
│                                 │
│ Pick one. We'll RSVP both:      │
│                                 │
│ ⦿ [🛡 LH]                       │
│      11U Girls practice         │
│      WCC Gym                    │
│      Coach Kenny                │
│      ────                       │
│                                 │
│ ○ [⛪ St Pats]                  │
│      4G Girls practice          │
│      Wampus Brook Gym           │
│      Coach Lentz                │
│                                 │
│ ○ Charlie can't make either     │
│                                 │
│             [ Save resolution ] │
└─────────────────────────────────┘
```

Picking option 1 → server writes `event_rsvps` row with `status='going'` for LH event, `status='not_going'` for St Pats event. Phase 4 messaging fires DM to both coaches: "Frank resolved Charlie's 3/17 6pm conflict. Charlie will attend LH 11U Girls practice." Optimistic UI updates immediately, server confirms in background.

### 6.4 State matrix

| State | Treatment |
|---|---|
| Loading (cold load) | Skeleton: header text, gray Next Up card, gray kid cards, gray date headers. Animates fill in 300ms when data lands. |
| Empty: no kids yet | Phoenix watermark + "Add your first child" CTA → opens registration browser |
| Empty: kids but no events this week | "Your week is wide open. Enjoy it." Phoenix watermark, calendar CTA. Brand voice permission-to-rest. |
| Empty: kids registered, season hasn't started | "Spring 2026 starts March 15. We'll surface events here the moment they're scheduled." |
| Error: data fetch failed | Inline cobalt banner: "Couldn't load your week. Tap to retry." Doesn't blank the screen — last cached state visible underneath. |
| Edge: 4-kid family (Pierce) | Kid card strip scrolls horizontally with snap-to-card. 4 cards visible on iPhone Pro. |
| Edge: single-kid single-org family | Same layout, kid strip hidden (single card looks lonely). Next Up + This Week only. |
| Edge: 0 unread messages | Bottom nav Messages badge hidden (not "0") |

### 6.5 Voice notes

- Greeting: "Good morning, Frank" (with time-of-day variant — Good afternoon, Good evening). Not "Welcome back."
- Conflict copy: "Charlie has two events at this time" not "Scheduling conflict detected"
- Resolution save toast: "Locked in. Coach Kenny knows." Not "RSVP updated successfully"
- **Conflict pre-commitment (v2.1, mockup-derived — states exactly what's about to happen, lowering parent anxiety):** "We'll RSVP Going at [org A] and Not Going at [org B], and DM both coaches."
- Empty-week copy: "Your week is wide open. Enjoy it." Not "No events scheduled"
- Push notifications: "Charlie's game starts in 1 hour 🏀" not "Game reminder"

### 6.6 Micro-interactions

- **Countdown ticks** via `useNow` hook firing every 60s. Card doesn't re-render — just the countdown text updates via ref.
- **Pulsing dot** (sf-pulse-dot, 600ms cycle) when event is <2h away. Green if RSVP'd Going, amber if not yet RSVP'd, gray if RSVP'd Not Going.
- **RSVP pill tap** = haptic + scale(0.97) press + optimistic state change. Pill fills with green/amber/red. Server confirms in background. Failure rolls back with toast.
- **Kid card tap** = scale(0.98) + 200ms transition into kid detail (Stage 2 brand applied for that kid's primary org).
- **Conflict card** = pulses red ring at 2s interval for first 5s after appearing (attention grab), then steady. Tap = haptic + slide-up to resolution flow.
- **Pull-to-refresh** uses iOS rubber-band physics. Phoenix logo spins gold during refresh.

### 6.7 Branding & flip behavior

Family Home stays Ember-default (Phoenix + gold + navy) for multi-org users. For single-org users, Family Home picks up that org's brand colors (cobalt header for LH-only families). When a multi-org user taps into a kid's team page or event detail, AuthContext applies that event's org brand to `--em-*` variables. Brand flip uses 200ms cross-fade per `EMBER_TENANCY_ARCHITECTURE_v3.md` §20.3.

### 6.8 Per-kid card detail

Tap a kid card → kid profile (sub-page under Family Home):

```
┌─────────────────────────────────┐
│ ← Family             Charlie    │
├─────────────────────────────────┤
│                                 │
│ Charlie Samaritano · Grade 6    │
│ ──────────────────────────────  │
│                                 │
│ 🛡 LH · 11U Girls               │  ← org context apply here
│   Spring 2026 · $475 paid       │
│   Next: practice Mar 17 6pm     │
│   [View team →]                 │
│                                 │
│ ⛪ St Pats · 4G Girls           │  ← second org context
│   Winter 2025-26 · $225 paid    │
│   Season ended Mar 1            │
│   [View team →]                 │
│                                 │
│ ── Latest messages              │
│ 🛡 Coach Kenny · Yesterday      │
│   "Practice moved to 6:30..."   │
│                                 │
│ ── Payments                     │
│   Apr 15: $267 LH installment   │
│   [Update card] [Pay now]       │
└─────────────────────────────────┘
```

This is where per-kid context lives. Messages, payments, season info all scoped to the kid across orgs. Bridges from Family Home (cross-org overview) to org-specific pages (team detail, event detail).

---

## 7. Communication integration

**Quality bar: 10/10.** Bridges existing Phase 4 messaging infrastructure into family-first IA.

### 7.1 Signature moment

**Briefings appear on Family Home, not in a separate inbox.** The 4-8 hr/week Frank spends writing parent briefings manually becomes content that lives where parents already look. They never have to go to Gmail.

### 7.2 IA decisions (recap from F2 lock)

- **Global Messages tab.** Bottom nav slot. All DMs and announcements from all coaches across all orgs in one chronological inbox. Unread badge counts across orgs.
- **Briefings live on Family Home + per-kid card archive.** Not in the inbox. Briefings are long-form, scheduled, broadcast — not conversation. Family Home "This Week" surfaces the current briefing; per-kid card has a Briefings archive for the 4-8 parents per season who want to re-read.
- **Per-org briefing authorship.** Frank-as-Program-Director writes LH's Sunday digest. St Pats's admin writes St Pats's. Parents in 2 orgs get 2 separate briefings (each carries its org's voice + signature), but Family Home stacks them in one "This Week" feed with org logo badges.

### 7.3 The Briefing surface on Family Home

Briefings appear above the "This Week" section when published in the last 7 days:

```
THIS WEEK · BRIEFINGS

  🛡 LH · Spring Launch Sequence
  Published Sunday 7:00 PM
  ⚡ 10-second summary box
  Numbered sections with emoji
  [ Read full briefing → ]

  ⛪ St Pats · Final Stretch Update
  Published Sunday 8:30 PM
  ⚡ 10-second summary box
  Tournament cadence box
  [ Read full briefing → ]
```

Tap → full-screen rendered briefing (the same HTML that gets emailed, but rendered in-app with Ember chrome). Read-receipt tracking via existing `tournament_message_recipients` table.

### 7.4 The Messages global inbox

```
┌─────────────────────────────────┐
│ Messages                     ✏ │
├─────────────────────────────────┤
│ [All] [Unread 3] [LH] [St Pats]│  ← filter chips
│                                 │
│ 🛡 Coach Kenny • 2m ago    🔵   │  ← unread dot
│    "Practice moved to 6:30..."  │
│    11U Girls                    │
│                                 │
│ ⛪ Coach Lentz • 1h ago    🔵   │
│    "Reminder: jerseys due..."   │
│    4G Girls                     │
│                                 │
│ 🛡 LH Announcement • Yesterday  │
│    "Spring tournaments..."      │
│                                 │
│ 🛡 Coach Kenny • 2 days ago    │
│    "Great practice today!"      │
│    11U Girls                    │
└─────────────────────────────────┘
```

Filter chips: All, Unread, per-org. Per-thread context line shows org logo + sender + kid's team. Tap thread → full conversation view (Stage 2 brand applied for that org).

### 7.5 Notification matrix (locked from F2 D2c)

| Event | Push | In-app inbox | Email | SMS (opt-in) |
|---|---|---|---|---|
| Coach DM | ✓ | ✓ thread | — | — |
| Team announcement | ✓ | ✓ inbox | — | — |
| New briefing published | ✓ | — (own surface) | ✓ (briefing IS the email externally) | — |
| Event changed / cancelled | ✓ | ✓ inbox | — | ✓ if <24h before |
| RSVP reminder | ✓ | — | — | — |
| Payment due (3d out) | ✓ | ✓ inbox | ✓ | — |
| Payment failed | ✓ | ✓ inbox | ✓ | ✓ |
| Registration confirmed | ✓ | ✓ inbox | ✓ | — |
| Player placed on team | ✓ | ✓ inbox | — | — |
| Family Home conflict detected | ✓ | — (surfaces in Home) | — | — |

Principle: push is primary, email/SMS reserved for legal/financial consequence. Per-parent override in Account → Notifications. Default state is opinionated, not Slack-firehose.

### 7.6 State matrix

| State | Treatment |
|---|---|
| Loading | Skeleton inbox rows |
| Empty (no messages ever) | Phoenix watermark + "When your coaches send updates, they'll show up here" |
| Empty (caught up, no unread) | "All caught up." with subtle gold checkmark animation. Not "0 messages." |
| Error (send fails) | Message stays in thread with cobalt "Tap to retry" affordance. Doesn't disappear. |
| Edge (deleted thread) | Soft-delete (parent can restore for 7 days via "Recently deleted" in Account → Messages) |
| Edge (admin retracted a message) | Original message replaced with "[Coach retracted this message]" in cobalt italic. Existing pattern per project memory. |

### 7.7 Voice notes

- Empty: "All caught up." (not "No new messages")
- Push notification format: `Coach Kenny: Practice moved to 6:30. Tap to read.` (sender name first, content preview, action verb)
- Briefing email subject template: `Spring Launch Sequence — 11U Girls · LH` (briefing name, audience, org — readable in 1 glance from notification tray)
- **Positioning line (v2.1, mockup-derived — use it three times: briefings empty-state, marketing site, App Store listing):** "Two orgs, two voices — stacked in one feed. Never opens Gmail."
- Failed send retry: "Couldn't send. Tap to try again." (not "Message failed: error code 502")

### 7.8 Micro-interactions

- Thread row tap = haptic + 100ms scale press + slide-right transition
- Unread → read = blue dot fades over 200ms when thread opened
- Pull-to-refresh on inbox loads new messages with the same rubber-band physics as Family Home
- New message arriving while inbox open = thread row slides in from top (200ms ease-out) with subtle background pulse for first 1s
- Briefing card on Family Home = subtle gold border pulse for 24h after publish (calls attention without screaming)

---

## 8. Payment Lifecycle UI

**Quality bar: 10/10.** The surface that replaces Stripe Dashboard for parents.

### 8.1 Signature moment

**The family savings summary.** Account → Billing shows a running "You've saved $972 with St Pats family pricing" with a small gold-tinted celebrate animation when the amount grows. Parents check this voluntarily because it makes them feel good.

### 8.2 IA — Billing lives in Account, surfaced on kid cards

No bottom-nav slot. Account → Billing shows global summary (next charge, total outstanding, active plans). Kid cards show payment status indicator (green / amber / red) that drills into per-kid billing detail.

### 8.3 Account → Billing layout

```
┌─────────────────────────────────┐
│ ← Account            Billing    │
├─────────────────────────────────┤
│                                 │
│ NEXT CHARGE                     │
│ Apr 15 · $267 for Charlie       │
│ Card ending 4242                │
│ [ Pay now ]  [ Update card ]    │
│                                 │
│ ──────────────────────────────  │
│                                 │
│ ACTIVE PLANS · 1                │
│ Charlie's 11U Girls registration│
│ $534 of $801 paid · 67%         │
│ [ View schedule →]              │
│                                 │
│ ──────────────────────────────  │
│                                 │
│ FAMILY SAVINGS                  │
│ ✨ You've saved $972 with       │
│    St Pats family pricing       │
│                                 │
│ ──────────────────────────────  │
│                                 │
│ RECEIPTS                        │
│ Mar 14 · $267 Charlie  [PDF]    │
│ Mar 1 · $475 Eleanor   [PDF]    │
│ Mar 1 · $475 Penelope  [PDF]    │
│ ...                             │
│ [ View all 12 receipts → ]      │
└─────────────────────────────────┘
```

### 8.4 Payment plan detail (tap "View schedule")

```
┌─────────────────────────────────┐
│ ← Billing           Charlie     │
├─────────────────────────────────┤
│                                 │
│ Charlie's 11U Girls             │
│ Spring 2026 · LH                │
│                                 │
│ ✓ Mar 15 · $267    paid Mar 14 │
│ ● Apr 15 · $267    next         │
│   Card ending 4242              │
│ ○ May 15 · $267    scheduled    │
│ ─────────────────────────────   │
│ $534 of $801 paid · 67%         │
│                                 │
│ [ Update card ]                 │
│ [ Pay remaining $267 now ]      │
│                                 │
│ ──────────────────────────────  │
│                                 │
│ History                         │
│ Mar 14 · $267 paid              │
│ Mar 1 · Registration $801 total │
│         · Family discount -$0   │
│         · 3-installment plan    │
└─────────────────────────────────┘
```

### 8.5 Receipt PDF

Generated server-side from a template. NOT pulled from Stripe.

- Header: org logo (LH knight, St Pats shield, etc.) + org name + org tagline
- Body: line-item receipt with date, division, player, fees, family-cap discount (if applied)
- Footer: "Powered by Ember" small mark + org's primary domain
- Brand colors throughout (cobalt for LH, etc.)

Filename pattern: `LH-receipt-charlie-samaritano-2026-03-14.pdf` — searchable in Files app two years later.

### 8.6 Failed installment recovery

```
🔔 Push notification:
"Your $267 April payment for Charlie's registration
didn't go through. Tap to fix."

Tap → opens to:

┌─────────────────────────────────┐
│ ← Billing       Payment failed  │
├─────────────────────────────────┤
│                                 │
│ Charlie's April installment     │
│ $267 · Card ending 4242         │
│                                 │
│ Card was declined. Two options: │
│                                 │
│ ┌───────────────────────────┐  │
│ │ Update payment method     │  │
│ │ Enter a new card          │  │
│ └───────────────────────────┘  │
│                                 │
│ ┌───────────────────────────┐  │
│ │ Pay now with Apple Pay    │  │
│ │ Skip card entry           │  │
│ └───────────────────────────┘  │
│                                 │
│ Auto-retry: 3 attempts over     │
│ 7 days. If all fail, your admin │
│ will reach out.                 │
└─────────────────────────────────┘
```

Two recovery paths inline. No dead ends.

### 8.7 Refund flow (parent-initiated via Messages)

Parent taps "Request refund" on a payment row → opens a pre-populated DM thread to admin:

```
To: Frank Samaritano (LH Admin)
Re: Refund request

I'd like a refund for Charlie's 11U Girls registration.

Reason: [parent fills in]

[ Send ]
```

Sends as a normal DM through Phase 4 messaging. Admin processes in admin UI (writes Stripe refund, updates `registration_fees`). Parent sees refund appear in next Billing view + receipt update.

No dedicated approval queue UI for v1. LH had 7 refunds in 523 registrations — volume doesn't justify queue management. Defer to Phase 6 if volume grows.

### 8.8 State matrix

| State | Treatment |
|---|---|
| Loading | Skeleton plan timeline + receipt rows |
| Empty (no payments yet) | "Your payment history will show up here once you've registered a player." with CTA back to Family Home |
| Empty (no active plans, all paid in full) | "All paid up. No upcoming charges." with subtle gold checkmark |
| Error (Stripe down) | "Can't load payment info right now. Last updated 2 minutes ago." Cached state visible. |
| Edge (failed installment recovering) | Plan timeline shows red `✗ Apr 15 · failed, retrying Apr 17` then `✓ Apr 17 · paid` once successful |
| Edge (refund processed) | Receipt list shows refund as a negative-amount row: `Mar 25 · -$267 refund · processed by admin` |
| Edge (no active card on file) | "Add a payment method" CTA at top of Billing before any other content |

### 8.9 Voice notes

- Next charge: "Apr 15 · $267 for Charlie" (specific, name-first, low anxiety)
- Empty state: "All paid up. No upcoming charges." (not "$0 due")
- Savings line: "You've saved $972 with St Pats family pricing" (the gold-tinted celebrate beat)
- Failed payment: "Card was declined. Two options:" (acknowledges + offers paths, not "Payment Error")
- Refund DM auto-prefill: "I'd like a refund for [registration]." (human, not "Refund request form #2847")

### 8.10 Micro-interactions

- **Pay now / Update card buttons** = haptic + scale(0.97) press, button text replaced with spinner during Stripe call
- **Family savings line** = gold-tinted background pulse animation (600ms, 1 cycle) when amount grows after a new registration
- **Plan timeline** = checkmarks scale-in from 0.8 to 1.0 with cubic-bezier overshoot when payment confirms
- **Receipt PDF download** = card lifts on tap (shadow-md → shadow-lg, 150ms) before PDF preview opens
- **Failed payment retry confirmation** = green sf-fill-grow animation on the previously-failed timeline node

---

## 9. Admin season detail

**Quality bar: MVP.** Polish post-pilot.

The page admin lands on after creating a season. Hero card + collapsible accordions per Ember design rules (no always-on mid-page chrome).

### 9.1 Layout

```
┌─────────────────────────────────┐
│ ← Back            [ Settings ⚙] │
├─────────────────────────────────┤
│  SPRING 2026                    │
│  Basketball · Mar 15 - Jun 14   │
│                                 │
│  ┌─────┬─────┬─────┐           │
│  │  5  │ 63  │ $50K│           │
│  │ div │ plr │ paid│           │
│  └─────┴─────┴─────┘           │
│                                 │
│  [Open registration] [...more]  │
├─────────────────────────────────┤
│ ▼ Divisions (5)                 │
│    11U Girls    13 players   ● │
│    10U Black    14 players   ● │
│    ...                         │
│    [+ Add division]            │
├─────────────────────────────────┤
│ ▶ Registrations (63)            │
│    7 unplaced                   │
├─────────────────────────────────┤
│ ▶ Schedule (47 events)          │
├─────────────────────────────────┤
│ ▶ Fees & payments               │
├─────────────────────────────────┤
│ ▶ Communications                │
├─────────────────────────────────┤
│ ▶ Settings                      │
└─────────────────────────────────┘
```

### 9.2 Critical states (MVP)

- Loading: Skeleton hero stats + accordion headers
- Empty (no divisions yet): "Add your first division to get started" inline CTA
- Empty (registration not open): "Registration opens Feb 24" with edit CTA
- Error (data load fails): Inline cobalt banner + retry

### 9.3 Roster builder (entry to placement)

Tap Registrations accordion → expanded view with filter chip `[All 63] [Unplaced 7]`. Tapping Unplaced shows 7 registration cards with `[Place]` CTA each. Tap Place → division-scoped roster builder (Phase 1 polish-pass scope).

### 9.4 Polish-pass scope (deferred)

- Drag-and-drop multi-select placement
- "Auto-place suggested rosters" with admin review/edit
- Roster export CSV
- Per-division roster preview before season opens
- Color-coded conflict warnings (player in two divisions)

---

## 10. Design system references

The design system is substantially locked. v2 spec does not re-derive it — points to canonical sources.

### 10.1 Canonical sources

| Doc | Section | Content |
|---|---|---|
| `EMBER_MASTER_INDEX_v3.pdf` | §10 Design System Cockpit Mode | Inter typography, 4px grid, 10px radius, 44px tap targets, Lucide stroke 1.75 |
| `EMBER_MASTER_INDEX_v3.pdf` | §10 Broadcast Mode | Barlow Condensed, 8-color broadcast palette, 22 broadcast components |
| `EMBER_MASTER_INDEX_v3.pdf` | §11 Animations | 10 named animations behind `prefers-reduced-motion` |
| `EMBER_TENANCY_ARCHITECTURE_v3.md` | §16 Loading States | Cold load splash, font load, sign-in flight, brand transition |
| `EMBER_TENANCY_ARCHITECTURE_v3.md` | §20 Polish & Delight | Phoenix entrance, brand transitions, haptic, focus states |
| `LH_OPS_SPEC.md` | (entire) | LH-specific design tokens, screen specs |
| `LH_BRAND_CONTENT_MODEL.md` | Part 10 | Locked voice library (the briefing phrases) |
| `CLAUDE.md` | §16 component patterns | FullScreenForm vs BottomSheet, 150-line file cap |

### 10.2 What's new in v2 that needs design system extension

- **Cross-org conflict ring** (red 2px around event card, pulses for 5s on first appear)
- **Family Home Ember-default header** (Phoenix at 32px, gold mark, navy backdrop, distinct from per-org headers)
- **Family savings celebrate animation** (gold background pulse, 600ms, 1 cycle)
- **Org badge component** (16px logo chip, used on kid cards and message threads)
- **Per-kid card** (horizontal scroll card with org indicators and primary team)

These extensions get added to `EMBER_MASTER_INDEX_v3.pdf` §10 in a v3.1 revision (separate doc work, not blocking v2 spec ship).

### 10.3 Two implementations, one source of truth (pattern carries forward)

- In-app surfaces use React components in `src/components/`
- Email templates use HTML strings in `src/lib/emails/templates/`
- Both consume same tokens from `src/lib/design-tokens.js`
- Receipt PDFs use a third implementation: server-side PDF generator consuming same tokens

Three implementations, one source of truth.

---

## 11. Out of scope for v2

Explicitly NOT in v2. Each gets a one-line "where it goes" so nothing is silently dropped.

| Feature | Reason | Where it lives |
|---|---|---|
| Photos & video distribution | Frank doesn't have a photo workflow ready. Veo integration is Phase 5+ | Phase 2 stub: "Photos" tab on team page (empty) |
| Coach payment / compensation tracking | Frank tracks Darien's per-session pay in Excel today | Phase 2 |
| Volunteer signups / snack schedule | Real feature, not in immediate retention path | Phase 6 |
| Tournament brackets and pool play | TourneyMachine still authoritative for v1 | Phase 5 |
| Roster export CSV (TourneyMachine format) | Easy build, easy ship | Phase 2 quick win |
| Org onboarding wizard (admin signup) | Frank manually onboards orgs today; St Pats is the test | Phase 6 |
| Stripe Connect (per-org Stripe accounts) | Platform Stripe sufficient for v1 with LH pilot | Phase 7 |
| Capacitor / App Store packaging | PWA ships first, native shell later | Phase 5 |
| Multi-language / Spanish locale | Single market for v1 | Phase 7+ |
| Dark mode | Polish layer, after core experience locks | Phase 7+ |
| Public coach signup (vs admin-invite only) | All coach onboarding is admin-invite for v1 | Phase 6 |
| Form template inheritance UI | Schema deferred per F5 Q2; need UI design before ship | Phase 6 |
| `clinic`, `evaluation`, `interest_list` program types | Schema allows; UI exposes only `season`, `tryout`, `camp` for v1 | Phase 6 |

---

## 12. Open questions resolved

All 20 open questions from v1.0/v1.1/v1.2 now have one-line resolutions.

### From v1.0

| # | Question | Resolution |
|---|---|---|
| Q1 | Sport seeding for new orgs | Auto-seed Basketball as `is_primary=true` on org create. Admin adds more in Settings. |
| Q2 | Grade band display copy | "10U Black" format (number first, gender). Grade band shows as "Grades 3-4" in copy. |
| Q3 | Co-Ed in basketball | Removed from season/tryout pickers. Available in camp picker as default. |
| Q4 | Waitlist semantics | Auto-waitlist when capacity hits max. $100 deposit pattern. PROMOTE_AND_CREDIT or REFUND_AND_RELEASE chosen per division. |
| Q5 | Public URL slug collisions | Custom domain per org from Phase 5. Org subdomain (lh.ember.app) fallback for orgs without domain. |
| Q6 | St Pats League Play import | Defer to St Pats discovery Q4 2026. Schema field `programs.external_league_code` added now. |
| Q7 | Stripe Connect vs platform Stripe | Platform Stripe for v1. Stripe Connect Phase 7. Schema unchanged. |
| Q8 | Custom fields per division vs season | Per-program forms with Safety Block (resolved by F5 Q2). |
| Q9 | Coach signups via public URL | Admin-invite only for v1. Public coach apply is Phase 6. |
| Q10 | Roster invitation email | Push + in-app notification when player placed on team. No separate email. |

### From v1.1

| # | Question | Resolution |
|---|---|---|
| Q11 | Promote-to-season UX | Admin reviews tryout attendees in roster builder. Bulk-select + "Promote selected to [Season]" CTA. Creates registrations with `promoted_from_registration_id` link. |
| Q12 | Prorated fee anchor | Stepped: full ≥8 weeks left, 75% if 4-8 weeks, 50% if <4. Locked. |
| Q13 | Practice Roster naming | Canonical name: "Practice Roster" (3 tiers: Full Roster, Practice Roster, Practice Player). |
| Q14 | Interest list conversion path | Deferred to Phase 6 with `interest_list` program type. |
| Q15 | AAU membership field | Lives in `players.aau_member_id NULLABLE`. Tryout custom field writes here on promote-to-season. |

### From v1.2

| # | Question | Resolution |
|---|---|---|
| Q16 | Family-cap policy specifics | Per-org JSONB. Initial shape: `{enabled, cap_cents, per_extra_child_cents}`. St Pats provides exact values during onboarding Q4 2026. |
| Q17 | Parishioner zip rule | `division_fees.auto_apply_rule JSONB`: `{"type": "address_not_in_zips", "zips": ["10504"]}`. St Pats confirms zip list during onboarding. |
| Q18 | Multi-child cart UX | "+ Add another child" at end of payment Step 4. Loops to Step 1 with new player only. Cart accumulates, single Stripe charge. |
| Q19 | Form inheritance UI | Deferred to Phase 6. v1 ships per-program forms with Safety Block template. |
| Q20 | Player age band cap | `organizations.acceptable_age_range INT4RANGE`. LH default `[4,14]`, St Pats `[8,18]`. Configured per org. |

---

## End of spec

**Word count:** ~7,200
**Replaces:** v1.0, v1.1 comparison report, v1.2 St Pats review
**Quality bar:** Path C — parent surfaces at 10/10, admin surfaces at MVP
**Open questions:** 0
**Ready for:** Visual HTML artifact rebuild (Option B follow-up), then PR sequencing

**Sign-off pending:** Frank's GO before any code or migration runs.

The next move after sign-off is either:
- HTML visual artifact rebuild (Family Home wireframes, conflict resolution, Billing tab, multi-child cart, etc.) — for review/sharing
- PR queue — migration sequence + UI surfaces in order — to start building

Tell me which.
