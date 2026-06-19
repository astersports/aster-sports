# Aster Sports: Structure and Ownership (canonical)

Last updated: 2026-06-19. This file is the single reference for what Aster Sports
is, how it relates to Legacy Hoopers, and what each repo in the `astersports` org
(plus the split-out St Patrick repo) contains. If any other doc, README, or
description conflicts with this file, this file wins until it is itself revised.

## 1. Ownership and legal

- **Olive Juice Inc** is the incorporated company.
- **Aster Sports** is a DBA of Olive Juice Inc. It is an app and web-design company
  owned by Frank Samaritano. It is a separate legal entity from Legacy Hoopers.
  Kenny Lane has no involvement in Aster Sports.
- **Legacy Hoopers LLC** is a separate company: Westchester NY AAU youth basketball,
  grades 2-5. Frank is part owner, program manager, and a parent of two players.
  Kenny Lane is coaching director and part owner of Legacy Hoopers only.

## 2. Product: the Aster Sports app

- The **Aster Sports app** (this repo, `astersports/aster-sports`) is a multi-tenant
  SaaS platform for youth sports operations. It is the parent product.
- **Tenants** are organization rows inside the app. Each tenant carries its own brand
  colors and logo, applied at runtime from `organizations.brand_colors` in AuthContext,
  so one shared theme flips per tenant. Platform default brand is gold `#C9952E` on
  header navy `#151525`. A tenant's brand (for example Legacy Hoopers cobalt `#4a8fd4`
  plus knight logo) enters at runtime from the database and is never hardcoded.
- **Legacy Hoopers** is the first tenant, the pilot. Rollout Fall 2026, then work
  through bugs.
- **St Patrick (Armonk)** is a planned future tenant.
- More tenants follow.

## 3. Agency: Aster Sports web design

Aster Sports also builds websites. Current projects:
- **Legacy Hoopers website** redesign, replacing the current Squarespace site at
  legacyhoopers.org.
- **St Patrick (Armonk) parish website.**
- **Aster Sports' own marketing site** at astersports.io.

## 4. Domains

| Property | Domain(s) |
|---|---|
| Aster Sports app (SaaS platform) | astersports.app, astersports.co |
| Aster Sports marketing site | astersports.io |
| Legacy Hoopers (current live) | legacyhoopers.org (Squarespace, being redesigned) |
| St Patrick Armonk (current live) | stpatchurch-m5he85hc.manus.space |

## 5. Repositories

| Repo | What it is |
|---|---|
| `astersports/aster-sports` | The multi-tenant SaaS app (this repo). Formerly skyfire-app, Ember, Skyfire. |
| `astersports/astersports-web` | Aster Sports' own marketing site (astersports.io). Manus-built full-stack scaffold. Includes an AAU section, see section 9. |
| `astersports/legacy-hoopers` | Legacy Hoopers website redesign. Distinct from the Legacy Hoopers tenant inside the app. Manus-built. |
| `astersports/st-patricks-armonk` | Original St Patrick build. Was in a complete state. See section 6. |
| `stpatsweb1969/st-patricks-website` | Current St Patrick site, moved to a separate GitHub account to isolate it for the parish. Live at stpatchurch-m5he85hc.manus.space. |

## 6. St Patrick split (open reconciliation)

The St Patrick build originally lived under the `astersports` org as `st-patricks-armonk`,
in a complete state. It was migrated to a separate account,
`stpatsweb1969/st-patricks-website`, to isolate it for the parish. Not all code was
pulled over during the migration. The new repo is in sync with the live `.manus.space`
site (last push `21907e6`, "Get Directions button"), but it is not yet confirmed to be
a full superset of the original. Reconciling the missing code is a later task, after the
first three repos are cleaned up.

## 7. Build lanes

- The **Aster Sports app** is built in **Claude Code**.
- The **websites** (astersports-web, legacy-hoopers, st-patricks-website) are built in
  **Manus**, which has an API connection into Claude.
- Claude is the architect for all four.

## 8. "Legacy Hoopers" means three things

Always name which one:
1. **Legacy Hoopers LLC**, the real-world basketball organization.
2. **The Legacy Hoopers tenant**, an organization row inside the Aster Sports app.
3. **The `legacy-hoopers` repo**, the website redesign, an Aster Sports agency
   deliverable, distinct from the tenant.

## 9. Exploratory (not committed)

A "next level" AAU team may branch off under Aster Sports rather than Legacy Hoopers.
The astersports.io marketing site already includes an AAU section anticipating this.
Treat as exploratory until confirmed.
