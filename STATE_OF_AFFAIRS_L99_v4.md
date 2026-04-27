# STATE OF AFFAIRS L99: v4
## Legacy Hoopers / Ember Platform Build

**Written:** April 27, 2026 (evening)
**Verified against production:** April 27, 2026 ~22:30 UTC via direct Supabase + Vercel + git queries
**Production main HEAD at writing:** `a54a761`
**Latest production migration:** `20260427190412` (Ship 7.2 schema drift fix)
**Supersedes:** STATE_OF_AFFAIRS_L99_v3.md (April 23, 2026), now stale.
**Evidence basis:** Live Supabase MCP queries against project `vrwwpsbfbnveawqwbdmj`, live Vercel API, audit zip `rides-audit-source.zip` (108KB, 79 source files), and CC terminal output verified within this session.

---

# HOW TO USE THIS DOCUMENT

This document is written from **verified live evidence**, not from conversation memory. Every claim has a citable source: a SQL query, a git commit, a deployment ID, or a file at a documented path.

If this document says "Feature X is shipped," it IS shipped. If it says "Bug Y is closed," it IS closed. If it conflicts with anything in `userMemories`, the document wins.

The handoff protocol (`NEW_CHAT_STARTER_PROMPT.md`) requires the new chat to verify this document's contents before executing any work. Do not skip that verification.

For decisions, environment, and design tokens unchanged since v3, this doc references v3 rather than restating. Read v3 once for those, then this doc going forward.

---

# PART 1: HEADLINE FINDING (READ FIRST)

## "Acting-as" is NOT a feature in Skyfire/Ember.

This is the single most important fact in this document. The April 27 audit (`audit/AUDIT_SYNTHESIS_2026_04_27.md`) confirmed via direct source-code read:

- `AuthContext.jsx` exposes a single `role` value derived from `user_roles.role` for `auth.uid()` at sign-in. There is no `actingAsRole`, no `switchRole()`, no role-impersonation surface anywhere in the codebase.
- Frank's two test accounts (`admin@legacyhoopers.org` and `fsamaritano@gmail.com`) are two separate Supabase auth users. They share Frank's name on the guardian record because Frank is genuinely a guardian for Charlie + Milo. They are NOT the same session pretending to be different roles.
- The "phantom acting-as bugs" reported in earlier sessions (phone autofill leaking into the wrong account, name appearing in offers when it shouldn't, etc.) were **correct behavior across two real accounts**, not a feature flaw.

This finding alone killed ~15 hours of phantom Phase D.3 "fix the role switcher" work and reset the entire Phase 1.5 remediation plan.

## What the audit did fix (Tier 1, all shipped April 27)

| Finding | Fix | Status |
|---|---|---|
| H2 schema drift: `events.ride_coordination_enabled` (default true) was read by EventRidesTab + RPC, while `events.enable_rides` (default false) was written by wizard. Two columns never connected. The Enable Rides toggle was dead UI. | Migration 20260427190412 dropped the dead column, RPC re-pointed to `enable_rides`. EventRidesTab.jsx:23 flipped from `!== false` to `=== true`. Commit `0655083`. | ✅ SHIPPED |
| H3 P0 SECURITY: 21 SECURITY DEFINER functions callable by anon role via `/rest/v1/rpc/<n>`. Attacker could bypass RLS to claim/cancel ride offers, peek at private user data, and more. Live in production. | Migrations 20260427185842 + 20260427185927 revoked EXECUTE from PUBLIC + anon for all 21 functions, with proper handling of PUBLIC inheritance gap (caught mid-migration). | ✅ SHIPPED |
| H4 brittle RLS: `ride_claims_insert` policy was admin-only. Parents worked only via SECURITY DEFINER RPC bypass. Defense-in-depth gap. | Migration 20260427185842 broadened the policy to permit rider self-insert against active offers in same org, OR admin override. RPC keeps working unchanged. | ✅ SHIPPED |
| B5 confusing claim form copy: pickup_address label suggested every rider needs door-to-door pickup. Notes placeholder was driver-side, not rider-side. | Commit `ddde265` reworded label to "Need door-to-door pickup? (optional)" with helper microcopy explaining most riders meet at offer's pickup spot. Notes label became "Anything the driver should know?" with rider-relevant placeholder. | ✅ SHIPPED |

All 4 Tier 1 ships passed Frank's phone test on v2 preview before merging to main. Production deploy `dpl_AGa7hBFuiVzfz5RPhTpAzpKo6YjA` is READY.

---

# PART 2: VERIFIED PRODUCTION STATE (April 27, evening)

## Database

**Source of truth:** Live SQL queries against project `vrwwpsbfbnveawqwbdmj` at ~22:30 UTC.

| Metric | Value | Notes |
|---|---|---|
| Public-schema tables | **46** | up from 36 in v3 |
| Production migrations applied | **42** | up from 12 in v3 |
| Latest migration version | `20260427190412` | Ship 7.2 schema drift fix |
| Teams | 5 | 11U Girls, 10U Black, 10U Blue, 9U Boys, 8U Boys |
| Players | 63 | unchanged from v3 |
| Guardians | 120 | one fewer than v3 (one removed) |
| Tournaments | 9 | for Spring 2026 |
| Events | 140 | 17 games, 89 practices, 34 tournament games |
| Ride offers (lifetime) | 15 | real production data |
| Ride claims (lifetime) | 5 | real production data |

## Schema drift status

**Tables added since v3 migrations 001-012** (ship list, abbreviated):

`event_ride_offers`, `event_ride_claims`, `coaching_assignments`, `game_results`, `team_achievements`, `user_preferences`, `event_notifications`, `tournament_pool_teams`, `roster_members`, `player_activations`, `player_tags`, `org_announcements`, `guardian_notification_prefs`, `message_drafts`, `championship_scenarios`, `tournaments_rules` (column on tournaments, JSONB).

**Tables documented with migration files (`supabase/migrations/`):** all of the above are now backed by either the original 001-012 set or the 13+ structural migrations applied April 23 onward.

**Tables that were "off-migration" in v3** are now mostly tracked. Remaining drift documented in `supabase/migrations/RECOVERY_NOTES_2026_04_27.md` (committed today as Ship 7.10).

**Column changes since v3 worth noting:**

- `events.ride_coordination_enabled`: **DROPPED** in Ship 7.2 (was dead UI gate, replaced by `enable_rides`).
- `events.enable_rides`: boolean, default false, NOT NULL. Wizard writes correctly. Active in 17 games + 1 practice + 34 tournaments.
- `event_ride_offers.status`: has cascade trigger as of 20260427131334 (cancelling offer cascades cancellation to active claims).
- `event_ride_claims.status`: waitlist promotion now gated on `offer.status='active'` (closed cancellation race).

## Migration history reconciliation

Local `supabase/migrations/` directory has **37 entries**: 33 numbered files (001-033, with intentional gap at 031) + 4 timestamp-prefixed files (recovered today as Ship 7.10) + `RECOVERY_NOTES_2026_04_27.md`.

Production `supabase_migrations.schema_migrations` table has **42 entries**: 28 in old numbered format (001-028), 14 in timestamp format (20260425+).

**Drift breakdown (5-migration gap):**
- 4 are local-numbered (029, 030, 032, 033) which match prod by content but differ by version naming convention. These were applied via `supabase migration repair` historically and considered settled.
- 1 is `20260426111421_tournament_times_correction`: applied prod-only via MCP April 26, intentionally not in local repo (one-off data correction, deferred per recovery scope).

**6 other April 26 prod-only migrations** are also intentionally not in local repo: all are one-off data corrections (`data_integrity_fix`, `data_corrections_resurrection_jersey`, `resurrection_address_correction`, `venue_address_corrections_and_canonical_urls`, `rename_cardinal_spellman_to_cyo_spellman`). Their bodies are queryable from `supabase_migrations.schema_migrations.statements` if needed for replay against another env.

## Application

**Source of truth:** github.com/LegacyHoopers/skyfire-app at SHA `a54a761` on branch main.

| Metric | Value | Notes |
|---|---|---|
| Production main HEAD | `a54a761` | merge of Phase 1.5 Tier 1 ships + Ship 7.10 |
| v2 HEAD | `ddde265` | clean tree, audit zip untracked |
| Production deploy ID | `dpl_AGa7hBFuiVzfz5RPhTpAzpKo6YjA` | READY |
| Vercel project | `prj_peID30eF61qubU90e1TVvM1kikuP` | team `team_95cqArODGT4Ub8nQ5lKWqGY4` |
| Production URL | `app.legacyhoopers.org` | + `skyfire-app.vercel.app` |
| Edge functions | 1 | `invite-parent` (JWT verification OFF) |

## Security advisor state (post Ship 7.1)

| Lint type | Count | Notes |
|---|--:|---|
| **anon-callable SECURITY DEFINER** | **0** | down from 21. Real attack vector closed. |
| authenticated-callable SECURITY DEFINER | 11 | all expected: `claim_ride_offer`, `cancel_ride_claim`, `get_event_ride_state`, 6× `current_user_*`, `user_has_role_in_org`, `event_org_matches`. Riders need claim/cancel; RLS policies need helpers. Advisor noise, not risk. |
| auth_rls_initplan (perf) | ~50 | unchanged from v3. Targeted by Ship 7.7 (in progress this session). |

---

# PART 3: WHAT CHANGED SINCE v3 (April 23 → April 27)

## Phase 0B (migrations 013-021 from v3 plan): COMPLETE

All 8 designed migrations + the destructive 021 plus several others actually shipped. Live schema state is well past v3's roadmap.

## Phase 1.5: 3-day rides outage + rebuild (April 24-27)

**Sequence:**

1. **April 24-25:** Phase 0C / 1 work briefly, then a deploy bug took the rides feature down in production for 3 days (ghost claims, offers not appearing, ride coordination gate not firing, etc.).
2. **April 25-26:** Full rides rebuild. Old `useRides` / `RideCard` / `RideFormOverlay` components deleted. New offers/claims data model with separate tables (`event_ride_offers`, `event_ride_claims`) replaced the unified `event_rides` design from migration 004. Phase A→B→C→D ship sequence on v2.
3. **April 26 evening:** Phase D.2 Ships 1-5 closed phone-test bugs (cascade cancel offer to claims, return-fields-by-ride-type, pre-flight duplicate check, coaching phone fallback, kindness microcopy on validation, return time at MED density).
4. **April 27 morning:** Phase 1.5 audit.
5. **April 27 afternoon:** Tier 1 ships 7.1, 7.2, 7.3, 7.10 (this session).

**Outcome:** Rides feature is in production, offers/claims model is the canonical implementation, and the security + schema drift gaps that the audit found are closed.

## Audit synthesis exists as canonical doc

`audit/AUDIT_SYNTHESIS_2026_04_27.md` (185 lines, on main since `e8964d9`) is now the authoritative reference for the rides feature design and its failure modes. Future sessions should read it before touching rides.

`PHASE_1_5_REMEDIATION_PLAN.md` (101 lines, on main since `e8964d9`) defines the Tier 1/2/3 remediation path. Tier 1 is done. Tier 2/3 are this doc's parking lot (Part 6 below).

## Phone testing now works

Bypass URL via Vercel MCP gives Frank ~23h preview access on his phone for v2 deploys without Vercel SSO. This unblocks the "phone test before merge to main" workflow that was previously stuck on Crostini-only access.

## Workflow refinements

- **Migrations now applied via MCP** rather than dashboard pastes for any structural change. Migration history stays in sync automatically.
- **Recovery convention codified** for migrations applied via MCP without local files: match prod version timestamp exactly in filename, document in `RECOVERY_NOTES_*.md`. Established this session.
- **Audit-before-remediate pattern proven.** The `audit/` directory exists. Subsequent feature audits should follow the same template.

---

# PART 4: LOCKED DECISIONS (mostly unchanged from v3 Part 3)

The 30+ decisions Frank locked April 22-23 remain locked. Read v3 Part 3 once for the full list. Material changes since v3:

- **No new locked decisions** in the April 24-27 window. The session focused on rebuild + audit + remediation, not product strategy.
- **Decision 23 (tournament rules JSONB)** is now schema-supported (column exists on `tournaments`).
- **Decision 28 (rate cards JSONB)** is now schema-supported (column exists on `coaching_assignments`).
- **Phase 0B migration list (decisions 31-34) all shipped or resolved.**

---

# PART 5: ACTIVE BUG CATALOG (replaces v3 Part 4's 22-bug list)

## P0 (Security / Privacy): ALL CLOSED

- ✅ Parents could edit any event (Phase 0A-1, April 22-23)
- ✅ Parents could delete any event (Phase 0A-1)
- ✅ Parents could create events (Phase 0A-2)
- ✅ Parents could bulk-export guardian contacts (Phase 0A-3)
- ✅ Parents correctly gated from RSVP-ing other families' kids (Phase 0A-4 verification)
- ✅ Anon could call SECURITY DEFINER RPCs to bypass RLS (Ship 7.1, today)
- ✅ Invite URL leaked in console.log (Phase D.0, April 26)

## P0 (Functional): ALL CLOSED

- ✅ 3-day rides outage (Phase 1.5 rebuild, April 25-26)
- ✅ Schema drift: Enable Rides toggle was dead UI (Ship 7.2, today)
- ✅ Cascade cancellation: cancelling an offer left orphan claims (Migration 20260427131334)

## P1: Audit findings deferred to Tier 3

- B4 multi-kid claim form: when a parent has multiple kids on the same team and offer is for 1 seat, picker auto-selects first kid silently. Should let parent choose. → Ship 7.6 (~90 min, deferred).
- B7 auth flash: EventRidesTab briefly shows "rides off" before AuthContext finishes loading. → Ship 7.8 (~20 min, deferred).
- B8 single notes field: pickup_notes is the only free-text channel. Riders can't separately note pickup vs return concerns. → Ship 7.9 (~30 min, deferred).
- B9 RLS performance: ~50 policies use `auth.uid()` directly instead of `(select auth.uid())`, causing per-row re-evaluation. → Ship 7.7 (~45 min, planned this session).

## P1: Pre-existing bugs from v3 still open

- UpcomingEvents.jsx renders hardcoded stub data per team page → Phase 1
- Comments show author email instead of guardian first_name → Phase 1
- Games filter excludes tournaments → Phase 1
- Fake 0-0 records on MY TEAMS card → Phase 1
- Season dates timezone bug (Mar 22 vs Mar 23) → Phase 1

## P2 / P3: Polish, deferred

- NextUpCard urgency cap (<48h) → Phase 1
- RSVP optimistic update → Phase 1
- Recurring series edit → FullScreenForm replacement → Phase 1
- Login screen amber CTA → cobalt → Phase 1
- Copy Roster on HTTP dev shows "Copy Failed" → cosmetic, requires HTTPS

---

# PART 6: PARKING LOT (active deferred work)

These are the next work units, ordered by leverage. Each has acceptance criteria in `PHASE_1_5_REMEDIATION_PLAN.md`.

| Ship | What | Effort | Owner | Status |
|---|---|---:|---|---|
| **7.4** | `RIDES_SPEC.md`: locked rides contract document | 60 min | Me synthesis | Deferred |
| **7.5** | `STATE_OF_AFFAIRS_L99_v4.md` | 30 min | Me + CC | **THIS DOC** |
| **7.6** | Multi-kid claim picker (B4) | 90 min | Me + CC | Deferred |
| **7.7** | RLS perf optimization (B9) | 45 min | Me via MCP | Planned next |
| **7.8** | Auth flash fix (B7) | 20 min | CC | Deferred |
| **7.9** | Notes field expansion (B8) | 30 min | Me + CC | Deferred |
| **7.10** | Migration parity recovery | 25 min | Me + CC | ✅ DONE |

---

# PART 7: PHASE PLAN (forward-looking)

## Phase 0C (Ember rebrand): DEFERRED

Same items as v3. Still blocked on (a) Frank's domain decision and (b) timing relative to Phase 1+ feature work. No movement since v3.

## Phase 1 (Parent 95%): partial

The rides rebuild + Phase 0A security work were Phase 1 prerequisites. Remaining Phase 1 items (per v3 Priority 1-3):

**P1 honest rendering** (replaces fake data):
- SeasonProgressBar
- TeamHeaderCard (record + progress)
- SpringPulse card
- TournamentTracker 5-dot timeline
- AchievementCard

**P1 bug fixes:** UpcomingEvents rewrite, Comments display name, Games filter, MY TEAMS records, NextUpCard urgency, Login CTA color.

**Estimated:** 6-7 sessions to ship Phase 1 to 95%.

## Phase 2 (Coach 95%): 5-6 sessions

Quick Score, Rotation Planner, Live substitution, Minutes computation, Player of the Game, Roster Health, Call-up flow, Coach compensation personal view.

## Phase 3 (Admin 95%): 8-10 sessions

Content CMS, Season/Tournament/Achievement CRUD, Briefing templates, Hotel code distribution, Tournament rules editor, Monthly invoices, 1099 summary, Compensation dashboard.

## Phase 4 (Multi-tenant hardening): DEFERRED

Not needed until St. Patrick's CYO onboarding approaches (2027-28).

## Phase 5 (Launch + Native): 3-4 sessions

Capacitor wrapper, push notifications, App Store + Play Store submission, Fall 2026 rollout.

## Phase 6-7 (Platform + Billing): 2027

Super Admin UI, Ember surfaces, Stripe subscription, Stripe Connect, St. Patrick's onboarding.

---

# PART 8: INFRASTRUCTURE + ENVIRONMENT (mostly unchanged from v3)

Read v3 Part 6 for the full breakdown. Material changes:

## Vercel access via MCP

The `Vercel:get_access_to_vercel_url` MCP tool now generates ~23h bypass URLs for v2 preview deployments. This makes phone testing tractable. Bypass URL format:
```
https://skyfire-app-git-v2-legacyhoopers-projects.vercel.app/?_vercel_share=<TOKEN>
```

## Supabase migration history clean

Per Part 2 above. Future MCP-applied migrations should be paired with same-session local file recovery using the timestamp filename convention (Ship 7.10 established).

## Codebase still named "Skyfire"

`/home/admin/legacy-hoopers-app`, `github.com/LegacyHoopers/skyfire-app`, CSS `--sf-*`. Phase 0C rebrand deferred.

---

# PART 9: DESIGN TOKENS (unchanged from v3 Part 7)

- **Font:** Inter
- **Spacing:** 4px grid
- **Card radius:** 10px
- **Tap targets:** 44px minimum
- **Icons:** Lucide React, stroke-width 1.75
- **Color:** CSS variables only (`--sf-*` until Phase 0C, then `--em-*`)
- **Hardcoded hex exception:** `team_color` inline from DB only
- **Brand cobalt:** `#4a8fd4` (NEVER sky blue `#29b6f6`)
- **Team colors v14:** 11U Girls `#a78bfa`, 10U Black `#4a8fd4`, 10U Blue `#94a3b8`, 9U Boys `#06b6d4`, 8U Boys `#f59e0b`

## Naming conventions

- Number-first ("10U Black" not "Boys 10U Black")
- Sort oldest-to-youngest: 11U Girls → 8U Boys
- Never "CYO" in UI (use "League Play")
- "Volunteers" not "Duties"
- "Futures Academy" is a headline, never a footnote

---

# PART 10: ANTI-PATTERNS + PRINCIPLES

v3 listed 13 principles. They all still apply. Three new lessons from April 24-27:

**14. Never trust assumed features. Audit the code.**
Phantom "acting-as bugs" from earlier sessions wasted ~15 hours because no one read AuthContext.jsx to confirm the feature even existed. The fix: any time a "bug" doesn't reproduce against direct code inspection, audit before remediating.

**15. Schema drift kills features silently.**
`enable_rides` written by wizard, `ride_coordination_enabled` read by UI, two columns never connected. Auditable by `grep -r ride_coordination` vs `grep -r enable_rides` in 30 seconds. The fix: when adding a feature that gates on a flag, search the entire codebase for both reader and writer of that flag before merging. If they don't match, you've shipped dead UI.

**16. PUBLIC inheritance defeats role-specific REVOKE.**
`REVOKE EXECUTE ... FROM anon` does NOT block anon when the function also has `GRANT EXECUTE ... TO PUBLIC` (anon inherits via PUBLIC). Caught mid-Ship-7.1 and corrected with follow-up migration. The fix: when revoking from a Supabase role, also REVOKE FROM PUBLIC; explicitly re-GRANT to roles that should retain access.

## All principles 1-13 from v3 still hold

One fix per prompt | SQL in chat not via CC | 150-line file cap | Architecture in chat, execution in CC | CSS variables only | Avoid `current_user_org_id()` on org_members | Deploy chain must be exact | Feature reference is GameChanger/PlayMetrics/SportsEngine | UI quality reference is Linear/Apple Calendar/Nike Run Club/Stripe Dashboard | Answer first then detail | No em dashes / corporate jargon | Flag blockers immediately | Update build queue immediately | Read filesystem before claiming state | Every claim needs evidence source.

---

# PART 11: OPEN QUESTIONS FOR FRANK

Unchanged from v3 Part 10 except where noted. Still pending:

## Operational

1. **Apr 23 duplicate 11U Girls practice:** WCC vs Westchester County Center: which row to keep? (One of the v3-era April 26 data corrections may have addressed this. Verify before assuming.)
2. **Tournament rules entry method:** Structured form, freeform notes, or hybrid? Recommended hybrid.
3. **Reminder channels for schedule changes:** Push + email, or include SMS?
4. **Emergency override channels:** Push + email + SMS bypassing quiet hours?
5. **Hotel code distribution channels:** Push + email, SMS too, or email only?

## Product strategy

6. **Ember domain:** ember.app, emberhq.com, getember.co, useember.com, other? (Phase 0C decision.)
7. **Legacy Hoopers domain post-rebrand:** Keep `app.legacyhoopers.org` pointing to Ember, or move to `legacyhoopers.ember.app` subdomain, or both in parallel?
8. **Ember corporation formation timing:** Before Phase 0C, during Fall 2026, before St. Pat's onboarding, or separate lawyer conversation?

## Tier enforcement

9. **Legacy Hoopers feature access:** Pro tier confirmed. Even billing surface should be hidden in pilot mode (not just empty/zero)?

## Coach compensation

10. **1099 generation:** Auto at year-end for coaches >$600, or manual?
11. **Per-coach pay scopes:** Schema supports `rates JSONB` per coach × team × event_type. Need actual rate values for Kenny + Darien for Spring 2026.

## Launch

12. **11U Girls as first rollout cohort:** Still the plan when app hits 95% parent satisfaction?

---

# PART 12: REFERENCE PATHS

## Documentation (in repo at `main` HEAD `a54a761`)

- `audit/AUDIT_SYNTHESIS_2026_04_27.md`: rides feature audit
- `PHASE_1_5_REMEDIATION_PLAN.md`: Tier 1/2/3 plan
- `STATE_OF_AFFAIRS_L99_v4.md`: **this file**
- `STATE_OF_AFFAIRS_L99_v3.md`: supersedes by this file but kept for historical reference
- `SKYFIRE_LEVEL99_MASTER.md`: comprehensive product spec
- `CLAUDE.md`: governance rules for Claude Code
- `LH_OPS_SPEC.md`: operations spec
- `LH_BRAND_CONTENT_MODEL.md`: brand guidelines
- `NEW_CHAT_STARTER_PROMPT.md`: handoff protocol
- `SKYFIRE_BUILD_QUEUE_v2.md`: feature build queue (per-feature evidence sources)
- `supabase/migrations/RECOVERY_NOTES_2026_04_27.md`: migration parity notes

## Source code

- 110+ JSX components, 29+ hooks, 16+ lib files. Full snapshot in `rides-audit-source.zip` (108KB) for offline grep.
- Working directory: `/home/admin/legacy-hoopers-app` on Frank's Crostini.

## Production artifacts

- Supabase project: `vrwwpsbfbnveawqwbdmj`, org `e3e95e21-3571-4e9a-985a-d5d01480d4a6`
- Vercel project: `prj_peID30eF61qubU90e1TVvM1kikuP`, team `team_95cqArODGT4Ub8nQ5lKWqGY4`
- GitHub: `LegacyHoopers/skyfire-app` (will rename in Phase 0C)
- Production URL: `app.legacyhoopers.org`

## Key user IDs

- Admin Frank: `1e06a3d4-769b-42c0-b90b-92787410ee5a` (admin@legacyhoopers.org)
- Parent Frank: `0b81b465-225e-4ede-b752-ed9a2dde1f7c` (fsamaritano@gmail.com)
- Coach Kenny: `9ac6a671-8869-40c9-96de-f1628d0c12db`
- Both Frank accounts ARE the same human, two real Supabase auth users. Not an "acting-as" feature.

---

# END OF DOCUMENT

**Next action when this is consumed by a new chat:** Verify against live Supabase + git. If anything has changed (new migration, new commit, new bug filed), write v5 before executing work. Do not skip verification.
