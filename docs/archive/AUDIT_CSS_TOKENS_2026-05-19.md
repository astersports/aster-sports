# CSS-Token Orphan Audit — 2026-05-19

Class #8 in the orphan-code taxonomy.

**Tooling**: `grep -rE "^\s*--(em|sf)-" src/**/*.css` for definitions ×
`grep -rE "var\(--<token>[,)]" src/` for usage references (excluding
the definition site itself).

## Summary

**52 token defs total** across two CSS files:
- 34 `--em-*` tokens in `src/index.css` (the CLAUDE.md §3 locked spec)
- 18 `--sf-bc-*` tokens in `src/styles/broadcast.css` (broadcast-overlay scoped)

**4 unused `--em-*` tokens** identified. **0 unused `--sf-bc-*` tokens**.

All 4 unused are explicitly categorized as DECORATIVE or hover-state
reserves in CLAUDE.md §3's locked spec — intentional reserved palette,
not orphans in the "delete me" sense.

## `--em-*` audit (34 tokens)

### Actively used (30 of 34)

| Category | Tokens | Range |
|----------|--------|-------|
| Platform surfaces + text | em-bg-page, em-bg-card, em-bg-card-hover, em-bg-secondary, em-bg-tertiary, em-text-primary, em-text-secondary, em-text-tertiary, em-text-inverse, em-border-default, em-border-subtle | 2–340 refs |
| Status | em-success, em-success-soft, em-warning, em-warning-soft, em-danger, em-danger-soft, em-info, em-info-soft, em-neutral, em-neutral-soft, em-academy, em-academy-soft | 5–88 refs |
| Brand | em-header, em-accent, em-accent-soft, em-text-on-dark | 4–214 refs |
| Shadows | em-shadow-sm, em-shadow-md, em-shadow-lg | 6–39 refs |

Heavy hitters: `em-text-primary` (340), `em-text-tertiary` (336),
`em-border-default` (253), `em-accent` (214), `em-bg-card` (204).

### Reserved but unused (4 of 34)

| Token | Hex | CLAUDE.md §3 category | Verdict |
|-------|-----|----------------------|---------|
| `em-accent-hover` | `#D4A843` | Brand | Reserved for accent button :hover state. Currently no `:hover` style references it; hover effects use JS-based `transition` + `onMouseEnter` handlers OR no hover state at all. Intentional reserve. |
| `em-flame-mid` | `#E87520` | Decorative | Brand-palette orange (matches "flame" / "fire" / ember imagery). Reserved per spec comment "Decorative". |
| `em-crimson` | `#8B1A1A` | Decorative | Brand-palette dark red. Reserved. |
| `em-electric` | `#4A9FFF` | Decorative | Brand-palette bright blue. Reserved. |

**Action**: None. All 4 are explicitly in CLAUDE.md §3 as intentional spec entries. CLAUDE.md §3's ANTI-DRIFT rule says *"NEVER invent new tokens"* — the inverse (delete reserved tokens) would violate the same locked-spec discipline. Reserved palette stays.

## `--sf-bc-*` audit (broadcast.css, 18 tokens)

All 18 actively used:

| Group | Tokens | Refs |
|-------|--------|------|
| Surfaces | sf-bc-bg, sf-bc-card, sf-bc-card-alt | 1–5 |
| Decoration | sf-bc-border, sf-bc-glow | 1–6 |
| Brand color | sf-bc-cobalt, sf-bc-gold, sf-bc-green, sf-bc-red | 2–17 |
| Text | sf-bc-text, sf-bc-text-mute, sf-bc-text-soft | 3–10 |
| Hero gradient | sf-bc-hero-from, sf-bc-hero-to | 1 each |
| Stat gradient | sf-bc-stat-from, sf-bc-stat-to | 2 each |
| Typography | sf-bc-display, sf-bc-body | 1–18 |

### Spec drift observation

The `--sf-bc-*` prefix is technically outside CLAUDE.md §3's locked spec
(which is `--em-*` only). The broadcast-overlay stylesheet was
intentionally scoped separately during the Phase 0C Skyfire→Ember rename
to keep broadcast/streaming output tokens distinct from the platform UI
tokens.

**Action**: None today, but worth flagging — if CLAUDE.md §3 evolves to
include broadcast tokens, they should be migrated to `--em-bc-*` for
naming consistency. For now, the `--sf-bc-*` namespace is a documented
exception.

## Findings

- **4 reserved-but-unused `--em-*` tokens** — all intentional per CLAUDE.md §3 locked spec. No action.
- **0 schema-vs-spec drift** in `--em-*` namespace (every defined token IS in CLAUDE.md §3; every CLAUDE.md §3 token IS defined).
- **0 unused `--sf-bc-*` tokens** in broadcast.css.
- **Namespace observation**: `--sf-bc-*` predates / lives outside the Phase 0C rename. Worth a future consistency pass to consolidate under `--em-bc-*`, but not load-bearing.

## CI enforcement (future)

A vitest assertion could pin the spec — for each `--em-*` definition in
`index.css`, assert ≥1 `var(--em-X)` usage in `src/` (excluding the
def site). Would fail CI if a new token is added without being used,
OR if a token is removed without first removing its usages.

Counter-argument: the 4 intentional reserves would break the assertion.
Mitigation: maintain an exempt list (like the route audit pattern) OR
relax to "WARN if reserved tokens accumulate >5".

Lean: defer mechanical enforcement. Re-run this audit when CLAUDE.md §3
spec changes (token added/removed/recolored).

## Source of truth

- Definitions: `src/index.css` :root + `src/styles/broadcast.css` :root
- Usage grep: `grep -rE "var\(--<token>[\,\)]"` across `src/**/*.{jsx,js,css}`
- Locked spec: CLAUDE.md §3 ("DESIGN TOKENS (LOCKED — COPY EXACTLY INTO index.css :root)")
- Audit author: CC session (orphan-class follow-up after PR #274)
