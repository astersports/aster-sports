# L99 — DELIVERED vs REMAINING ASSESSMENT (2026-05-27)

> Comprehensive product review commissioned by Frank after the ledger §4
> wrongly reported "no unblocked feature build remains." Built by reading
> the canonical plan set in full (`SKYFIRE_BUILD_QUEUE_v2`, `LH_OPS_SPEC`,
> `LH_BRAND_CONTENT_MODEL`, the L99 state/audit/redesign docs,
> `CUTOVER_WAVE_GAP_AUDIT`, `BRIEFINGS_COVERAGE_L99`,
> `EMBER_TENANCY_ARCHITECTURE_v3`) and cross-verifying every item against
> the actual code (`src/`, `supabase/`) + DB (68 tables, 12 edge functions).

## 0. Headline correction

The ledger §4.0 "no unblocked feature build remains" was **wrong** — it
had a narrow "feature arc" lens and never tracked the `LH_OPS_SPEC` /
`LH_BRAND_CONTENT_MODEL` / ELITE-stack / push-notification surface. There
is a **substantial real backlog**, plus two doctrine decisions and a
handful of small live bugs. Frank's skepticism was correct.

**Adoption reality (DB):** `game_results` 51 rows (team scoring in active
use), but `game_plays` 2 rows + `player_game_stats` 0 rows + `invitations`
0 + `event_coach_assignments` 0 → several built features are unadopted.

---

## 1. DELIVERED (shipped + verified in code)

Core platform is broad and real:
- **Parent home** (Phase 1): MY TEAMS, ActionZone signals, LIVE NOW,
  recognition, tournament banner, payment reminders, density toggle.
- **Coach home** (Phase 2): alerts, roster snapshot, action queue,
  messaging block, quick actions, rides-today.
- **Admin home** (Phase 3): KPI grid, action queue, pending-queues lanes,
  program health, recent activity, shortcuts.
- **Schedule / Events / RSVP**: list + games + standings, event detail,
  3-state optimistic RSVP, create/edit wizard, opponent + location mgmt.
- **Records / Tournaments / Achievements**: records page, tournaments
  first-class, standings, achievement badges, game_results (51 rows live).
- **Live scoring**: scoreboard, action grid, subs, play-by-play, undo
  (built; barely adopted — 2 plays).
- **Messaging**: team chat, channels, DM threads, unread badges.
- **Briefings engine**: 9 canonical kinds, composer + device-frame
  preview, RESOLVER_REGISTRY, send pipeline (edge fns), scheduled sends,
  coach_roundup + family_guide + schedule_change + rsvp_nudge + callup +
  weekly_digest, tournament schedule parser, coverage delegation (PR6).
- **Financials**: dashboard, LeagueApps import, record payment, season
  rollover.
- **Rides**: schema + parent UI + coach section + admin aggregate widget.
- **PWA**: sw.js + manifest + apple-touch-icon. **A11y**: ongoing.
- **QR public-schedule share** (#531). **Calendar subscribe** (webcal/ics).

---

## 2. DECISIONS NEEDED FROM FRANK (block real work either way)

| # | Decision | Why it matters |
|---|---|---|
| D1 | **Per-player game stats** — §16.12 says "do not build in 2026," but the surface IS built + routed (`PlayerProfilePage` at `/teams/:teamId/player/:playerId`, `BoxScore`/`GameBoxScore`, `finalizePlayerStats` upsert, `player_game_stats` table) — just **dormant (0 rows)**. Either un-block the policy (feature is ~done) or gate/remove the UI. | Doctrine contradiction; shipped code violates a stated lock. |
| D2 | **Briefing feedback survey** — built then fully reverted (#509). Rebuild lighter, or shelve permanently? | §7 open product call. |
| D3 | **Parent-invite QR (6-A)** — shelved, but the `invitations` token table (token/role/team/player_ids/expiry/accept lifecycle) **already exists** (0 rows, no accept flow). Revisit, or keep shelved? | I previously mis-reported "no infra." |

---

## 3. BUGS (small, real, fixable now)

| Bug | Location | Effort |
|---|---|---|
| `tournamentRecap.js:115` hardcodes org name/site/contact/logo, discarding the fetched `org.name` (`tournamentPrelim` does it right) — multi-tenant leak | `src/lib/engine/resolvers/tournamentRecap.js` | ~3 lines |
| RESOLVER_REGISTRY `anchorFromState` entries (rsvp_nudge/callup/family_guide/coach_roundup) lack null-validation → cryptic downstream throws (AP #28) | `registry.js` | S, 1 PR |
| `--em-text-meta` (#6B7280) WCAG-AA token is specced in CLAUDE.md §0 but **never added to `index.css`** → tertiary text fails AA (~3.4:1) | `src/index.css` + ~40-60 surfaces | M |
| Orphan dead code: `briefings/inbox/EmptyState.jsx` (no importer) | — | trivial |

---

## 4. FEATURE GAPS — by phase (genuinely unbuilt)

### Phase 2 — Coach
- **Rotation Planner + minutes/substitution derivation** — no code/schema. (Engagement-adjacent; not the §16.12 game-stats lock.) ~1-2 sessions.
- **Roster Health dashboard** — coach attendance-trending + auto-draft outreach. Data layer (attendance views) exists; surface unbuilt. ~1-2 sessions.
- **Coach compensation personal view** — coach-home accrual card ("$X pending · N sessions"). Backend exists (`useCoachPayoutsPending`, rates); surface missing. ~1 session.

### Phase 3 — Admin
- **Admin compensation dashboard + monthly invoice/1099 generation** — only pending-payouts partial. ~2 sessions.
- **Content CMS** — Academy Standards / policy pages / markdown editor. ~1-2 sessions.
- **Hotel code distribution** (ELITE-36). ~1 session.
- **Admin settings configurator (4-B)** — `AutoNotificationSettingsSheet` partial; full multi-category cadence/deadline/nudge config incomplete. ~1 session.
- **Tournament rules structured editor** — `tournaments.rules` JSONB exists; admin form partial. ~1 session.

### Briefings engine remainder
- **`games_recap` kind (G1)** — Frank's stated *primary* coverage ask; entirely absent (no `games_recap`/`multi_event` anchor). ~1 session.
- **`event_reminder_due` cadence (4.4-E)** — literal `skipped:"not_implemented"` stub (`briefing-auto-draft-tick:83`); powers §16.5 Stream A reminders. 2-3 sessions.
- **Draft auto-archive cron (Option C PR D)** — only unshipped Option C PR; drafts pile up. ~1 session.
- **DB-driven templates (4.4-I)** — `briefing_templates` table exists but composer still reads hardcoded JS starters. ~2 sessions.
- **Engagement route + home card + bulk-approve (4.4-B)** — per-recipient metrics exist in history; dedicated surface + Gmail-style multi-select don't. ~2-3 sessions.
- **Legacy column cleanup (4.4-J)** — `headline`/`sub_context`/`body_notes`/`coach_user_ids` still live + written. Tech-debt. 1-2 sessions.
- Scrimmage recap subject (G6/E1, ~3 lines); multi-team recap renderer (E6).

### Notifications — the single biggest gap
- **Push notification infrastructure is entirely absent** — no VAPID, no `pushManager`, `sw.js` is cache-only, no `push_subscriptions`. Everything "notification" today is in-app prefs + email. Blocks: Stream A event reminders (3d/1d/4h), automated Stream B RSVP nudges (T-4h/T-1h), OS-permission banner, push delivery of all triggers. **L effort; gates a whole spec section (OPS §5, §16.5).**

### Parent self-service + messaging
- **Claim-a-Player** — guardian/kid linking is admin-only; no parent claim flow. ~M.
- **Player Followers + Emergency Contact tabs** (OPS §3.5/3.6) — unbuilt.
- **Message reactions** (`message_reactions` specced) + **attachments** — no reaction bar / long-press / attachment picker. M.

### Brand / delight cluster (LH_BRAND_CONTENT_MODEL — differentiators)
- Run-of-Play / Head-to-Head / "Moments" narrative auto-gen (records). M.
- Event-type arrival reminders (5-min practice / 15-min game auto-surface).
- RSVP-deadline countdown banner (AAU Fri-noon / League 48-24h).
- "Car Ride Home" post-game parent reminder.
- Academy Standards / Code of Conduct in-app handbook; 24-Hour Rule surface; blackout dates.

### Accessibility / i18n / perf
- **Translation EN↔ES (§16.6)** — zero i18n infra (no lib, no extraction). Locked Phase-3 principle, no foundation. **XL.**
- A11y: `--em-text-meta` adoption (above); full `@axe-core` pass before parent rollout (rule #14).
- Long-list virtualization (ELITE-10, >30 items).

### ELITE memory layer (need new schema)
- Yearbook PDF, photo wall, audit-log table, anonymous suggestion box, coach-feedback survey, birthday wishes — all grep-empty, each multi-session.

---

## 5. DEFERRED-BY-DESIGN / ASPIRATIONAL (do NOT build now)

- **Multi-tenant / multi-org** (org switcher, 2nd-org onboarding, 63-file tz hardcodes, weather coords hardcoded to Westchester) — ASPIRATIONAL until org #2 (scoped Q1 2027 per spec).
- **Native (Capacitor iOS/Android, APNs/FCM, App Store)** — Phase 5.
- **Platform/billing (Stripe, super-admin, marketing site, registration builder)** — Phase 6-7 (2027).
- Rides v2 interactive (CTAs/arrival-return split/waitlist UI).
- Weather-in-briefings (indoor near-no-op); detailed-digest toggle; circuit-aware digest split.
- `financial_transactions` over-fetch (perf, fine at scale); AdminHomePage decomposition (cap-triggered).
- Compose-briefing P2 catalog (41 findings, §4.AH) — defensive-validation/perf backlog.
- 31 renderer hex literals → colors.js; shared-component dedup; recipient-preview chip.

---

## 6. BLOCKED-ON-FRANK (action items, not code)

- **family_guide PR 5** — one wizard send (Charlie+Milo) flips to shipped.
- **§4.K** — grant GitHub workflow-read token scope.
- **§4.F** — PostHog GeoIP help-desk ticket (free-tier limitation).
- **Cluster 1** — tournament-results data entry (Quick Score backfill).

---

## 7. PROPOSED L99 PLAN (sequenced)

**Wave A — Decisions + quick wins (this week)**
1. Resolve D1 (per-player stats) — biggest leverage: if un-blocked, a whole feature is ~free; if not, gate the UI.
2. Ship the 3 small bugs (tournamentRecap org hardcode, registry null-validation, `--em-text-meta` token + adoption start).
3. Frank actions: family_guide send, §4.K token, §4.F ticket.

**Wave B — Briefing engine close-out (highest-confidence, self-contained)**
4. `games_recap` kind (Frank's primary ask).
5. Draft auto-archive cron (Option C PR D).
6. DB-driven templates (4.4-I) + legacy column cleanup (4.4-J).

**Wave C — Notifications spine (largest single gap; unlocks a section)**
7. Push infrastructure (VAPID + `push_subscriptions` + SW handlers + send path).
8. `event_reminder_due` Stream A + automated Stream B cadence (depends on 7).

**Wave D — Coach/Admin feature gaps**
9. Coach comp personal view → Admin comp dashboard + invoices.
10. Roster Health dashboard. Rotation Planner (if D1 clarifies stats scope).
11. Content CMS, hotel codes, admin settings configurator.

**Wave E — Brand/delight + parent self-service**
12. Run-of-Play/Head-to-Head narrative; arrival/RSVP-countdown/Car-Ride-Home; Academy handbook.
13. Claim-a-Player; message reactions + attachments.

**Wave F — Big rocks (scope before committing)**
14. Translation EN↔ES (XL). ELITE memory layer (schema-heavy). Then native (Phase 5).

**Deferred to 2027:** multi-tenant hardening, platform/billing.
