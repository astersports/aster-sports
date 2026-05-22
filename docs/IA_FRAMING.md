# Briefing IA Framing

> Light reference doc capturing the locked briefing IA strategy. Routes,
> entry surfaces, and how detail-page deep-links funnel into the portal.
> Originated in chat-side Decision D (Wave 4.4-B Session 1, 2026-05-13).
> Shipped 2026-05-22 per §4.B ledger close.

## One portal, many entry surfaces

The briefing system has **one canonical compose surface** (the portal at
`/admin/briefings/compose`) and **multiple entry points** that funnel
admins into it with progressively more pre-fill.

The portal owns the wizard state, draft autosave, kind selection, and
the send pipeline. Entry surfaces are conveniences — none owns the
compose UI itself.

## Three classes of entry

### 1. Cold start — admin home Quick Action

`/admin` → Quick Actions row → **Compose Briefing**

```
/admin/briefings/compose
```

No URL params. Wizard starts at Step 1 (Kind), no anchor pre-filled,
audience derived from Kind metadata.

Implementation: `src/components/admin/QuickActions.jsx:45`.

### 2. Anchor-only deep-link — detail-page convenience CTA

Team / Tournament / Event detail pages expose a "Send briefing" CTA
that pre-fills the anchor but not the kind.

```
/admin/briefings/compose?anchor=team&id=<team_id>
/admin/briefings/compose?anchor=tournament&id=<tournament_id>
/admin/briefings/compose?anchor=event&id=<event_id>
```

URL params: `anchor=<kind>` + `id=<uuid>`. Wizard starts at Step 1
(Kind), anchor pre-filled, audience defaults derived per the anchor
(e.g., `audience_type='team'` for `anchor=team`). Admin picks the kind.

Implementation:
- Team: `src/components/roster/TeamDetailHero.jsx:104`
- Tournament: `src/components/tournament/TournamentHeader.jsx`
- Event: `src/components/event/EventHeroActions.jsx:71` +
  `src/pages/EventDetailPage.jsx:103`

### 3. Anchor + kind deep-link — moment-specific primary CTA

When the moment dictates the kind (upcoming tournament → prelim; past
game → recap), detail pages expose a kind-specific CTA in addition to
the generic anchor-only deep-link.

```
/admin/briefings/compose?kind=tournament_prelim&anchor=tournament&id=<id>
/admin/briefings/compose?kind=tournament_recap&anchor=tournament&id=<id>
/admin/briefings/compose?kind=game_recap&anchor=event&id=<id>
```

URL params: `kind=<kind>` + `anchor=<kind>` + `id=<uuid>`. Wizard jumps
to Step 3 (Body) — both kind AND anchor pre-filled. Admin lands on the
body editor ready to write.

Implementation: `src/components/briefings/ComposeAnchorCta.jsx`.

Predicate gates per surface:
- Tournament prelim: `start_date > now`
- Tournament recap: `end_date < now`
- Event game_recap: `event_type === 'game' && start_at < now`

In-flight states (mid-tournament, in-progress game) render no
kind-specific CTA — the anchor-only deep-link (class 2) remains
available for announcement/custom_message sends.

## URL param hydration

Param hydration lives in
`src/components/briefings/briefingComposerHelpers.js` → `buildInitial`.
Decision tree:

- `kind + anchor + id` → start at Step 3 (Body), everything pre-filled
- `anchor + id` only → start at Step 1 (Kind), anchor pre-filled
- No params → start at Step 1 (Kind), cold start

Audience pre-fill from anchor:
- `anchor=team&id=<uuid>` → `audience_type='team'`,
  `audience_filter={team_ids:[id]}`
- `anchor=event` / `anchor=tournament` → param taxonomy scaffolded;
  audience pre-fill ships in future sessions (currently falls through
  to `KIND_METADATA` defaults at Step 1).

## What this IA closes

Before Wave 4.4-B Session 1: detail pages had inline modal compose UIs
(`SendBriefingButton`) that opened the wizard in place. State was
component-local. Drafts didn't autosave to the portal's inbox. Each
mount was a separate session.

After: detail pages funnel admins INTO the portal via deep-link, so
the wizard state is owned by the route, drafts autosave to the inbox,
and the canonical entry surface (`/admin/briefings/compose`) is the
single source of truth for compose state.

Net wins: one autosave path, one history, one keyboard shortcut surface,
one place to extend the wizard. Detail-page CTAs become marketing —
they sell the moment but don't own the workflow.

## Anchor-only CTAs shipped per surface

| Surface | Path | Anchor | Status |
|---|---|---|---|
| Admin home Quick Action | `QuickActions.jsx` | — | Wave 4.4-B Session 1 |
| Team detail (hero) | `TeamDetailHero.jsx` | team | Wave 4.4-B Session 1 |
| Event detail (hero) | `EventDetailPage.jsx` + `EventHeroActions.jsx` | event | L99 event detail redesign |
| Tournament detail | `TournamentHeader.jsx` | tournament | §4.B-1 (this close, 2026-05-22) |
| Event detail (header overflow) | `EventDetailHeader.jsx` | event | Still legacy `SendBriefingButton` icon-only — out of §4.B scope |

The Event detail header overflow uses the legacy inline pattern with
an icon-only variant. Out of §4.B scope; could migrate to a deep-link
overflow menu item in a follow-up if the inline modal becomes a
maintenance burden.

## Anti-patterns this IA respects

- **#34** — registry/dispatch-table removals: removing
  `SendBriefingButton` callers in same PR as deletion (Tournament:
  §4.B-1; Team: Wave 4.4-B Session 1).
- **#43** — cross-surface invariant tests: every anchor-only deep-link
  ships with an invariant test asserting the URL shape
  (`TournamentHeaderSendBriefingDeepLink.test.jsx`, follow-on equivalents
  for team + event).
- **#42** — no parallel systems: the portal IS the wizard; detail-page
  CTAs are deep-links, not duplicate wizards.
