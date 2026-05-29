# EMBER TENANCY ARCHITECTURE v3

**Status:** Canonical multi-tenant + multi-sport architecture. Reconciled against
production + the §17.5 audit campaign + the 2026-05-29 Category #30 fixes.
**Date:** 2026-05-29 · **Replaces:** v2 (April 25, 2026 — brand/auth foundation, retained below).
**Reconcile every multi-tenant / multi-program decision against this document.**

This doc is the architecture reference for how Ember runs multiple organizations
(tenants), multiple sports, and multiple seasons. It feeds the multi-program design
work. Companion docs: `LH_OPS_SPEC.md` (how the first org operates), `LH_BRAND_CONTENT_MODEL.md`
(brand tokens/content), `LEAGUEAPPS_PARITY_REVIEW.md` (incumbent model + scope decision),
`AUDIT_WAVE_3B_2026-05-29.md` (#28 second-tenant blockers), `docs/external-data/README.md`
(St. Pats CSV schema implications), `PLATFORM_PRIORITIES.md` §17.2 (second tenant = Spring 2027).

---

## 0. What changed v2 → v3 (read first)

v2 described the brand/auth flip and assumed one org. v3 makes the platform genuinely
multi-tenant + multi-sport. The substantive additions:

1. **Multi-org membership is now a near-term requirement, not "Phase 6."** Frank is admin
   of Legacy Hoopers AND on the St. Patrick's board → one `user_id` needs rows in two orgs.
   The current schema + AuthContext forbid this (see §3 blockers).
2. **Per-org email plumbing** — sender identity comes from `organization_settings`, not a
   hardcoded `@legacyhoopers.org` constant.
3. **All-seasons financial scoping doctrine** (§4.AW) + **AP #63** (same-concept-one-source).
4. **Multi-sport / multi-program data model** (§5) — divisions, per-sport equipment,
   line-item fees — derived from the real St. Pats CYO export.
5. **Governing posture: Option A "sit-on-top"** (§7) — Ember is the engagement/comms/
   schedule layer; LeagueApps stays registration + AR system-of-record for the
   St. Patrick's timeframe.

---

## 1. Tenancy model

Ember is the SaaS platform. Legacy Hoopers, St. Patrick's CYO, and future clubs are
**tenants ("orgs")**. One front door, branded interior per workspace (the Slack/Notion
model). This is the direct analogue of LeagueApps' **"site"** concept (org = site; see
parity review) — except Ember's onboarding target is **minutes, not a 4-hour admin
training**.

- Every domain table carries `org_id` (or is FK-scoped to a parent that does — see §11.5
  ground-truth tables). RLS scopes every row to the user's org via
  `current_user_org_id()` (SECURITY DEFINER, STABLE). **Never call it on `org_members` →
  infinite recursion.**
- Org-scoped query contract (AP #37): `.eq('org_id', orgId)` first on org-scoped tables;
  FK-scoped tables inherit scope through their parent.

---

## 2. Brand model (retained from v2 — still accurate)

Two-stage flip:
- **Pre-auth (Ember surface):** Phoenix mark, gold/navy, "Coach more. Coordinate less.",
  one unified login URL. LoginPage MUST reset brand tokens to Ember defaults on mount.
- **Post-auth (org surface):** org `logo_url` + `brand_colors` jsonb (keys: accent,
  accent_hover, accent_soft, header, text_on_dark) applied by AuthContext via CSS variable
  overrides on `document.documentElement`. LH override: cobalt `#4a8fd4`.

Branding failure modes (NULL brand_colors → Ember defaults; malformed hex → skip+warn;
logo 404 → letter-circle fallback; org_id points to deleted org → sign out) are unchanged
from v2 and remain the contract. Token values are LOCKED per CLAUDE.md §3 (cool-gray, not
warm). Full token/content detail lives in `LH_BRAND_CONTENT_MODEL.md`.

---

## 3. Database model (current production) + the second-tenant BLOCKERS

### Current state (verified)
- `organizations`: id, name, slug, sport, display_name, tagline, primary_domain,
  logo_url, brand_colors (jsonb), public_listing_enabled, stripe_account_id,
  subscription_plan/status, created_at.
- `organization_settings`: from_email, from_name, reply_to_email, pilot_test_recipient_email,
  pilot_mode_enabled, notification_channels (jsonb: defaults + per_category +
  emergency_override_bypasses_quiet_hours).
- `user_roles`: id, user_id, organization_id, role ∈ {admin, coach, parent}.

### Wave 3.B #28 — the 5 P0 blockers a second tenant needs (OPEN; multi-tenant arc, parked)
1. **`user_roles_user_id_key` is `UNIQUE(user_id)`** → must become
   `UNIQUE(user_id, organization_id)`. Verified safe (5 rows / 5 distinct users / 0 FKs).
   **BUT the migration alone is a trap:** `AuthContext.loadMembership` resolves the role
   with `.maybeSingle()`, which THROWS on >1 row. So the constraint reshape MUST ship with
   org-aware role resolution (AuthContext + `autoLinkGuardian` + ~5 edge functions that do
   `user_roles.select('role')` all assume one row). The multi-org switcher (v2 called it
   "future Phase 6") is now part of this work.
2. **Email FROM/reply-to** — read `organization_settings.from_email/from_name/reply_to_email`
   everywhere (the `_reminderSend` + ~13 resolver/send files hardcode `@legacyhoopers.org`).
   Columns already exist — do NOT add parallel `organizations.*` columns (AP #42).
3. **`public_listing_enabled DEFAULT true`** → flip to `false`; orgs opt in after content review.
4. **unsubscribe-handler** hardcodes "Legacy Hoopers" branding → per-org via org email context.
5. **Admin onboarding path** — only `invite-parent` exists; need `invite-admin` (or generalize).

`brand_colors`, `logo_url`, `public_listing_enabled`, `organization_settings` exist in the
DB but have **no admin UI** (Wave 3.B #28 PATTERN BETA) — provisioning is SQL-only today.

---

## 4. Authentication flow (v2, amended for multi-org)

Pre-auth: Ember defaults. Sign-in: Supabase session → AuthContext fetches user_roles + org
→ applies branding → routes home. Sign-out: clear overrides → revert to Ember → /login.
Edge cases (token refresh doesn't re-brand; multi-tab sign-out broadcast; expired-session
modal) unchanged.

**Amendment (multi-org):** once `user_roles` allows multiple rows per user, `loadMembership`
must (a) fetch ALL memberships, (b) pick the active org (persisted preference, default
most-recent), (c) expose an **org-switcher** between auth and app. This is the load-bearing
change that turns the brand flip into a true multi-tenant session.

---

## 5. Multi-sport / multi-program data model (NEW — grounded in the St. Pats CYO export)

Source: `docs/external-data/` (St. Pats/SPA CYO CSVs) + `LEAGUEAPPS_PARITY_REVIEW.md`.

- **Hierarchy:** Org (site) → Season ("grouped master") → Division → Team → Roster.
  A season fans out into per-age-group/division sub-programs (e.g. 11U Girls, 10U Black/Blue,
  9U/8U Boys), each with its own registration state, schedule, roster, staff, teams, invoices.
- **Division key = `{grade} + {gender}`**, NOT `team_id`. Needs a division lookup per org.
- **Sizes are per-season-per-sport** → `player_equipment(player_id, season_id, sport_id, …)`.
  Multi-sport breaks the one-size-per-player assumption (today sizes live on `roster_members`;
  this is their multi-sport evolution). 8-value size enum, **nullable** (St. Pats: 7 unset/file).
- **Fees are line-item**, not a single price: resident/non-resident, family pass, playoff
  add-on. Architecture must expect a line-item fee model.
- **Team placement happens AFTER registration** (registration "Team Name" = Unallocated).
  Do NOT bind team assignment to the registration record.
- **Jersey #** unique per division per season: `UNIQUE(org_id, team_id, season_id, jersey_number)`
  (team_id implies org_id via FK — org_id is defense-in-depth).
- **Schedule import** has no `org_id` and no home/away flag → importer scopes to the importing
  org and derives home/away from `Location` = home venue (store it explicitly on import).
- **Dead enrollment fields** (allergies, school, CCD agreement — 0 fills) → drop or make
  non-blocking optional. Ember's wedge is simplicity.

---

## 6. Financial scoping doctrine (§4.AW + AP #63)

- **"Owes money" indicators** (roster payment dot, families-owing lane, overdue alert) read
  the canonical **`family_balances`** view across **ALL seasons** — money owed doesn't expire
  at a season boundary. Source-of-truth is `financial_accounts`/`financial_transactions`, never
  the legacy `roster_members.payment_status` (retired from UI, PR #582).
- **Collection-rate %** stays **season-scoped** and is **labeled** "this season" so it doesn't
  read as a contradiction next to an all-seasons balance.
- **AP #63 (PATTERN A):** any concept rendered on >1 surface uses one source at one scope (or
  labels the scope). The dominant platform bug class — lock cross-surface invariants per AP #43.
- `family_balances` grain = per (guardian, season): balance_cents, net_paid_cents, last_payment_at.

---

## 7. Governing posture — Option A "sit-on-top" (from the parity review)

For the St. Patrick's timeframe (second tenant ~Spring 2027 per §17.2): **Ember is the
engagement / comms / schedule / records layer; LeagueApps remains the registration + accounts-
receivable system-of-record.** Ember imports from LeagueApps (schedule, roster, enrollment)
rather than replacing registration. Option B (Ember replaces LeagueApps registration + AR) is
a later, larger build. The multi-sport data model (§5) is designed so Option B remains open
without a rewrite.

---

## 8. Onboarding runbook (target: ~1.5h, was 10–15h)

Per Wave 3.B #28 (17 cataloged steps; 6 work today / 11 manual-or-missing). After the §3
blockers close: (1) INSERT organizations + organization_settings (brand, email identity,
pilot_mode_enabled=true), (2) public_listing_enabled stays false until content review,
(3) invite first admin via `invite-admin`, (4) import LeagueApps data (Option A), (5) verify
branded sign-in + per-org email FROM. Pilot mode gates all outbound until the org opts in.

---

## 9. Threat model (amended from v2)

1. Org enumeration via login — mitigated (identical Ember login).
2. Org row enumeration via API — Wave 1 RLS fixes applied; re-verify before org #2 onboards.
3. Cross-tenant data leak — RLS via `current_user_org_id()`; app-layer org_id filter is
   defense-in-depth (AP #37).
4. SECURITY DEFINER exposure — REVOKE from PUBLIC **and** anon (AP #23/#57); audited via
   `get_advisors`.
5. Branding spoof via jsonb — regex-validated; logo admin-only (SQL today).
6. Pilot blast radius — `pilot_mode_enabled` + `is_pilot_family` gate every outbound send
   (verified: dispatcher sends to 0 while pilot on with 0 pilot families).

---

## 10. Open decisions for the design chat

- Org-switcher UX (where it lives in the post-auth flow; default-org persistence).
- Division model surfacing in the program-setup wizard (grouped-master season UX).
- Registration: Option A import flow now vs Option B native registration later — what the
  setup wizard promises in each.
- Brand/settings admin UI (closes #28 PATTERN BETA — provisioning without SQL).
- player_equipment surfacing (per-sport sizing) in roster/registration.

---

## Appendix — V2 EXPERIENCE LAYER (retained, still current)

The v2 polish layer remains the spec for auth-flow UX: loading-states catalogue (cold load
Phoenix + pulsing dots, brand-transition ~700ms, session-expired modal), microcopy catalogue
(tagline, wrong-password, network-failure, session-expired, invite strings — no "Oops"),
first-time experiences (parent → home; coach → dismissible welcome; admin → 4-item checklist),
error-recovery flows, polish/delight (Phoenix entrance, sign-in checkmark, haptics), critical
CSS inline strategy. These are unchanged by v3 and ship with the multi-tenant work.
