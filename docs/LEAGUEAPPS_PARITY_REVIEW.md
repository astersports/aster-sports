# LeagueApps Parity & Scope Review

**Status:** Reference artifact for the (deferred) multi-program / multi-tenant build phase. Lower authority than CLAUDE.md doctrine. Feeds — does not gate — the §17.7 step-5 phase boundary.

**Origin:** 54-screenshot walkthrough of the LeagueApps manager (`manager.leagueapps.com`, Legacy Hoopers' current operating platform), captured 2026-05-29 by Frank for "review the overall design." Every screenshot is the **incumbent** (LeagueApps), not Ember. This doc maps what Ember will eventually sit beside or replace.

**Per AP #45:** EMBER_PENDING_LEDGER §4 carries a same-PR entry pointing here.

---

## 1. The incumbent model (what LeagueApps is)

LeagueApps is a full youth-sports **operations + commerce** platform, organized as a spine with five surrounding rings.

### The spine
```
Site (tenant)
  └─ Season  (a "Grouped Master" program)
       └─ Age-group sub-programs   (11U Girls, 10U Boys Black/Blue, 9U Boys, 8U Boys, Tryouts…)
            └─ Rosters             (the actual team, e.g. "Girls 11U", 13 players)
                 └─ Players / Staff
```
- **Site = tenant.** A "+ Add a site" switcher means one operator login can hold multiple sites. Direct analog to Ember's `org`.
- **Season = grouped master program.** `Program Class: Grouped Master`. Holds shared attributes (Sport, Gender, Season, Registration Period, Start/End) and a list of age-group sub-programs.
- **Age group = sub-program.** Each carries its OWN registration state (Sold Out / Live), schedule, roster, staff, invoices, payment plans, form fields, and waivers. Naming matches Ember's §10 rule exactly ("11U Girls", "10U Boys Black").
- **Roster = team.** Tracked with gender split (0M/13F), registration status (Complete), copy-team.
- **Players** carry an "**Academy Player**" tag → maps cleanly to Ember's Futures Academy `roster_type`.

### Program types (first-class)
Create-program offers: **League · Event · Tournament · Camp · Club team · Class**. Plus Tryouts, Waitlists, Practice Rosters, Group Training as observed sub-program kinds. (This is the polymorphic taxonomy PLATFORM_PRIORITIES.md §17.2 currently scopes out.)

### The five rings around the spine
1. **Registration engine** — capacity rules (roster min/max by gender, club-team max, waitlists), age-range gates, a registration-status state-machine (Opens Soon / Open / Sold Out / Limited Spots / Accepting Waitlist / Free Agents), a **custom form-field builder** (field types: dropdown / text / numeric / multi-checkbox), e-sign **waivers** (main + named, gated per registration type), and confirmation / skipped / abandoned message templates.
2. **AR / billing** — per-player per-program **invoices**, fixed or **variable per-player fees** ($800/player), **payment plans** (3 installments), auto-pay, payment deadlines with strict enforcement + auto-invalidation, dunning ("Send Payment Reminders to All"), bulk invoice adjustment, site credits, discount codes, platform fee.
3. **Communications** — email + **SMS/text**, email templates, sent-email + sent-text logs.
4. **CMS + e-commerce** — public website builder (Content Pages, Menu items, Mobile homepage, Widgets, theme editors) and product orders / assigned products.
5. **Integrations + compliance + roles** — marketplace (Chubb insurance, Ankored age-verification + compliance, Yardstik background checks, TeamGenius, Coach Packet, Google Sheets, Lucid Travel), **cancellation insurance + accident/injury protection** toggles, a **9-role staff hierarchy** (Site Reporter / Manager / Director / Admin / Coordinator + Org Account Admin / Group Admin / Owner) with a per-event notification matrix, and **terminology overrides** (rename every domain noun: Sub-Program→"Age Group", Team→"Roster", Captain→"Head Coach", Free Agent→"Prospect", Division→"Development Track", Processing Fee→"Platform Fee").

---

## 2. Ember vs incumbent — gap table

Legend: ✅ Ember has it · 🟡 partial / table-only-no-UI · ❌ absent · 🚫 deliberately out of scope

| Surface | Ember today | Gap |
|---|---|---|
| Org / tenant | `org` + RLS, brand_colors | ✅ (multi-tenant readiness is Wave 3.B #28) |
| Season → teams | seasons + teams + roster_members | ✅ spine matches (minus per-team registration/invoicing) |
| Polymorphic program types (League/Camp/Class/Tournament/Booking) | tournaments only | ❌ §17.2 scoped out |
| Grouped master / sub-program primitive | season holds teams (1 level) | 🟡 shape matches; not generalized |
| Futures Academy / "Academy Player" | `roster_type` | ✅ concept aligns |
| Self-serve registration | families are **imported** | ❌ no registration at all |
| Capacity / waitlist engine | — | ❌ |
| Custom form-field builder | `form_fields` table | 🟡 table exists, no builder UI |
| Waivers / e-sign | `waivers` + `waiver_signatures` tables | 🟡 tables exist, no UI |
| Uniform / jersey sizes | `roster_members` sizes | ✅ collected (via import) |
| Invoices / AR | financial dashboard (7-A): net-to-bank, record-payment, LeagueApps import | 🟡 reporting only — no invoicing |
| Payment plans / installments / auto-pay / dunning | — | ❌ |
| Discount codes / credits | — | ❌ |
| Email comms | briefing engine, Resend, Stream A/B | ✅ strong (arguably richer editorially) |
| SMS / text | — | 🚫 §16.5 reserves SMS (cancellations/critical only) |
| Public website / CMS | single public schedule page + iCal | 🚫 not a CMS by design |
| E-commerce / products | — | 🚫 not in scope |
| Insurance / bg-check integrations | — | ❌ relevant to §17.5 #27 compliance |
| Staff role hierarchy | 3 roles (admin/coach/parent) | ❌ incumbent has 9; multi-tenant #28 |
| Terminology overrides | hardcoded nouns | 🟡 organization_settings exists; nouns not parameterized |
| Player invite tool | invitations table + invite-parent fn | 🟡 **broken** — Wave 3.A #18 (InviteButton unmounted, no AcceptInvitePage) |
| Player privacy (parent-contact-over-child) | §16.7 privacy locks | ✅ aligns; incumbent defaults parent-contact ON |
| Schedule / RSVP / game-day / scoring | full (2-B…5-B) | ✅ Ember's strength; LeagueApps is thinner here |

---

## 3. Where Ember already aligns (don't churn these)
- **Naming**: "11U Girls" / "10U Boys Black" number-first — identical to §10.
- **Futures Academy** ↔ "Academy Player" tag.
- **Parent-contact-over-child** privacy default ↔ §16.7 + §17.5 #27 (COPPA-adjacent).
- **Season → teams** spine ↔ Season → age-groups.
- **Engagement / game-day / comms** — Ember is *richer* than LeagueApps here (RSVP, ride board, duties, live scoring, briefing engine, attendance heatmap). This is Ember's reason to exist on top of LeagueApps.

---

## 4. The governing decision: replace vs sit-on-top

Everything about the multi-program build hinges on one scope boundary.

### Option A — Ember sits ON TOP (current posture, recommended for the St. Patrick's timeframe)
Ember is the **engagement / comms / schedule / game-day** layer. LeagueApps remains **system-of-record for registration + money** (invoices, payment plans, AR, waivers, registration). Families are imported into Ember (as today). This matches §8 / §17.2 ("contingent on LeagueApps platform readiness") and §17.5 #28 (org onboarding playbook = import, not registration).
- **Multi-tenant build** = org-level isolation + terminology + staff roles + a working invite/onboarding pipeline (#18) + import playbook (#28). Bounded, ships for St. Patrick's Spring 2027.
- **Does NOT** require building the registration engine, AR, capacity/waitlists, or payment plans.

### Option B — Ember REPLACES LeagueApps
Ember takes on registration, AR, payment plans, waivers, capacity, the staff hierarchy, and integrations. This is a multi-quarter platform build, not a tenant onboarding. Only justified if Frank intends to drop LeagueApps entirely.

### Recommendation
**Option A for the multi-program / second-tenant phase.** The 54-image walkthrough makes the cost of Option B explicit: rings 1, 2, and 5 (registration, AR, compliance/roles) are each their own product. Ember's differentiator is the engagement layer LeagueApps is weak at — lead there, not in re-building billing. Revisit Option B only if/when Frank commits to retiring LeagueApps as system-of-record.

> **Open decision for Frank** — this recommendation is the input; the call is yours. If you want Option B, the multi-program build scope expands by roughly an order of magnitude and the audit fix-arcs reprioritize around payments/registration.

---

## 5. What the multi-program build SHOULD take on (under Option A)
1. **Multi-tenant isolation** (Wave 3.B #28, 5 P0s) — org-scoped everything, brand reset, no cross-org leak. Already audited.
2. **Terminology parameterization** — move hardcoded nouns to `organization_settings` so St. Patrick's vocabulary differs from Legacy Hoopers. (Incumbent proves orgs rename nouns.)
3. **Staff-role expansion** — beyond admin/coach/parent if a second tenant needs program-manager / coordinator distinctions.
4. **Working onboarding/invite pipeline** (Wave 3.A #18) — the incumbent's invite tool is the reference; Ember's is currently broken.
5. **Import playbook** (Wave 3.B #28) — the LeagueApps→Ember import path is the onboarding mechanism, NOT self-serve registration.

## 6. What it should NOT take on (under Option A)
- Self-serve registration engine, capacity/waitlists, registration status state-machine.
- Invoicing / payment plans / auto-pay / dunning / discount codes (LeagueApps stays AR system-of-record).
- Public-site CMS, e-commerce/products.
- SMS (§16.5 reserves it), generic multi-sport taxonomy (basketball-locked by design).

## 7. Intersections with the open audit fix-arcs (already queued)
- **#18 onboarding/invite** — LeagueApps invite tool is the working reference; raises priority since multi-tenant depends on it.
- **#27 youth-sports compliance** — incumbent surfaces waivers, insurance, age-verification, background checks; confirms the compliance arc is real (privacy policy + consent ledger + the parent-contact-default Ember already honors).
- **#28 multi-tenant** — terminology overrides + staff hierarchy + import playbook are the concrete deliverables.
- **#19 notifications** — incumbent's per-role notification matrix is a (much larger) cousin of Ember's AutoNotificationSettings; no change to current arc, but a reference for eventual role-scoped notification prefs.

## 8. Explicit out-of-scope for THIS review
- No Ember screens were reviewed (set was 100% incumbent). A parallel Ember-side design pass (per §16.15) is a separate exercise.
- No visual/token critique of Ember surfaces.
- No commitment to Option A vs B — §4 records the recommendation; the decision is Frank's and belongs in PLATFORM_PRIORITIES.md §17.2 once made.
- Does not re-open the audit-gate; the §17.5 campaign remains the prerequisite for the build phase per §17.8.
