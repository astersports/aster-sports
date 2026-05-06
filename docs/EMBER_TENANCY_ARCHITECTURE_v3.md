# EMBER TENANCY ARCHITECTURE v2

**Status:** L99 elite-status audit applied. Awaiting Frank's approval before implementation.
**Date authored:** April 25, 2026
**Author:** Claude (chat) + Frank Samaritano
**Replaces:** v1 of this document (was 293 lines, graded C+ in audit)
**Supersedes:** Phase 0C decisions D1, D2, D3 (refines them with full architecture)

This is the canonical document for how Ember handles multiple organizations, branding, authentication, signup, security, and operations. Every product, design, and engineering decision related to multi-tenancy must reconcile against this document.

**v2 changelog from v1:**
- Section 3 rebuilt against actual production schema (v1 proposed columns that already exist)
- Section 4 expanded with token refresh, multi-tab, expired session handling
- Section 8 replaced with executable verification SQL (no more "smoke test" hand-waves)
- Section 11 in-flight rollback decision tree per step
- New section 13: Threat model
- New section 14: Operational runbook (St. Pat's onboarding playbook)
- New section 15: Ground-truth Migration 029 SQL with pre/post verify

---

## 1. Brand model

Ember is the SaaS platform. Legacy Hoopers, St. Patrick's CYO, and any future organization are tenants ("orgs") that run on Ember.

The brand experience is a two-stage flip:

**Stage 1, pre-auth (Ember surface):**
- Phoenix logo
- Gold accent #D4AF37
- "Coach more. Coordinate less." tagline
- Dark navy backdrop #151525
- One unified login URL for all tenants

**Stage 2, post-auth (org surface):**
- Org's logo (knight for Legacy Hoopers, future logo for St. Pat's)
- Org's primary brand color (cobalt #4a8fd4 for LH)
- Org's display name in header
- All app chrome, accents, and CTAs use the org's color

The flip happens at the AuthContext layer. The moment a user authenticates and AuthContext loads their org row, it applies CSS variable overrides via document.documentElement. Before authentication, defaults from index.css apply (Ember's gold/navy).

**This is the Slack/Notion model.** One front door, branded interior per workspace.

### Failure modes for branding

| Scenario | Behavior |
|---|---|
| `brand_colors` jsonb is NULL on an org | Fall back to Ember defaults (gold/navy) — DO NOT crash |
| `brand_colors.accent` key is missing | Fall back to Ember gold for accent only, use other keys if present |
| `brand_colors.accent` value is malformed (not valid hex) | Skip that override, log warning, continue with default |
| `logo_url` is NULL or 404s | Show Ember Phoenix as fallback, log warning |
| `logo_url` returns slow (>500ms) | Show text-only org name in header until image loads |
| User's org_id in user_roles points to deleted org | Sign user out, show error toast, redirect to login |

These failure modes are tested in section 8 via explicit SQL.

---

## 2. Domain strategy

### Today (April 25, 2026)
- **Ember login URL (temporary):** `app.skyfire-app.vercel.app` — Phoenix + gold + tagline
- **Legacy Hoopers app URL (existing):** `app.legacyhoopers.org` — CNAMEs to Vercel deploy
- **Legacy Hoopers marketing site (existing):** `legacyhoopers.org` — Squarespace, untouched

### Domain transition plan

`app.legacyhoopers.org` is currently the only login URL anyone knows about. We need to handle the transition without breaking existing parents/coaches.

**Locked decision:** Both URLs serve the same Ember login page. AuthContext handles the post-auth flip per user's org.

### Future (this week or next)

- Buy permanent Ember domain (ember.app, emberhq.com, or useember.com)
- Once owned, point CNAME to Vercel. Existing URLs continue to work.

---

## 3. Database model (REBUILT against production)

### What's already in production today

Audited via `Supabase:execute_sql` on April 25, 2026. The `organizations` table already has: id, name, slug, sport, logo_url, brand_colors, stripe_account_id, subscription_plan, subscription_status, created_at.

Current LH `brand_colors` jsonb:

```json
{
  "accent": "#4a8fd4",
  "header": "#4a8fd4",
  "accent_hover": "#5BA0E0",
  "text_on_dark": "#FFFFFF"
}
```

### What Migration 029 actually does (v2)

```sql
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS primary_domain text;

UPDATE public.organizations
SET display_name = COALESCE(display_name, name)
WHERE display_name IS NULL;

ALTER TABLE public.organizations
  ALTER COLUMN display_name SET NOT NULL;
```

Migration is additive and idempotent. Does NOT touch RLS. Does NOT change any other table.

---

## 4. Authentication flow

### Pre-auth state
App boots with Ember defaults. AuthContext detects no session.

### Sign-in
1. Supabase auth returns session
2. AuthContext fetches user_roles + org row
3. AuthContext applies branding via CSS variable overrides
4. Router navigates to home

### Sign-out
1. AuthContext clears branding overrides
2. CSS reverts to Ember defaults
3. Redirect to /login

### Edge cases handled
- Token refresh: do NOT re-apply branding (compare prevUser.id)
- Multi-tab: Supabase broadcasts sign-out across tabs
- Expired session: modal "You've been signed out" + redirect to login
- Multi-org user (future Phase 6+): org-switcher between auth and app

---

## 5. CSS variable namespace

Canonical `brand_colors` jsonb keys: accent, accent_hover, accent_soft, header, text_on_dark.

---

## 13. Threat model

1. **Org enumeration via login page** — mitigated (identical Ember login for all)
2. **Org row enumeration via API** — RLS needs tightening before org #2
3. **Cross-tenant data leak** — mitigated via current_user_org_id() SECURITY DEFINER
4. **Logo URL pointing to malicious resource** — mitigated (admin-only via SQL today)
5. **Branding spoofing via JSONB injection** — mitigated (regex validation)
6. **Service worker hijacking** — mitigated (unregister-then-reregister)

---

## 14. Operational runbook

### Onboarding a new org
1. Pre-onboarding checklist (logo, brand color, display name, first admin email)
2. Upload logo to `public/<orgslug>_logo.webp`
3. INSERT organizations row
4. Create first admin user via Supabase Auth
5. INSERT user_roles row
6. Verify sign-in shows correct branding
7. Hand off to new admin

---

# V3 EXPERIENCE LAYER (added April 25, 2026)

V3 builds on V2's engineering foundation with the polish and microcopy that distinguish a working SaaS app from a world-class one. Sections 16-23 define loading states, strings, animations, error recovery, and first-time experiences.

## 16. Loading states catalogue

- 16.1: Cold app load — Phoenix + pulsing gold dots on navy
- 16.2: Login font load — system fallback + font-display swap
- 16.3: Sign-in submit — spinner replaces button text
- 16.4: Auth success → org fetch — brand transition (gold→org color, ~700ms)
- 16.5: Sign-out — reverse brand transition
- 16.6: Logo still loading — letter-circle fallback in header
- 16.7: Network failure — persistent toast with retry
- 16.8: Session expired — modal with "Sign in" button

## 17. Microcopy catalogue

All auth-flow strings locked. Tone: direct, confident, no jargon.

Key strings:
- Tagline: "Coach more. Coordinate less."
- Wrong password: "Email or password is incorrect"
- Network failure: "Can't reach Ember. Check your connection."
- Session expired: "Your session expired. Sign in again to continue."
- Invite note: "New club? Email frank@legacyhoopers.org to onboard."

## 18. First-time user experiences

- Parent: straight to home, no welcome card
- Coach: welcome card with team list, dismissible via localStorage
- Admin: welcome + 4-item checklist (season, teams, locations, coaches)

## 19. Error recovery flows

Every error path has defined message + recovery action. No "Oops!" language.

## 20. Polish & delight

- Phoenix logo entrance animation (scale 0.85→1.0, 600ms)
- Sign-in checkmark moment (150ms before brand transition)
- Haptic feedback on sign-in success
- Tagline character-by-character reveal on cold load

## 21. Critical CSS inline strategy

Boot splash + login-card minimum inline in index.html. Everything else in stylesheet.

## 22. V3 implementation order

14 steps (expanded from V2's 9). Minimum-viable tonight: steps 1-10. Steps 11-13 (BrandTransition, coach welcome, admin checklist) can defer.

## 23. Verification protocol additions

Verifies boot splash, brand transition smoothness, first-time flows, microcopy accuracy, and polish moments.

---

End of EMBER_TENANCY_ARCHITECTURE v2+v3 combined document.
