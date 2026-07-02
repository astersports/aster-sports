# R1 Indexability — Build Spec
**intended path:** `docs/aau/SPEC_R1_INDEXABILITY_2026-07-01.md`

> **Purpose.** Settle the design for making the public AAU Hub crawlable/indexable — the open R1 gate and the R2 cutover exit gate (#1178). The foundation is in (RPC contract frozen, client truth-port done); this spec covers the SSR layer, per-route meta, and sitemap/robots generation. Architect lane (design + decisions); CC executes against it after review. It is a spec, not a build — §8 items resolve by a bounded spike before full commit.
>
> **Grounded state (2026-07-01).** Public Hub is a pure Vite SPA: `vercel.json` rewrites `/(.*) → /index.html`; `build: vite build` (no SSR/prerender/meta-framework dep in tree); no `robots.txt`/`sitemap`; `index.html` carries generic **site-level** OG only. A crawler hitting `/hub/tournament/<id>` gets an empty `#root`. Indexability is greenfield — a build, not a config flip.
>
> **Gates that hold, carried into SSR.** 🔴 Plane-A only (public RPCs, `org_is_public_listed`; no PII/child/money field crosses the boundary). 🟢 Basis-gate (render only from real data; never fabricate a rating/record/projection). Live-tick-never-cached. Single source of truth = `get_public_*` RPCs (no server-side recomputation).

---

## 1. The freshness boundary — the load-bearing decision

The Hub is live: scores poll every 5 min on game days (#1186). A stale score baked into cacheable HTML is a sub-100%-accuracy surface — the failure mode that loses a parent. So freshness here is an **honesty decision, not a performance one**, and it forces every downstream choice.

- **SSR-stable layer** (server-rendered, cacheable, crawler-indexed): entity existence + structure — tournament / division / team, brackets, pools, **completed/final** results — plus per-route meta and canonical URL. Changes only on ingest.
- **Client-hydrate live layer** (never SSR'd, never cached): in-progress scores, live standings deltas, court fills, leave-by. Changes intra-poll.

**Rule:** server-render what is settled at ingest granularity; hydrate what moves intra-poll. A crawler indexes the stable layer; a user gets the stable layer instantly (SSR), then the live layer hydrates. **No live tick is ever served from cache.** Basis-gate carries in — a division with no results SSRs "no results yet," never a fabricated standing.

Every choice below follows from this boundary.

## 2. Rendering approach

Decided from §1:

- **On-demand SSR for the public route tree, cached with revalidate-on-ingest (ISR-style).** Server renders the stable layer from `get_public_*`; client hydrates the live layer on top.
- **NOT static SSG** — it bakes updatable data into stale HTML; wrong for a live product.
- **NOT a full framework migration** — blast radius: do not rewrite the app to index a wedge.
- **Public routes only; the authenticated-tier SPA is untouched.** The SSR layer wraps the public Browse → Tournament → Division → Team tree; authed tiers and the native client stay client-only.

Caching is safe because the stable layer changes only on ingest; the live layer is hydrated client-side, so cache staleness never touches a live tick. Revalidate on the ingest write (on-ingest hook preferred — fresh exactly when data changes; short-TTL as fallback).

**One open decision → bounded spike (§8), not a blind commit:** the exact SSR mechanism on Vite-SPA-on-Vercel. Prove it on ONE route first.

## 3. Sitemap + robots — the same freshness question, different hat

- **`sitemap.xml` generated from the public RPCs**, never hand-maintained. Enumerate public tournaments → divisions → teams via the RPC layer; emit URL + `lastmod` from each entity's last-ingest timestamp (an honest freshness signal to crawlers).
- **Revalidated on the same ingest hook as §2** — one freshness trigger, two consumers (SSR cache + sitemap).
- **Plane-A only:** only `org_is_public_listed` entities; a non-public tournament never appears (same boundary as the RPC contract).
- **Sitemap index** if the public URL set exceeds the 50k-URL / 50MB cap — enumerate current count to decide single-file vs index (§8).
- **`robots.txt`:** allow the public route tree, reference the sitemap, and **disallow the authenticated/private routes** — robots must not advertise auth-walled or child-data surfaces.

## 4. Per-route meta

Dynamic `<title>` / description / OG per tournament / division / team, server-rendered from RPC data — the existing generic OG scaffolding in `index.html` becomes per-entity. Basis-gated (meta from real entity data, never a fabricated description). Canonical URL per route on astersports.app — until R2 301s the legacy `/aau` paths, the canonical prevents a duplicate-content split.

## 5. Invariants — the gates, inside SSR

- **Plane-A only** — SSR reads public RPCs; no PII/child/money field crosses into rendered HTML.
- **Basis-gate** — never SSR a fabricated rating/record/projection; "no data yet" renders honestly.
- **Live-tick-never-cached** — the §1 boundary is the enforcement.
- **Single source of truth** — SSR renders from `get_public_*`; **no server-side standings recomputation.** The client-side record math was retired at truth-port; do not reintroduce a second truth in the SSR layer.
- **No private surface in sitemap or robots.**

## 6. Build sequence — by blast radius

1. **Spike one public route** (one tournament) — SSR the stable layer + its revalidation hook; prove the mechanism and freshness end-to-end. Review before rolling.
2. **Roll to the full public tree** (tournament / division / team) once the pattern is proven.
3. **Sitemap + robots** land additively in parallel once the entity-enumeration RPC path is confirmed (low-risk, no SPA change).
4. **Authenticated SPA untouched** throughout.

## 7. Acceptance / exit gates — R1 indexability is done when…

- A no-JS fetch (`curl`, or a crawler) of a public route returns real per-entity HTML + per-route meta — not an empty `#root`.
- `sitemap.xml` enumerates all public entities from the RPCs, `lastmod` present, Plane-A only, regenerated on ingest.
- `robots.txt` allows public, disallows private, references the sitemap.
- The live layer hydrates client-side; no live tick is served stale from cache.
- A sample route passes Google URL Inspection / Rich Results (real content indexed).
- **This is also the R2 exit gate (#1178)** — the front-door cutover cannot proceed until it is proven, since R2 301s the legacy paths onto these indexable routes.

## 8. Open decisions — resolve by spike, don't blind-commit

- **SSR mechanism:** Vite SSR + Vercel functions vs vike (vite-plugin-ssr) for the public routes. Decide from the one-route spike — clean per-route render + revalidation with least blast radius wins.
- **Revalidation trigger:** on-ingest hook (fresh exactly on data change; couples ingest → web app) vs short-TTL (simpler; slightly-stale *stable* layer, acceptable since the live layer hydrates regardless). Lean on-ingest; confirm the hook is cheap in the spike.
- **Sitemap size:** single file vs sitemap index — enumerate current public URL count against the 50k cap to decide.

---

*Sequencing note.* This spec assumes R1-first routing (architect lean, owner's call pending business context). It is not wasted under R3-first: R1 indexability gates the irreversible R2 cutover regardless of whether R3 slots before or after, so the design holds either way.
