# ASTERSPORTS SETTINGS : MASTER SPEC AMENDMENT v2 (post batch-consumption-audit)

Date: 2026-06-09 · Architect · supersedes the §2 catalog + §3 build order of
`ASTERSPORTS_SETTINGS_MASTER_SPEC.md` · Relay artifact (AP#45)

## WHY THIS AMENDMENT

The batch consumption audit (CC grep of `src/`, pillar 1) + the §16.16 two-bucket
doctrine reduced the buildable pilot scope. An editor is built only when a shipped
surface reads the value today (bucket a) or multi-tenant onboarding needs it (bucket b).
The audit found that of the 9 originally-catalogued surfaces, only S1, S2, and S9 have
live consumption. S3..S8 are present-but-unwired substrate → Phase 4 (multi-tenant).

## RECONCILED SURFACE DISPOSITIONS

| Surface | Disposition | Note |
|---|---|---|
| S1 My Preferences | **BUILT** | shipped #915 + #918 (`user_preferences`; consumed). |
| S2 Family Notifications | **BUILT** | shipped #916 (`guardian_notification_prefs`; consumed). |
| S3 Home Layout | **DESCOPED** | DR-S3 (a). Relics: `dashboard_section_visibility` + `quick_actions_config` (0 src/ refs; mismatch shipped Home). → Phase 4. |
| S4 Records / Standings | **DESCOPED** | audit: Records does not read `circuit_rules`. The S4 spec/render/handoff are retained as Phase 4 reference. → Phase 4. |
| S5 Programs | **DESCOPED** | audit: `division_fees` not consumed (live path: `registration_fees` + division embeds). → Phase 4. |
| S6 Roster Rules | **DESCOPED** | audit: `org_settings.roster_rules` not consumed. → Phase 4. |
| S7 Briefings | **WIRED / editor-deferred / FORK-C-held (RULED a)** | `voice_config` + `signature_coaches` are read in production briefing sends, so S7 is NOT unwired like S4/S5/S6/S8. Editor deferred for the pilot: entangled with the operator-HELD FORK C, and FORK A already ruled the pilot voice/signature default. **Un-park = FORK C sign-off (Frank)**, then S7 spec/render/handoff. NOT Phase-4-unwired, NOT "2nd org needs it". See CC VERIFICATION NOTE below. |
| S8 Schedule | **DESCOPED** | audit: `org_settings` reminder_cadence/rsvp_deadlines/note_rules not consumed by a settings reader. → Phase 4. |
| S9 Notifications (org) | **BUILD** | the one remaining cleanly-consumed surface: `notification_channels` (org_settings) + `alert_configurations` + "Automatic messages" (reuse, shipped). NEXT BUILD. |

## NEW BUILD ORDER (replaces §3)

S1 (done) → S2 (done) → S9 (build) → production smoke (admin/coach/parent), pilot
stays DB-locked. That is the whole pilot settings system — three surfaces. (S7 ruled
WIRED/editor-deferred/FORK-C-held — no pilot build; un-park = FORK C sign-off.)

## PHASE 4 PARK (un-park conditions, ref `docs/DEPRECATIONS_REGISTRY.md` + CLAUDE.md §16.16)

S3..S6 + S8 un-park when EITHER a shipped surface begins reading the value, OR multi-tenant
onboarding (a 2nd org) needs org-level customization. Each un-park is its own
architect-lane pass: confirm/refresh substrate (e.g. S3 needs a reseed + group column +
section→slot mapping), verify consumption, then spec/render/handoff. The descoped
tables stay deprecated-tagged (migration `20260609225312`), not dropped.

S7 is NOT in the unwired bucket — see the CC note (its values are consumed today).

---

## CC VERIFICATION NOTE (2026-06-09) — S7 disposition correction — RULED (a) 2026-06-09

Architect ruling DR-S7: **(a) WIRED / editor-deferred / FORK-C-held.** CC's catch
accepted; the descope inference was withdrawn. Editor deferred (not built) because the
surface is entangled with the operator-HELD FORK C and FORK A already ruled the pilot
voice/signature default (`voice_config` sits at `{}`, default resolver covers it).
Un-park = FORK C sign-off. Evidence below stands as the record.

The architect asked CC to "confirm in one word if S7 has a consumed editor." CC could not
confirm a clean DESCOPED, because verification contradicts the unwired premise:

- `organizations.voice_config` is **read by shipped briefing resolvers** —
  `buildOrgContext.js:34`, and the `.select('id, name, display_name, brand_colors,
  voice_config')` org fetch in `gameRecap.js:77`, `gamesRecap.js:59`, `weeklyDigest.js:106`,
  `tournamentRecap.js:105`, `tournamentPrelim.js:85`, `rsvpNudge.js:134`, `scheduleChange.js:83`,
  `academyCallupNotice.js:75`. These run in production briefing sends.
- `signature_coaches` is consumed via `buildOrgContext.js:37` + `tournamentRecap`
  (`fetchSignatureCoaches`). This is the FORK C value, operator-HELD.

**Implication:** an S7 editor targeting voice/signoff + signature coaches would satisfy
bucket (a) — the value IS read today. That is materially different from S4/S5/S6/S8,
which have **zero** consumers. So S7 should NOT be filed as "unwired → Phase 4 descope";
it is **wired, editor-deferred, FORK-C-held**.

**Caveat (the disambiguation the architect must resolve):** CC does not have the S7 spec's
exact substrate in hand. IF S7's editor targets `voice_config`/`signature_coaches` →
bucket (a), buildable (but entangled with the held FORK C). IF S7 targets something else
(e.g. `briefing_triggers`, which has **0** `src/` references — unwired), descope holds.
`briefing_templates` was dropped (migration `20260602221416`).

**CC lean (AP#39 — committing to it):** keep S7 **deferred for the pilot** (do not build
now) because the operator has FORK C explicitly HELD — but record it as *wired/editor-
deferred*, not *unwired-descope*, so the un-park condition is correct. Architect to rule:
(i) confirm S7 = voice/signoff editor and keep HELD under FORK C, or (ii) name a different
S7 substrate. CC will not settle this fork unilaterally (§11.8 rule 2).
