# L99 Audit — Registration Capture Flow (v1)

> Canonical pre-build artifact per CLAUDE.md §16.15. All five L99 elements land
> here BEFORE any PR A code. The PR sequence (§8) implements the locked decisions.
> Source spec: `docs/EMBER_PROGRAM_SETUP_SPEC_v2.md` §3 (admin setup) + §5 (parent flow).
> Methodology: line-by-line per category + 2-pass deep-read (§16.15 a–e).
> Created: 2026-06-01. Scope locked by Frank (AskUserQuestion, 2026-06-01).

---

## §0. SCOPE LOCK — "Capture flow"

Frank's GO: **§3 admin program-setup (MVP) + §5 Steps 1–3 parent registration.
Payment via the existing manual record-payment model.** Verified against the live DB
before scoping (no improvisation):

| Spec surface | In this build? | Reason |
|---|---|---|
| §5 Steps 1–3 (Player / Guardian / Details) | ✅ YES | Lands into `registrations` / `registration_fees` / `player_equipment` (migrations #6/#7/#8) |
| §5 Step 4 — cart + **submit** (no Stripe) | ✅ YES (capture variant) | Cart math + family-cap discount render; "submit" creates `status='pending'` registration. Admin records payment via existing financial flow |
| §3 admin program-setup wizard (MVP) | ✅ YES | Prerequisite — there is no UI to create a `program` today (the 3 existing programs were backfilled from seasons) |
| §5 Step 4 — **Stripe Elements / Apple Pay** | ⛔ DEFERRED | 0 Stripe tables, no integration (verified). Phase: "Stripe first" track |
| §8 Payment Lifecycle (installments/receipts/savings) | ⛔ DEFERRED | `payment_plans` table does not exist (verified). Needs migration #13 + Stripe |
| §6 Family Home | ⛔ DEFERRED | `org_count = 1` (verified). Spec §2.3: single-org parents use existing `ParentHomePage` |
| §7 Communication re-IA | ⛔ DEFERRED | Phase 4 messaging already shipped; re-IA is multi-org-flavored |

**The shippable loop:** admin creates program → parent registers kid (public, unauth)
→ registration lands `pending` → admin sees it + records payment (existing flow).

---

## §1. (a) INITIAL AUDIT PASS — surface inventory + mount-tree mapping

Greenfield: no surface to "redesign", so the audit maps the new surfaces onto the
EXISTING routing/component/hook tree (recon 2026-06-01, file:line verified).

### 1.1 Routing seams (`src/App.jsx`)
- Authenticated tree: `RequireAuth` + `AppShell` → `Protected` → `HomePage` role-router
  (`HomePage.jsx:33-34` branches parent/coach/admin).
- **Public tree exists** — the public schedule page (CLAUDE.md 3-B) proves unauth routes
  render without `RequireAuth`. The parent registration entry (`/r/:slug`) hangs here.
- **New routes:**
  - Public:  `/r/:slug`            → `RegisterEntryPage` (program list, unauth)
  - Public:  `/r/:slug/apply`      → `RegisterFlowPage`  (4-step wizard, unauth)
  - Admin:   `/admin/programs/new`  → `ProgramSetupPage`  (`Protected` admin-only)
  - Admin:   `/admin/programs/:id`  → `ProgramDetailPage`  (registrations list — light, §9 MVP)

### 1.2 Components reused (no reinvention — anti-pattern #42)
| Need | Existing component | Source |
|---|---|---|
| Multi-field forms (3+) | `FullScreenForm` (open/onClose/title/children/footer; z-9999; focus trap; Esc) | `src/components/shared/FullScreenForm.jsx` |
| 1–2 field dialogs / pickers | `BottomSheet` (open/onClose/initialHeight/expandedHeight) | `src/components/shared/BottomSheet.jsx` |
| Currency | `formatCurrency()` (cents-accurate, admin/parent parity) | `src/lib/formatters.js` |
| Tokens | `--em-*` only | `src/index.css` |
| Constants | `TEAM_COLORS`, status enums | `src/lib/constants.js` |
| Supabase | `import { supabase } from '../lib/supabase'` | `src/lib/supabase.js` |

### 1.3 Hook pattern to mirror (`useActivities.js`)
`{ data, loading, error, refetch }`; destructure `data` AND `error`, throw/surface
error before use, `|| []` only for success-with-zero-rows (anti-pattern #36). Org-scope
first (#37).

---

## §2. (b) DEEP-READ ADDENDUM — what the first pass missed

The ~40% cascade catch (§16.15 b). Each is a real gap, not a restatement.

- **G1 — The parent flow is PUBLIC/anon, but the writes touch 5 tables.** Direct anon
  INSERT on `players`/`guardians`/`player_guardians`/`registrations`/`registration_fees`
  would be a security disaster (anon would need table-level grants). **Decision: one
  `SECURITY DEFINER` RPC `submit_registration(jsonb)` callable by anon**, doing the whole
  graph atomically with server-side validation. Anon gets EXECUTE on exactly one
  function, nothing else. (Anti-pattern #23/#57: anon EXECUTE is intentional here and
  explicit; everything else stays revoked.)
- **G2 — Family-cap math must be computed server-side, shown client-side.** Spec §5.1
  animates the discount as kids are added. Client renders an *estimate* from
  `organizations.family_cap_policy`; the RPC computes the *authoritative* total and writes
  the `fee_type='family_discount'` audit row (§4.2 F1.v1.2). Client estimate and server
  total must reconcile — if they differ, server wins and the UI re-renders (no silent
  drift; anti-pattern #63 PATTERN A — one source for "what's owed").
- **G3 — Account creation has no Stripe trigger anymore.** Spec §5.4 auto-creates the
  account "post-payment". With no payment step, **account-claim moves to a magic link**:
  the submit edge function calls Supabase auth `generateLink` (anon can't) and emails the
  guardian a claim link. Registration exists `pending` regardless; the link is how the
  parent later sees status. (Open Q-1 — confirm magic-link-on-submit vs admin-invites-later.)
- **G4 — Grade-band validation needs the division's `grade_min/max`.** Step 1 validates
  player grade against the division and renders the cobalt "did you mean X?" suggestion
  (spec §5.3). That's a client check against already-fetched divisions — no extra round trip.
- **G5 — Dedupe on resubmit.** A parent double-submitting, or registering a 2nd kid, must
  not create duplicate players/guardians. RPC dedupes: player by `(org_id, lower(name), dob)`,
  guardian by `(org_id, lower(email))`. `registrations` dedupe by `(program_id, player_id)`
  → returns existing with a `already_registered` flag (drives spec §5.5 edge row).
- **G6 — Slug → program resolution.** `/r/:slug` needs a public read of the program by
  slug. `programs` has no `slug`/registration-window columns today (migration #10 added
  player ext, not program slug). **Needs a small migration #13-cap: `programs.public_slug`,
  `reg_opens_at`, `reg_closes_at`, `is_published`.** Without it there's no public entry.
  (This is the one schema add the capture flow requires — see §5.)
- **G7 — Division OPEN/WAITLIST/OPENS-DATE pill needs capacity + window state.** Pill
  logic = (now vs reg window) + (count(confirmed registrations) vs capacity). Capacity
  lives on... nothing yet for divisions. v1: treat all divisions OPEN within the reg
  window; WAITLIST/capacity deferred (spec §5.5 waitlist is a real feature but needs a
  `divisions.capacity` + waitlist machinery — DEFER, render OPEN/CLOSED only). (Open Q-2.)
- **G8 — Admin setup writes are org-scoped via `current_user_org_id()` (singular)** per
  spec §4.3 (admin operates in one org). Parent reads use the plural helper (migration #12).
  Don't cross them.
- **G9 — Public RLS read for the program list.** `/r/:slug` is unauth → needs an anon
  SELECT path for the published program + its divisions + base fees. Either an anon SELECT
  policy gated on `is_published=true`, or a `get_public_program(slug)` SECURITY DEFINER RPC.
  **Decision: RPC** (keeps the org-wide parent SELECT policies from migration #12 untouched,
  and avoids exposing unpublished programs/PII tables to anon).

---

## §3. (c) ANTI-PATTERN CROSS-REFERENCE

Every design decision tagged against CLAUDE.md §11.

| # | Anti-pattern | Application here |
|---|---|---|
| 15 | BottomSheet for 3+ field forms | Registration steps + admin wizard steps → **FullScreenForm / full-page wizard**. BottomSheet ONLY for the size chip-pickers + grade-suggestion confirm |
| 36 | Destructured-default swallows errors | All new hooks destructure `{data,error}`, check error first |
| 37 | org_id filter first | Admin program/division/fee reads `.eq('org_id', orgId)` first |
| 23/57 | REVOKE PUBLIC + anon | `submit_registration` / `get_public_program`: anon EXECUTE intentional + explicit; revoke PUBLIC, grant anon + authenticated only; everything else stays revoked |
| 20 | ALL/UPDATE policy needs WITH CHECK | Any new write policy ships explicit `with_check` |
| 63 | PATTERN A — one source per concept | "What's owed" = the RPC's authoritative total (server), never a client-only computation persisted |
| 42 | Parallel-system buildup | Reuse `FullScreenForm`/`BottomSheet`/`formatCurrency`/`useReducer` — no new form framework |
| 6 / D11 | 150-line file cap | Wizard decomposed into step components + a `useReducer` cart hook (§6); no file >150 |
| 16.3 | Kindness microcopy | All states use spec §5.6 voice ("Charlie's in", "Spring 2026 isn't open yet…") |
| 16.4 | A11y table-stakes | Each step: labels on every input, focus trap (FullScreenForm has it), Esc, live region on the cart total |
| 21 | Migration mirror same turn | Migration #13-cap (program slug/window) mirrored to repo same turn as MCP apply |
| 27 | Pure resolver/composer | Fee/family-cap estimate is a pure function `estimateCart(divisionFees, policy, kids)` — no client import |

---

## §4. (d) PER-ROLE WIREFRAMES

### 4.1 PARENT — `/r/:slug` entry (public, unauth) — spec §5.2
```
┌─────────────────────────────────┐
│  [Knight logo]                  │  ← org brand (Stage 2, single-org)
│  Legacy Hoopers · Spring 2026   │
├─────────────────────────────────┤
│  Pick a division                │
│  ┌───────────────────────────┐  │
│  │ 11U Girls            OPEN │  │  ← green pill (within reg window)
│  │ Grades 5–6 · $800         │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ 9U Boys      OPENS FEB 24 │  │  ← cobalt pill (before reg_opens_at)
│  │ Grades 3–4 · $800         │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
States: loading→skeleton cards · empty→"Spring 2026 isn't open yet. Drop your
email…" · closed→"Registration for this division has closed." (Q-2: no WAITLIST v1)
```

### 4.2 PARENT — 4-step capture wizard (full-page, unauth) — spec §5.3
```
STEP 1 PLAYER          STEP 2 GUARDIAN        STEP 3 DETAILS (all optional)
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│ ← Cancel  1/4 │      │ ← Back    2/4 │      │ ← Back    3/4 │
│ Player        │      │ Guardian      │      │ Optional      │
│ First / Last  │      │ Name          │      │ Jersey [S M L]│ ← chip pickers
│ DOB  ▾        │      │ Email         │      │ Shorts [S M L]│   (BottomSheet)
│ Grade ▾       │      │ Phone         │      │ Emergency ▸   │
│               │      │ Address       │      │ Medical notes │
│ ⓘ 11U Girls   │      │ Relationship  │      │ [custom Qs]   │
│  is grades 6. │      │ ☐ SMS opt-in  │      │               │
│  Yours is 5.  │      │ + Co-guardian │      │               │
│  [Use 10U →]  │      │               │      │               │
│        [Next] │      │        [Next] │      │     [Review] │
└───────────────┘      └───────────────┘      └───────────────┘

STEP 4 REVIEW + SUBMIT (capture variant — NO Stripe)
┌─────────────────────────────────┐
│ ← Back                      4/4 │
│ Charlie's 11U Girls       $800  │
│ ─────────────────────────────   │
│ Subtotal                  $800  │
│ Family discount            -$0  │ ← animates if 2nd+ kid (estimate→server)
│ ─────────────────────────────   │
│ Due                       $800  │
│ One confirmation · we'll email  │
│ you a link to track payment.    │
│         [ Reserve Charlie's spot ]
└─────────────────────────────────┘
   ↓ on submit (RPC)
┌─────────────────────────────────┐
│ ✓ Charlie's spot is reserved.   │
│   Coach Kenny will confirm the  │
│   week of March 9.              │
│   [ + Add another child ] [Done]│ ← multi-child loop (skips Step 2)
└─────────────────────────────────┘
States (spec §5.5): network err→cobalt banner + retry, cart preserved · already
registered→"Charlie is already registered for 11U Girls." · grade mismatch→inline cobalt
```

### 4.3 ADMIN — program-setup wizard (MVP, authenticated) — spec §3
```
Admin Home  [+ New program]  →  TYPE PICKER
   [ Season ]  [ Tryouts ]  [ Camp ]     (clinic/interest_list/evaluation hidden — §11)

SEASON 5-STEP (FullScreenForm, ~90s)
1 Sport+dates    sport chips · name (auto from dates) · start/end
2 Divisions      add division (name, grades, M/F, fee) · "Copy from prior" if exists
3 Fees           base fee · per-division override · add-ons · (plan default OFF — no Stripe)
4 Reg window     opens (today+14d) · closes (start−7d) · public slug (auto) · publish toggle
5 Review+launch  visual review → [ Launch ]  writes programs+divisions+division_fees
Tryout/Camp = 3-step variants (spec §3.3/§3.4) — DEFER to a follow-up PR; Season ships first
```

---

## §5. DATA-WRITE ARCHITECTURE

### 5.1 Migration #13-cap (the ONE schema add this flow needs) — gap G6
`programs`: `public_slug text UNIQUE` (per-org), `reg_opens_at timestamptz`,
`reg_closes_at timestamptz`, `is_published boolean default false`.
Pre-flight SELECT + post-flight `DO $$` verify; mirror same turn (anti-pattern #21).
NOT a §4.5 migration — that chain is closed (12/12); this is a capture-flow addendum.

### 5.2 `get_public_program(p_slug text)` — SECURITY DEFINER, anon — gap G9
Returns published program + divisions (+ base `division_fees`) for the slug. Filters
`is_published=true`. Never returns PII tables. REVOKE PUBLIC; GRANT anon, authenticated.

### 5.3 `submit_registration(p_payload jsonb)` — SECURITY DEFINER, anon — gaps G1/G2/G5
Atomic: dedupe-or-create player + guardian + `player_guardians`; insert `registrations`
(`status='pending'`); compute fees from `division_fees` + `family_cap_policy`; insert
`registration_fees` (incl. `fee_type='family_discount'` audit row); insert
`player_equipment` from Step-3 sizes. Returns `{registration_ids[], authoritative_total,
already_registered}`. Hard input validation (anon-exposed). REVOKE PUBLIC; GRANT anon.
Explicit `with_check`-equivalent guards in-function (program published + within window +
grade band).

### 5.4 Account claim — gap G3 (Open Q-1)
Edge function `register-submit` wraps the RPC, then `auth.generateLink` → emails guardian
a magic claim link. MVP fallback: skip auto-claim, admin invites later. **Q-1 for Frank.**

---

## §6. COMPONENT / FILE BREAKDOWN (every file ≤150 lines — anti-pattern #6)

```
src/pages/
  RegisterEntryPage.jsx        slug→program list (uses usePublicProgram)         ~80
  RegisterFlowPage.jsx         wizard shell + step router (useReducer cart)      ~120
  admin/ProgramSetupPage.jsx   type picker + season wizard shell                 ~120
src/components/register/
  DivisionCard.jsx             OPEN/CLOSED/OPENS pill + fee                       ~70
  StepPlayer.jsx  StepGuardian.jsx  StepDetails.jsx  StepReview.jsx               ~120 ea
  RegisterConfirm.jsx          success + multi-child loop                         ~70
  CartSummary.jsx              line items + family-cap (estimate, live region)    ~90
src/components/admin/program-setup/
  TypePicker.jsx  SeasonStep1..5.jsx                                              ~100 ea
src/hooks/
  usePublicProgram.js          get_public_program RPC wrapper {data,error,...}    ~50
  useRegisterCart.js           useReducer cart + estimateCart (pure)             ~90
  useSubmitRegistration.js     submit_registration RPC + optimistic confirm       ~60
  useProgramSetup.js           admin writes (programs/divisions/fees)             ~90
src/lib/
  estimateCart.js              PURE: (fees, policy, kids) → totals (anti-pattern #27) ~40
supabase/migrations/  <ts>_programs_public_slug_window.sql   (#13-cap)
supabase/functions/register-submit/  (edge fn — Q-1 dependent)
```

---

## §7. (e) EXPLICIT OUT-OF-SCOPE

NOT touched in this build (each with where-it-goes, so nothing silently drops):
- **Stripe / Step-4 payment / Apple Pay** → "Stripe first" track (needs payment_plans #13 + integration)
- **§8 Payment Lifecycle** (installments, receipts, savings summary, failed-recovery, refund) → same track
- **§6 Family Home + cross-org conflict** → multi-org track (St Pat's 2027)
- **§7 Communication re-IA** (global inbox, briefing surface) → multi-org track
- **Waitlist + division capacity** (spec §5.5 WAITLIST pill, $100 deposit) → needs `divisions.capacity` + promote/credit machinery (Open Q-2)
- **Tryout + Camp admin wizards** (spec §3.3/§3.4) → follow-up PR after Season ships
- **Returning-parent 30-second re-registration** (spec §5.8) → needs card-on-file (Stripe) → deferred
- **Magic-link account claim** → Q-1; MVP may ship admin-invite-later instead
- **Roster builder / promote-to-season** (spec §9, Q11) → admin MVP, separate
- **Custom-form-template inheritance UI** → Phase 6 (spec §11)

---

## §8. PR SEQUENCE (implements the locked decisions)

| PR | Scope | Gate |
|---|---|---|
| **A** | Migration #13-cap (program slug/window) + `get_public_program` + `submit_registration` RPCs (+ verify, advisors, mirrors) | schema/security — get_advisors clean |
| **B** | Parent entry: `/r/:slug` `RegisterEntryPage` + `DivisionCard` + `usePublicProgram` | renders published program read-only |
| **C** | Parent wizard: Steps 1–3 + `useRegisterCart` + `estimateCart` (pure, unit-tested) | grade-band + family-cap estimate |
| **D** | Parent Step 4 review + submit + confirm + multi-child loop (`useSubmitRegistration`) | end-to-end pending registration |
| **E** | Account claim (Q-1 outcome) — edge fn OR admin-invite path | guardian can see status |
| **F** | Admin Season setup wizard (`ProgramSetupPage` + steps + `useProgramSetup`) | admin creates a real program |
| **G** | Admin program detail (registrations list, light) + record-payment link to existing flow | admin sees + reconciles |

Each PR: manual verification checklist (CLAUDE.md Rule 10), ≤150-line files, cross-role
test where applicable (anti-pattern #43), auto-merge per §15.

---

## §9. OPEN QUESTIONS FOR FRANK (resolve before PR A)

- **Q-1 (account claim):** On submit, email the guardian a magic-link to claim their
  account + track status (edge function), OR ship MVP where the registration just lands
  `pending` and you invite the parent later from admin? (Recommend: **magic-link** — it's
  the spec's intent and closes the loop for the parent. But it adds an edge function to PR E.)
- **Q-2 (waitlist/capacity):** v1 renders divisions OPEN/CLOSED by reg window only (no
  capacity cap, no waitlist). Confirm that's acceptable for the LH pilot, or is waitlist
  load-bearing for any division this season? (Recommend: **OPEN/CLOSED only** — LH had no
  capacity caps in the LeagueApps data; waitlist is a real feature but its own build.)
- **Q-3 (admin wizard breadth):** Ship **Season** wizard first (the pilot need), Tryout +
  Camp as a follow-up PR? (Recommend: **yes, Season first**.)

---

**End of audit.** PR A does not start until Q-1/Q-2/Q-3 are answered. Ledger §4 to be
reconciled in the same PR that opens PR A (anti-pattern #45).
