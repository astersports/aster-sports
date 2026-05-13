# Wave 3a — Broadcast component library foundation (v2, council-patched)

Read `CLAUDE.md` before starting. Pay particular attention to section 0 (anti-drift rules) and section 11 (anti-patterns). Read `EMBER_MASTER_INDEX_v3.md` sections 0B (GROUND TRUTH) and 10 (broadcast mode 22-component list).

## Scope
One session. Stand up the broadcast layer foundation. Build 5 React components, 1 hook, 1 stylesheet, 1 token module, 1 preview page, and add one constant to the existing constants file. Render real Spring 2026 records on `/records-preview`. Visual fidelity is verified by side-by-side comparison with `/mnt/project/records-v14_2.html`.

## What this is NOT
- Not the full Records page (that's Wave 3b)
- Not email rendering (that's Wave 4)
- Not a refactor of the existing parent home or schedule
- Not a place to touch any file outside the list below

## Files to create (9)

1. `src/lib/design-tokens.js`
2. `src/styles/broadcast.css`
3. `src/hooks/useTeamRecords.js`
4. `src/components/broadcast/BroadcastHeroHeader.jsx`
5. `src/components/broadcast/StatHeroBar.jsx`
6. `src/components/broadcast/TeamIdentityCard.jsx`
7. `src/components/broadcast/TournamentCard.jsx`
8. `src/components/broadcast/GameLogRow.jsx`
9. `src/pages/RecordsPreview.jsx`

## Files to edit (3)

1. `src/lib/constants.js` — add `TEAM_COLORS` export
2. `src/main.jsx` — one new import line
3. `src/App.jsx` (or the file containing `<Routes>`) — one import + one route

## Token namespace decision

Broadcast mode introduces `--sf-bc-*` tokens (additive layer). Existing `--sf-*` tokens are not modified, renamed, or removed. The `--sf-bc-*` tokens live in `src/styles/broadcast.css`, scoped to `.bc-root`. This means cockpit pages render identically. Only pages that wrap their tree in `.bc-root` pick up the broadcast palette.

This satisfies CLAUDE.md anti-drift rule 1 (no inventing tokens that conflict with section 3 list) and rule 2 (no renaming). The `--sf-bc-*` set is a parallel, scoped layer for broadcast surfaces. Phase 0C will rename both sets to `--em-*` in Wave 12.

Per CLAUDE.md anti-pattern enforcement (no constants outside `lib/constants.js`): team color values live in `constants.js` as `TEAM_COLORS`. The `design-tokens.js` module re-exports them as `teamColors` for ergonomic import alongside palette and font tokens, but does NOT define them.

---

## File 1 — `src/lib/design-tokens.js`

Create the file with this exact content:

```js
/**
 * Skyfire design tokens — single source of truth for design primitives.
 *
 * Cockpit mode (existing app) consumes --sf-* CSS vars from index.css.
 * Broadcast mode (Records, Team detail, Tournaments) consumes --sf-bc-* CSS vars
 * from src/styles/broadcast.css, scoped to the .bc-root wrapper.
 * Email templates (Wave 4) consume the JS constants below to produce
 * inline-styled HTML for Outlook/Gmail compatibility.
 *
 * Decision 44: typography AND color tokens have screen vs email values.
 * Decision 68: email templates use brand cobalt always, never team_color.
 *
 * Anti-pattern compliance: domain constants live in lib/constants.js.
 * This module holds only design system primitives (palette, fonts,
 * helper fns) plus a convenience re-export of TEAM_COLORS.
 */

import { TEAM_COLORS } from './constants';

export const colors = {
  brandCobalt:      '#4a8fd4',
  brandCobaltHover: '#5BA0E0',

  bcBg:        '#070d17',
  bcCard:      '#0e1e33',
  bcCardAlt:   '#132845',
  bcBorder:    'rgba(74,143,212,0.18)',
  bcGlow:      'rgba(74,143,212,0.25)',
  bcHeroFrom:  '#091c36',
  bcHeroTo:    '#0d2a50',
  bcStatFrom:  '#0b1f3a',
  bcStatTo:    '#122d52',

  bcGold:  '#f59e0b',
  bcGreen: '#22c55e',
  bcRed:   '#ef4444',

  emailBorder:   '#4a8fd4',
  emailHeaderBg: '#4a8fd4',
  emailFooterBg: '#4a8fd4',
};

export const fonts = {
  email:         'Arial, Helvetica, sans-serif',
  screen:        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  screenDisplay: "'Barlow Condensed', 'Barlow', -apple-system, BlinkMacSystemFont, sans-serif",
};

// Re-export for ergonomic single-import access. Source of truth is constants.js.
export const teamColors = TEAM_COLORS;

export function teamGlow(hex, alpha = 0.25) {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m) return `rgba(74,143,212,${alpha})`;
  const [r, g, b] = m.map((h) => parseInt(h, 16));
  return `rgba(${r},${g},${b},${alpha})`;
}
```

---

## File 1.5 — `src/lib/constants.js` (edit, add export)

Add the `TEAM_COLORS` export to the existing `lib/constants.js` file. If the file does not yet have this export, append:

```js
/**
 * Spring 2026 production v14 palette. Sourced from records-v14_2.html.
 * Used by broadcast components (left border, badge, record number)
 * and any other surface that displays a team in its identity color.
 *
 * Email templates DO NOT use these — see Decision 68 (cobalt always for email).
 */
export const TEAM_COLORS = {
  '11U Girls': '#a78bfa',
  '10U Black': '#4a8fd4',
  '10U Blue':  '#94a3b8',
  '9U Boys':   '#06b6d4',
  '8U Boys':   '#f59e0b',
};
```

If `TEAM_COLORS` already exists in `constants.js` with the same values: skip. Do not duplicate. If it exists with different values: STOP and report the conflict back to user.

---

## File 2 — `src/styles/broadcast.css`

Create the file with this exact content:

```css
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Barlow:wght@400;600;700&display=swap');

.bc-root {
  --sf-bc-bg:          #070d17;
  --sf-bc-card:        #0e1e33;
  --sf-bc-card-alt:    #132845;
  --sf-bc-border:      rgba(74,143,212,0.18);
  --sf-bc-glow:        rgba(74,143,212,0.25);
  --sf-bc-cobalt:      #4a8fd4;
  --sf-bc-gold:        #f59e0b;
  --sf-bc-green:       #22c55e;
  --sf-bc-red:         #ef4444;
  --sf-bc-text:        #ffffff;
  --sf-bc-text-mute:   rgba(255,255,255,0.5);
  --sf-bc-text-soft:   rgba(255,255,255,0.8);
  --sf-bc-hero-from:   #091c36;
  --sf-bc-hero-to:     #0d2a50;
  --sf-bc-stat-from:   #0b1f3a;
  --sf-bc-stat-to:     #122d52;
  --sf-bc-display:     'Barlow Condensed', 'Barlow', -apple-system, sans-serif;
  --sf-bc-body:        'Barlow', -apple-system, sans-serif;

  background: var(--sf-bc-bg);
  color: var(--sf-bc-text);
  font-family: var(--sf-bc-body);
  font-size: 17px;
  line-height: 1.5;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

.bc-root *,
.bc-root *::before,
.bc-root *::after { box-sizing: border-box; }

.bc-page    { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.bc-section { padding: clamp(32px, 6vw, 56px) 0 0; }

/* Hero */
.bc-hero {
  position: relative;
  padding: 48px 24px 44px;
  background: linear-gradient(135deg, var(--sf-bc-hero-from), var(--sf-bc-hero-to));
  overflow: hidden;
  border-bottom: 1px solid var(--sf-bc-border);
}
.bc-hero::after {
  /* Wave 3a: hardcoded "RECORDS" ghost word. Wave 3b will accept ghostWord prop. */
  content: 'RECORDS';
  position: absolute;
  right: -10px;
  top: 50%;
  transform: translateY(-50%);
  font-family: var(--sf-bc-display);
  font-size: clamp(90px, 16vw, 200px);
  font-weight: 800;
  color: rgba(74,143,212,0.06);
  line-height: 1;
  pointer-events: none;
  white-space: nowrap;
  z-index: 0;
}
.bc-hero-inner    { position: relative; z-index: 1; }
.bc-hero-eye      { font-family: var(--sf-bc-display); font-size: 13px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--sf-bc-cobalt); margin-bottom: 8px; }
.bc-hero-h1       { font-family: var(--sf-bc-display); font-size: clamp(42px, 8vw, 80px); font-weight: 800; letter-spacing: 0.01em; text-transform: uppercase; line-height: 0.92; margin-bottom: 12px; color: var(--sf-bc-text); }
.bc-hero-h1 b     { color: var(--sf-bc-cobalt); font-weight: 800; }
.bc-hero-sub      { font-size: 17px; max-width: 440px; margin-bottom: 28px; }
.bc-hero-tags     { display: flex; flex-wrap: wrap; gap: 8px; }
.bc-hero-tag      { font-family: var(--sf-bc-display); font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 5px 14px; border-radius: 4px; background: rgba(74,143,212,0.14); border: 1px solid rgba(74,143,212,0.3); color: var(--sf-bc-cobalt); }
.bc-last-updated  { font-size: 14px; color: var(--sf-bc-text-soft); font-style: italic; margin-top: 20px; }

/* Stat hero bar */
.bc-statbar       { display: flex; background: linear-gradient(135deg, var(--sf-bc-stat-from), var(--sf-bc-stat-to)); border-bottom: 4px solid var(--sf-bc-cobalt); }
.bc-statbar-item  { flex: 1; text-align: center; padding: 16px 8px; border-right: 1px solid rgba(255,255,255,0.08); }
.bc-statbar-item:last-child { border-right: none; }
.bc-statbar-num   { font-family: var(--sf-bc-display); font-size: clamp(22px, 4vw, 30px); font-weight: 800; line-height: 1; display: block; color: var(--sf-bc-text); }
.bc-statbar-num.gold  { color: var(--sf-bc-gold); }
.bc-statbar-num.green { color: var(--sf-bc-green); }
.bc-statbar-lbl   { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sf-bc-text-mute); margin-top: 5px; display: block; }

/* Team identity card */
.bc-team          { background: var(--sf-bc-card); border: 1px solid var(--sf-bc-border); border-left: 4px solid var(--team-color, var(--sf-bc-cobalt)); border-radius: 10px; padding: 20px; margin-bottom: 14px; }
.bc-team-head     { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
.bc-team-badge    { font-family: var(--sf-bc-display); font-size: 22px; font-weight: 800; color: var(--team-color, var(--sf-bc-cobalt)); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.04); border-radius: 8px; flex-shrink: 0; }
.bc-team-id       { flex: 1; min-width: 0; }
.bc-team-name     { font-family: var(--sf-bc-display); font-size: 22px; font-weight: 800; text-transform: uppercase; color: var(--sf-bc-text); line-height: 1.1; }
.bc-team-meta     { font-size: 13px; color: var(--sf-bc-text-mute); margin-top: 4px; }
.bc-team-rec      { font-family: var(--sf-bc-display); font-size: 28px; font-weight: 800; color: var(--team-color, var(--sf-bc-cobalt)); line-height: 1; text-align: right; text-shadow: 0 0 14px var(--team-glow, var(--sf-bc-glow)); }
.bc-team-streak   { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--sf-bc-text-soft); margin-top: 4px; text-align: right; }
.bc-team-grid     { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0; border-top: 1px solid var(--sf-bc-border); padding-top: 16px; }
.bc-team-cell     { text-align: center; border-right: 1px solid var(--sf-bc-border); }
.bc-team-cell:last-child { border-right: none; }
.bc-team-cell-num { font-family: var(--sf-bc-display); font-size: 22px; font-weight: 800; color: var(--sf-bc-text); line-height: 1; }
.bc-team-cell-lbl { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sf-bc-text-mute); margin-top: 6px; }

/* Tournament card */
.bc-tourney       { background: var(--sf-bc-card); border: 1px solid var(--sf-bc-border); border-radius: 10px; overflow: hidden; margin-bottom: 14px; }
.bc-tourney-head  { background: linear-gradient(135deg, var(--sf-bc-stat-from), var(--sf-bc-stat-to)); padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.bc-tourney-name  { font-family: var(--sf-bc-display); font-size: 17px; font-weight: 800; text-transform: uppercase; color: var(--sf-bc-text); }
.bc-tourney-date  { font-size: 13px; color: var(--sf-bc-text-soft); margin-top: 2px; }
.bc-tourney-pill  { font-family: var(--sf-bc-display); font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 5px 11px; border-radius: 4px; background: rgba(74,143,212,0.14); border: 1px solid rgba(74,143,212,0.3); color: var(--sf-bc-cobalt); }
.bc-tourney-pill.next     { background: rgba(34,197,94,0.14); border-color: rgba(34,197,94,0.3); color: var(--sf-bc-green); }
.bc-tourney-pill.complete { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.18); color: var(--sf-bc-text-soft); }
.bc-tourney-body  { padding: 14px 18px; }
.bc-tourney-loc   { font-size: 13px; color: var(--sf-bc-text-mute); margin-bottom: 10px; }
.bc-tourney-row   { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; font-size: 14px; }
.bc-tourney-team  { font-weight: 700; color: var(--sf-bc-text); }
.bc-tourney-badge { font-family: var(--sf-bc-display); font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 3px 10px; border-radius: 4px; background: rgba(245,158,11,0.14); border: 1px solid rgba(245,158,11,0.3); color: var(--sf-bc-gold); }

/* Game log row */
.bc-glog          { display: grid; grid-template-columns: 36px 1fr auto; gap: 12px; align-items: center; padding: 12px 14px; border-radius: 8px; margin-bottom: 6px; background: var(--sf-bc-card-alt); border: 1px solid var(--sf-bc-border); }
.bc-glog-result   { font-family: var(--sf-bc-display); font-size: 18px; font-weight: 800; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 6px; }
.bc-glog-result.W { background: rgba(34,197,94,0.18); color: var(--sf-bc-green); }
.bc-glog-result.L { background: rgba(239,68,68,0.18); color: var(--sf-bc-red); }
.bc-glog-mid      { display: flex; flex-direction: column; min-width: 0; }
.bc-glog-vs       { font-weight: 700; color: var(--sf-bc-text); font-size: 15px; line-height: 1.2; }
.bc-glog-date     { font-size: 12px; color: var(--sf-bc-text-mute); margin-top: 2px; }
.bc-glog-score    { font-family: var(--sf-bc-display); font-size: 18px; font-weight: 800; color: var(--sf-bc-text); }

/* Section heading inside broadcast pages */
.bc-sec-eye       { font-family: var(--sf-bc-display); font-size: 14px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--sf-bc-cobalt); margin-bottom: 8px; }
.bc-sec-h2        { font-family: var(--sf-bc-display); font-size: clamp(28px, 5vw, 44px); font-weight: 800; text-transform: uppercase; line-height: 1.05; color: var(--sf-bc-text); margin-bottom: 18px; }
.bc-sec-h2 b      { color: var(--sf-bc-cobalt); }
```

---

## File 3 — `src/hooks/useTeamRecords.js`

Create the file with this exact content:

```js
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Reads game_results for a team. If teamId is null, returns the org-level summary.
 * org_id is scoped via RLS — every query hits org boundary automatically.
 *
 * Note: column name `played_at` is assumed. Wave 3b verifies via Supabase
 * SQL Editor and patches if the actual column is `game_date` or other.
 *
 * Returns: { loading, error, games, summary }
 *   summary = { record, streak, ppg, allowed, diff, winPct, gamesPlayed }
 */
export function useTeamRecords(teamId, orgId) {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [games, setGames]     = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);

      let q = supabase
        .from('game_results')
        .select('id, team_id, opponent_name, our_score, opponent_score, played_at, is_published')
        .eq('org_id', orgId)
        .eq('is_published', true)
        .order('played_at', { ascending: true });

      if (teamId) q = q.eq('team_id', teamId);

      const { data, error } = await q;
      if (cancelled) return;
      if (error) { setError(error); setLoading(false); return; }
      setGames(data || []);
      setLoading(false);
    }
    if (orgId) load();
    return () => { cancelled = true; };
  }, [teamId, orgId]);

  const summary = computeSummary(games);
  return { loading, error, games, summary };
}

function computeSummary(games) {
  const n = games.length;
  if (n === 0) return { record: '0-0', streak: '—', ppg: 0, allowed: 0, diff: 0, winPct: 0, gamesPlayed: 0 };

  let wins = 0, losses = 0, pf = 0, pa = 0;
  for (const g of games) {
    pf += Number(g.our_score) || 0;
    pa += Number(g.opponent_score) || 0;
    if ((g.our_score ?? 0) > (g.opponent_score ?? 0)) wins += 1; else losses += 1;
  }

  let streakKind = null, streakLen = 0;
  for (let i = games.length - 1; i >= 0; i -= 1) {
    const g = games[i];
    const w = (g.our_score ?? 0) > (g.opponent_score ?? 0);
    const kind = w ? 'W' : 'L';
    if (streakKind === null) { streakKind = kind; streakLen = 1; continue; }
    if (kind === streakKind) streakLen += 1; else break;
  }

  const ppg     = +(pf / n).toFixed(1);
  const allowed = +(pa / n).toFixed(1);
  const diff    = +((pf - pa) / n).toFixed(1);
  const winPct  = Math.round((wins / n) * 100);

  return {
    record: `${wins}-${losses}`,
    streak: `${streakKind}${streakLen}`,
    ppg, allowed, diff, winPct,
    gamesPlayed: n,
  };
}
```

If `src/lib/supabaseClient.js` exports under a different name (e.g., default export), adjust the import. Do not modify `supabaseClient.js`.

---

## File 4 — `src/components/broadcast/BroadcastHeroHeader.jsx`

Create the file with this exact content:

```jsx
import React from 'react';

/**
 * Broadcast hero. Eyebrow + headline + sub + tags + last-updated.
 * Headline accepts a string with <b>...</b> for cobalt emphasis.
 */
export default function BroadcastHeroHeader({
  eyebrow,
  headline,
  sub,
  tags = [],
  lastUpdated,
}) {
  return (
    <header className="bc-hero">
      <div className="bc-hero-inner">
        {eyebrow && <div className="bc-hero-eye">{eyebrow}</div>}
        {headline && (
          // Wave 3a: headline is fixture-controlled. Wave 3b will accept a
          // tuple-array prop and render <b>cobalt</b> emphasis without raw HTML.
          <h1
            className="bc-hero-h1"
            dangerouslySetInnerHTML={{ __html: headline }}
          />
        )}
        {sub && <p className="bc-hero-sub">{sub}</p>}
        {tags.length > 0 && (
          <div className="bc-hero-tags">
            {tags.map((t) => (
              <span key={t} className="bc-hero-tag">{t}</span>
            ))}
          </div>
        )}
        {lastUpdated && (
          <p className="bc-last-updated">Last updated {lastUpdated}</p>
        )}
      </div>
    </header>
  );
}
```

---

## File 5 — `src/components/broadcast/StatHeroBar.jsx`

Create the file with this exact content:

```jsx
import React from 'react';

/**
 * 3-to-5 cell stat bar. Used at the top of Records and team detail pages.
 * items: [{ value, label, variant?: 'gold' | 'green' }]
 */
export default function StatHeroBar({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="bc-statbar" role="group" aria-label="Summary statistics">
      {items.map((item, i) => (
        <div className="bc-statbar-item" key={`${item.label}-${i}`}>
          <span className={`bc-statbar-num ${item.variant || ''}`}>
            {item.value}
          </span>
          <span className="bc-statbar-lbl">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
```

---

## File 6 — `src/components/broadcast/TeamIdentityCard.jsx`

Create the file with this exact content:

```jsx
import React from 'react';

/**
 * Team identity card. Numbered badge + name + meta + record + streak +
 * 5-stat grid (PPG / ALLOWED / DIFF / WIN% / GAMES).
 *
 * teamColor is the ONLY hex that may be passed inline. Sourced from the
 * teams.color column. Used as left border + badge text + record number.
 * Glow alpha derived from teamColor + '40' suffix (25% alpha).
 */
export default function TeamIdentityCard({
  number,
  name,
  meta,
  teamColor,
  record,
  streak,
  stats,
}) {
  const style = teamColor
    ? {
        '--team-color': teamColor,
        '--team-glow': `${teamColor}40`,
      }
    : undefined;
  return (
    <article className="bc-team" style={style} aria-label={`${name} record`}>
      <div className="bc-team-head">
        <div className="bc-team-badge">{number}</div>
        <div className="bc-team-id">
          <div className="bc-team-name">{name}</div>
          {meta && <div className="bc-team-meta">{meta}</div>}
        </div>
        <div>
          <div className="bc-team-rec">{record}</div>
          {streak && <div className="bc-team-streak">{streak}</div>}
        </div>
      </div>
      {stats && (
        <div className="bc-team-grid">
          <Cell num={stats.ppg}     label="PPG" />
          <Cell num={stats.allowed} label="Allowed" />
          <Cell num={formatDiff(stats.diff)} label="Diff" />
          <Cell num={`${stats.winPct}%`} label="Win %" />
          <Cell num={stats.gamesPlayed}  label="Games" />
        </div>
      )}
    </article>
  );
}

function Cell({ num, label }) {
  return (
    <div className="bc-team-cell">
      <div className="bc-team-cell-num">{num}</div>
      <div className="bc-team-cell-lbl">{label}</div>
    </div>
  );
}

function formatDiff(d) {
  if (d == null) return '—';
  const n = Number(d);
  if (Number.isNaN(n)) return '—';
  return n > 0 ? `+${n}` : `${n}`;
}
```

---

## File 7 — `src/components/broadcast/TournamentCard.jsx`

Create the file with this exact content:

```jsx
import React from 'react';

/**
 * Tournament card. Dark navy header (name + dates + status pill),
 * white-on-navy body with location and per-team result rows.
 *
 * status: 'complete' | 'upcoming' | 'next'
 * results: [{ team, badge?: string }]   badge example: "Champions", "Finalists"
 */
export default function TournamentCard({
  name,
  dateRange,
  location,
  status = 'upcoming',
  results = [],
}) {
  const pillClass =
    status === 'next'     ? 'bc-tourney-pill next'
    : status === 'complete' ? 'bc-tourney-pill complete'
    : 'bc-tourney-pill';
  const pillLabel =
    status === 'next'     ? 'Up Next'
    : status === 'complete' ? 'Complete'
    : 'Upcoming';

  return (
    <article className="bc-tourney">
      <div className="bc-tourney-head">
        <div>
          <div className="bc-tourney-name">{name}</div>
          {dateRange && <div className="bc-tourney-date">{dateRange}</div>}
        </div>
        <span className={pillClass}>{pillLabel}</span>
      </div>
      <div className="bc-tourney-body">
        {location && <div className="bc-tourney-loc">{location}</div>}
        {results.map((r, i) => (
          <div className="bc-tourney-row" key={`${r.team}-${i}`}>
            <span className="bc-tourney-team">{r.team}</span>
            {r.badge && <span className="bc-tourney-badge">{r.badge}</span>}
          </div>
        ))}
      </div>
    </article>
  );
}
```

---

## File 8 — `src/components/broadcast/GameLogRow.jsx`

Create the file with this exact content:

```jsx
import React from 'react';

/**
 * Single game log row. Win/loss tile + opponent + date + score.
 * result: 'W' | 'L'
 * date: pre-formatted string ("Apr 12")
 * score: pre-formatted string ("32-28")
 *
 * Game log is a vertical feed, not tabular data — no table semantics.
 */
export default function GameLogRow({ result, date, opponent, score }) {
  return (
    <div className="bc-glog">
      <div className={`bc-glog-result ${result}`} aria-label={result === 'W' ? 'Win' : 'Loss'}>
        {result}
      </div>
      <div className="bc-glog-mid">
        <div className="bc-glog-vs">{opponent}</div>
        {date && <div className="bc-glog-date">{date}</div>}
      </div>
      <div className="bc-glog-score">{score}</div>
    </div>
  );
}
```

---

## File 9 — `src/pages/RecordsPreview.jsx`

Create the file with this exact content:

```jsx
import React from 'react';
import BroadcastHeroHeader from '../components/broadcast/BroadcastHeroHeader';
import StatHeroBar from '../components/broadcast/StatHeroBar';
import TeamIdentityCard from '../components/broadcast/TeamIdentityCard';
import TournamentCard from '../components/broadcast/TournamentCard';
import GameLogRow from '../components/broadcast/GameLogRow';
import { teamColors } from '../lib/design-tokens';

/**
 * Wave 3a verification page. Renders the 5 broadcast components with
 * Spring 2026 fixture data. The fixture matches the verified Y2b
 * game_results backfill and EMBER_MASTER_INDEX_v3.md Section 10 page 46.
 *
 * Wave 3b will replace the fixture with live useTeamRecords data.
 */

const TEAMS = [
  { number: 1, name: '11U Girls', meta: 'AAU · Zero Gravity', record: '5-2', streak: 'W1',
    stats: { ppg: 27.6, allowed: 21.3, diff: 6.3, winPct: 71, gamesPlayed: 7 } },
  { number: 2, name: '10U Black', meta: 'AAU · Zero Gravity', record: '5-4', streak: 'L4',
    stats: { ppg: 31.8, allowed: 27.8, diff: 4.0, winPct: 56, gamesPlayed: 9 } },
  { number: 3, name: '10U Blue',  meta: 'League Play',         record: '1-1', streak: 'L1',
    stats: { ppg: 29.0, allowed: 26.5, diff: 2.5, winPct: 50, gamesPlayed: 2 } },
  { number: 4, name: '9U Boys',   meta: 'League Play',         record: '0-1', streak: 'L1',
    stats: { ppg: 16.0, allowed: 24.0, diff: -8.0, winPct: 0,  gamesPlayed: 1 } },
  { number: 5, name: '8U Boys',   meta: 'AAU · Zero Gravity', record: '3-5', streak: 'L3',
    stats: { ppg: 17.3, allowed: 27.9, diff: -10.6, winPct: 38, gamesPlayed: 8 } },
];

const SAMPLE_GAMES = [
  { result: 'W', date: 'Apr 11', opponent: 'NY Rens',          score: '32-26' },
  { result: 'W', date: 'Apr 12', opponent: 'PSA Cardinals',    score: '28-24' },
  { result: 'L', date: 'Apr 18', opponent: 'Riverside Hawks',  score: '22-31' },
  { result: 'W', date: 'Apr 19', opponent: 'NY Lightning',     score: '34-29' },
];

export default function RecordsPreview() {
  return (
    <div className="bc-root">
      <BroadcastHeroHeader
        eyebrow="Spring 2026 · Legacy Hoopers"
        headline="THE <b>RECORDS</b>"
        sub="Five teams. One season. Every result, every streak, every stat."
        tags={['Spring 2026', '5 Teams', '27 Games']}
        lastUpdated="Apr 29, 2026"
      />

      <StatHeroBar
        items={[
          { value: 2,  label: 'Tournament Champs',   variant: 'gold' },
          { value: 2,  label: 'Nationals Qualified', variant: 'green' },
          { value: 5,  label: 'Active Teams' },
        ]}
      />

      <div className="bc-page">
        <section className="bc-section">
          <div className="bc-sec-eye">By Team</div>
          <h2 className="bc-sec-h2">SEASON <b>SNAPSHOT</b></h2>
          {TEAMS.map((t) => (
            <TeamIdentityCard
              key={t.name}
              number={t.number}
              name={t.name}
              meta={t.meta}
              teamColor={teamColors[t.name]}
              record={t.record}
              streak={t.streak}
              stats={t.stats}
            />
          ))}
        </section>

        <section className="bc-section">
          <div className="bc-sec-eye">Tournaments</div>
          <h2 className="bc-sec-h2">RUN OF <b>PLAY</b></h2>
          <TournamentCard
            name="ZG Chase for the Chain NY"
            dateRange="Apr 11-12"
            location="Westchester County, NY"
            status="complete"
            results={[
              { team: '11U Girls', badge: 'Champions' },
              { team: '10U Black', badge: 'Champions' },
              { team: '8U Boys',   badge: 'Finalists' },
            ]}
          />
          <TournamentCard
            name="NY Metro Showdown"
            dateRange="Apr 18-19"
            location="Westchester County, NY"
            status="complete"
            results={[
              { team: '11U Girls' },
              { team: '10U Black' },
              { team: '8U Boys' },
            ]}
          />
          <TournamentCard
            name="Rumble for the Ring CT"
            dateRange="May 16-17"
            location="Fairfield County, CT"
            status="next"
          />
          <TournamentCard
            name="ZG Nationals"
            dateRange="May 29 - Jun 7"
            location="Massachusetts"
            status="upcoming"
            results={[
              { team: '11U Girls', badge: 'Qualified' },
              { team: '10U Black', badge: 'Qualified' },
            ]}
          />
        </section>

        <section className="bc-section" style={{ paddingBottom: 64 }}>
          <div className="bc-sec-eye">Recent Results · 11U Girls</div>
          <h2 className="bc-sec-h2">GAME <b>LOG</b></h2>
          {SAMPLE_GAMES.map((g, i) => (
            <GameLogRow key={i} {...g} />
          ))}
        </section>
      </div>
    </div>
  );
}
```

---

## Edit 1 — `src/main.jsx`

Locate the existing CSS import line (likely `import './index.css'`). Add the broadcast stylesheet import on the line immediately after it. Use targeted str_replace.

**Find** (likely match — adjust if the surrounding code differs):
```js
import './index.css';
```

**Replace with:**
```js
import './index.css';
import './styles/broadcast.css';
```

If the file imports CSS differently (e.g., `import './styles/index.css'`), adjust accordingly. The rule: add exactly one new import line for `./styles/broadcast.css` adjacent to existing CSS imports. Do not touch any other line.

---

## Edit 2 — `src/App.jsx` (or whichever file contains `<Routes>`)

First, add the import. Locate the block of route component imports. Add this line in alphabetical or logical position next to other page imports:

```jsx
import RecordsPreview from './pages/RecordsPreview';
```

If pages are imported from a different relative path, use the matching path. Do not modify any other import line.

Second, add the route. Inside the existing `<Routes>` block, after the public/preview routes (or at the end before any catch-all `*` route), add:

```jsx
<Route path="/records-preview" element={<RecordsPreview />} />
```

Use targeted str_replace anchored on a stable nearby line. Do not reorder existing routes. Do not touch any wrapping `<Layout>` or guards. The `/records-preview` route should be accessible without auth so visual verification works in incognito or logged-out browser sessions. If the existing routing structure forces auth on every route, keep it inside the auth wrapper for this session and verify after login. Do not refactor the auth wrapper.

---

## Verification (run in this order)

```bash
# 1. Each broadcast file ≤150 lines
find src/components/broadcast src/hooks src/pages/RecordsPreview.jsx src/lib/design-tokens.js \
  -name '*.jsx' -o -name '*.js' 2>/dev/null \
  | xargs wc -l \
  | awk '$1 > 150 && !/total/ {print "FAIL: "$2" is "$1" lines"; bad=1} END {exit bad+0}' \
  && echo "PASS: all broadcast files ≤150 lines"

# 2. No hardcoded hex in broadcast components (only allowed via teamColors map in RecordsPreview and CSS file)
grep -rn '#[0-9a-fA-F]\{6\}' src/components/broadcast/ \
  && echo "FAIL: hardcoded hex inside components" \
  || echo "PASS: components clean"

# 3. design-tokens.js must NOT define hex team colors directly (must re-export from constants)
grep -E "'#[a-f0-9]{6}'" src/lib/design-tokens.js | grep -E "(a78bfa|94a3b8|06b6d4|f59e0b)" \
  && echo "FAIL: team hex codes leaked into design-tokens.js" \
  || echo "PASS: team colors only in constants.js"

# 4. constants.js must export TEAM_COLORS
grep -n "TEAM_COLORS" src/lib/constants.js \
  && echo "PASS: TEAM_COLORS exported from constants.js" \
  || echo "FAIL: TEAM_COLORS missing from constants.js"

# 5. No new --sf-* tokens leaked into index.css
git diff src/index.css \
  && echo "REVIEW: index.css changed — should be no diff" \
  || echo "PASS: index.css untouched"

# 6. Lint + build
npm run lint && npm run build && echo "PASS: lint + build clean"
```

After build clean: open `http://100.115.92.199:5173/records-preview` in the Chromebook browser. Open `/mnt/project/records-v14_2.html` side-by-side. Confirm:

- Background is deep navy (`#070d17`), not light
- Hero shows ghost word "RECORDS" at right edge in faint cobalt
- Hero headline reads `THE RECORDS` with `RECORDS` in cobalt
- Stat hero bar shows three large condensed numbers in white/gold/green
- Five team cards render in oldest-to-youngest order (11U Girls first, 8U Boys last)
- Each team card's left border, badge, and record number use the team's v14 color (lavender / cobalt / slate / cyan / amber respectively)
- Each team record number has a soft glow in team color
- Four tournament cards render with correct status pills
- Game log rows show W/L tiles in green/red against the cobalt-bordered cards

## Commit + deploy

```bash
git add -A \
&& git commit -m "Wave 3a: broadcast component library foundation + records-preview" \
&& git push origin v2 \
&& git checkout main \
&& git merge v2 \
&& git push origin main \
&& git checkout v2

# Anti-drift: update build queue immediately after deploy. CLAUDE.md flags
# stale build queue as the #1 documented session failure mode.
cat >> docs/SKYFIRE_BUILD_QUEUE_v2.md <<EOF

## Wave 3a — SHIPPED $(date -u '+%Y-%m-%d %H:%M UTC')
- Files: 9 created (broadcast/* + RecordsPreview), 3 edited (main.jsx, App.jsx, constants.js)
- Commit: $(git rev-parse --short HEAD)
- Verification: /records-preview matches records-v14_2.html side-by-side
- Council patches applied: 6/6 (constants move, hero ghost word + glow, dangerouslySetInnerHTML pin, role=row drop, SQL pre-check, build queue auto-update)
- Next: Wave 3b — wire useTeamRecords into RecordsPreview, replace fixtures
EOF

git add docs/SKYFIRE_BUILD_QUEUE_v2.md \
&& git commit -m "docs: anti-drift — Wave 3a logged in build queue" \
&& git push origin main
```

## Hard stops (do not violate)

1. Do not add or modify any token in `src/index.css`. Broadcast tokens live exclusively in `src/styles/broadcast.css` under `.bc-root`.
2. Do not edit any file outside the 12 listed above (9 created + 3 edited).
3. Do not refactor `src/lib/supabaseClient.js`, `src/contexts/*`, `src/components/shared/*`, or `src/components/admin/*`.
4. Do not rewrite full files. Use targeted str_replace for all existing-file edits.
5. Do not reformat unrelated code in the edited files.
6. Do not use `bg-black/50`. Modal backdrops elsewhere in the app are `rgba(0,0,0,0.3)` per CLAUDE.md.
7. Do not call `current_user_org_id()` on `org_members` from any RLS policy. The hook reads only `game_results`.
8. Do not define team color hex codes in `design-tokens.js`. Source of truth is `constants.js`.

## Acceptance gate

Wave 3a is complete when:
- All 6 verification checks PASS
- Visual side-by-side matches `records-v14_2.html` for the 5 component types (including hero ghost word and team-record glow)
- Build is deployed to `main` and reachable at `https://skyfire-app.vercel.app/records-preview`
- `SKYFIRE_BUILD_QUEUE_v2.md` has the Wave 3a entry committed

## Pre-Wave-3b verification (run in Supabase SQL Editor before next session)

```sql
-- Confirm the date column name on game_results so useTeamRecords ships clean.
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'game_results'
  AND column_name IN ('played_at', 'game_date', 'played_on', 'start_at', 'is_published')
ORDER BY column_name;
```

If `played_at` is the column → no hook change needed.
If the column is named differently → patch `src/hooks/useTeamRecords.js` lines that reference `played_at` to match before Wave 3b ships.

Build clean.
