# Vela Rebrand Audit

> Non-destructive map + change plan for renaming the **platform** Ember → **Vela**, migrating
> the owner email, and (separately) the deep tenant-separation work. Nothing here is executed
> yet — this turns the rebrand into mechanical execution. Created 2026-06-01.
>
> **Three identities people conflate — keep them straight:**
> 1. **Platform** = "Ember" → **"Vela"** (this rebrand).
> 2. **Owner email** = `admin@legacyhoopers.org` → a new address (account migration).
> 3. **Tenant** = "Legacy Hoopers" — a customer org inside the platform. **STAYS.** (St Pat's,
>    Chris Ward AAU are future peer tenants.)
>
> **Visual identity does NOT change:** warm gold + navy + cream palette and the phoenix/sail
> mark are kept (Frank's Vela sail-flame SVG is the locked mark). Only the *name string* and the
> *logo asset file* change. **`--em-*` design tokens are NOT renamed** (anti-pattern #3; 1,971
> usages; zero user-visible benefit — "em" becomes a historical prefix, like "px").

---

## Layer 1 — Platform name "Ember" → "Vela" (user-facing). LOW RISK, do first.

Every place a user/parent sees the word "Ember". Pure string swaps:

| File:line | Current | → Vela |
|---|---|---|
| `index.html:14` | `<title>Ember</title>` | `<title>Vela</title>` |
| `index.html:13` | `apple-mobile-web-app-title content="Ember"` | `"Vela"` |
| `public/manifest.webmanifest:2-3` | `"name":"Ember"`, `"short_name":"Ember"` | `"Vela"` |
| `src/lib/emberDefaults.js:13` | `EMBER_DISPLAY_NAME = 'Ember'` | `'Vela'` |
| `src/pages/LoginPage.jsx:82` | `<img src="/phoenix.webp" alt="Ember">` | `alt="Vela"` + new mark asset (Layer 5) |
| `src/pages/AccountPage.jsx:16` | `VERSION = 'Ember v2.0'` | `'Vela v2.0'` |
| `src/pages/PublicSchedulePage.jsx:108` | `Powered by Ember` | `Powered by Vela` |
| `src/pages/PublicSchedulePage.jsx:44` | `document.title = 'Ember'` | `'Vela'` |
| `src/pages/RegisterEntryPage.jsx:79` | `Powered by Vela` ("Powered by Ember") | `Powered by Vela` |
| `src/pages/RegisterEntryPage.jsx:33` | `document.title = 'Ember'` | `'Vela'` |
| `src/pages/TeamDetailPage.jsx:84` | `document.title = \`${team.name} — Ember\`` | `— Vela` |
| `src/pages/TeamDetailPage.jsx:133` | copy "…a real Ember feature…" | "…a real Vela feature…" |
| `src/lib/icalHelpers.js:43` | `PRODID:-//Ember//EN` | `-//Vela//EN` |

Also the `LoginPageBrandResetInvariant.test.jsx` comments reference "Ember defaults" — comment-only, update for clarity.

**Effort:** ~1 hour, one PR. **Risk:** trivial (strings). Verify: grep `grep -rn "Ember" src/ public/ index.html | grep -v "var(--em-\|member"` returns only token-name comments after.

---

## Layer 2 — Platform name internal (cosmetic, OPTIONAL, later).

- `src/lib/emberDefaults.js` → rename file to `brandDefaults.js` + `EMBER_DISPLAY_NAME` → `BRAND_DISPLAY_NAME`, update imports. Clarity only.
- `package.json:2` `"name":"legacy-hoopers-scaffold"` → `"vela"`. Internal.
- `--em-*` tokens (1,971 uses) + comments calling them "Ember tokens": **KEEP.** Renaming is forbidden (anti-pattern #3) and pure churn. Optionally update the *comment* in `index.css:3` to "design tokens (legacy `em-` prefix)".
- `src/lib/emberDefaults.js` exports + `useOrgBranding`/`orgBrandingCache` comments referencing "Ember defaults": comment refresh only.

**Effort:** ~1 hour. **Risk:** low (mechanical rename + import fixups). Defer — no user impact.

---

## Layer 3 — Owner email `admin@legacyhoopers.org` → new address. (34 refs)

Splits by surface — **do NOT blanket find/replace** (the auth record is special):

- **(a) Auth login — Supabase Auth.** The actual `auth.users` login email. Change via **Supabase dashboard** (Authentication → Users) or auth-admin API — **not** a raw SQL UPDATE (desyncs auth). This is the real "your email" change. ⚠️ owner action.
- **(b) Staff / guardian rows (DB).** `staff_profiles` / `guardians` rows carrying the email — SQL UPDATE, safe, do in the same migration window.
- **(c) Pilot overrides (real code — must change or break):**
  - `supabase/migrations/20260511122118_wave_4_3_i_get_digest_recipients_pilot_override.sql`
  - `supabase/migrations/20260511115858_wave_4_3_i_pilot_test_recipient_email.sql`
  - `supabase/migrations/20260509124926_org_settings_from_name_email.sql`, `20260509234517_organizations_voice_config.sql`
  - `supabase/functions/unsubscribe-handler/index.ts`
  These hardcode the admin email for digest send/test. New migration to repoint (or remove pilot override now that real registration exists).
- **(d) Test fixtures** (`src/lib/engine/resolvers/__tests__/fixtures/**/organization.json`, several): update for consistency; low-risk.
- **(e) Docs** — `CLAUDE.md`, ledger, this file.

**Effort:** ~half day (mostly the careful auth-side change + a repoint migration). **Risk:** medium on the auth record only — verify login still works after.

---

## Layer 4 — Tenant ↔ platform separation (the DEEP work). OUT OF SCOPE for the rebrand.

"Legacy Hoopers" = 123 refs. **The vast majority STAY** — LH is a real tenant. But true multi-tenancy (Vela hosting LH + St Pat's + Chris Ward as peers) requires removing single-tenant hardcoding:
- Hardcoded LH `org_id` in RLS / public policies across ~41 migrations (e.g. `teams_select_public` gates by the literal LH org_id — `PublicSchedulePage.jsx:24` comment documents it).
- `AuthContext.jsx:68` still picks `roleRows[0]` (Finding A — no org switcher).
- Pilot overrides (Layer 3c) assume one org.

**This is the multi-org track (Finding A), not the rebrand.** It's audit-gated on its own and only needed when a 2nd tenant onboards. The name change (Layers 1-3) does **not** depend on it. Flagging so it isn't silently bundled in.

---

## Layer 5 — Visual assets. Swap the mark; keep the palette.

- `/public/phoenix.webp` (used `LoginPage.jsx:82`) → Frank's **Vela sail-flame** mark.
- Favicon, `apple-touch-icon`, manifest `icons[]`, any `og:image` → regenerate from the new mark.
- **Palette unchanged** — `--em-*` warm gold/navy/cream values stay exactly (§3). The org-runtime LH cobalt override also stays (LH tenant keeps its brand; only the *platform default* is Vela's gold).

**Effort:** ~1-2 hours once the final mark art (SVG/PNG set) is exported. **Risk:** low.

---

## Recommended execution (once accounts are migrated — Track 1)

| PR | Layer | Gate |
|---|---|---|
| R1 | Layer 1 — user-facing name strings | grep-clean of "Ember" outside token comments |
| R2 | Layer 5 — logo/favicon/manifest-icon asset swap | visual check on login + PWA install |
| R3 | Layer 3 — email repoint migration + fixtures (auth change = owner dashboard step) | login works; digest sends to new email |
| R4 (optional) | Layer 2 — internal rename cleanup | build green |
| — | Layer 4 — multi-tenant de-hardcode | **separate program**, when tenant #2 onboards |

**Prerequisite for all of it:** the account migration (Claude / GitHub / Supabase / Vercel → new email) per the earlier two-track plan. Nothing here runs until then. CLAUDE.md itself gets retitled "VELA PLATFORM" as part of R1.

---

**Status:** audit only — zero code/DB changed. Name = **Vela** (locked, pending `vela.co` price reconcile). Mark = Frank's sail-flame SVG. Palette = unchanged warm gold/navy.
