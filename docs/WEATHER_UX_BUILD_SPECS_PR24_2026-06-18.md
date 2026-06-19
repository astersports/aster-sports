# Weather UX — Build Specs for PR-2 / PR-3 / PR-4

**Author:** Manus (independent verification agent)
**Date:** 2026-06-18
**Audience:** Claude Code (builder); ratified-by Claude.ai (architect) + Frank
**Repo:** `astersports/aster-sports` · base branch `main`
**Builds on:** PR-1 foundation (PR #1074) — `WeatherContext`, `wmo.js`, `coordsForEvent`
**Pairs with:** `docs/ARCHITECT_SPEC_REQUEST_WEATHER_2026-06-18.txt`, `docs/ARCHITECT_RENDER_WEATHER_2026-06-18.txt`, `docs/CC_VERIFICATION_WEATHER_RENDER_2026-06-18.txt`
**Status:** Spec / handoff. Committed to the repo by CC 2026-06-19 for cross-lane visibility.

> NOTE (CC, 2026-06-19): the `[CONFIRM]` items below are already ratified by the
> architect render (R-1…R-7). R-4's tokens are the CC VF-1-corrected ones
> (`--as-info` / `--as-info-soft` via `SEVERITY_TOKENS.info`), which this spec
> already reflects. PR-4 shipped (#1075); PR-2 (this PR) implements R-1/R-2/R-3.

---

## 0. North star (locked by Frank's ruling)

> "Foundation, and love the weather as a cool parent ask."

These are **delight features, not operations.** The popover is a pleasant micro-interaction; the rain banner is a **friendly heads-up** ("plan the drive"), never an alarm. Mobile-first, large tap targets, legible for busy parents on phones. Honors the locked design system: 44px targets, `var(--as-*)` tokens only, Lucide icons, never fabricate (no forecast → render nothing). Every new file ≤150 LOC.

---

## 1. Grounding facts (verified on the PR-1 branch)

- **Hour shape** (`useWeather.js`): each hour is `{ timeMs, temp (rounded int), code, icon, label }`. `getWeatherForTime(weather, isoTime)` returns the closest hour **within 2h**, else `null`.
- **Daily fetch** is exposed on the context as `fetchDaily(startDate, endDate)`, returning per-day `{ day, em, tp, rn }` rows (e.g. `{ day:'SAT 6/21', em:'🌧️', tp:'78°', rn:'55% rain' }`) or `[]` on failure. `rn` already embeds the `rainWord(code)` noun.
- **Inline render today** (`EventCard.jsx`): the matched-hour `{icon} {temp}°` span is the **popover trigger** PR-2 upgrades. The `weather` prop is the already-matched hour object, NOT the raw context.
- **Tokens available** (`src/index.css`): `--as-info` `#3B82F6`, `--as-info-soft` `#EFF6FF`, `--as-warning` `#D97706`, `--as-warning-soft` `#FEF3C7`, plus `--as-text-{primary,secondary,tertiary,meta}`, `--as-border-{default,subtle}`, `--as-bg-card`, `--as-shadow-lg`. **Do not invent tokens.**
- **Reusable patterns:** `src/components/shared/BottomSheet.jsx` is the canonical dismissible surface (`createPortal`, `role="dialog"`, Escape + backdrop-click close, focus trap). Mirror its a11y wiring. Lucide is the icon set.

---

## 2. PR-2 — `WeatherPopover` (the parish "popover" pillar)

### Goal
Turn the read-only inline `{icon} {temp}°` indicator into a tappable trigger that opens a small, glanceable forecast card for that event.

### Render decisions
| Ref | Decision |
|---|---|
| R-1 | **Lightweight inline popover** — read-only disclosure, not a form (AP#15). Reuse BottomSheet's a11y mechanics (portal, Escape, outside-tap, focus return) but render as a small anchored card. |
| R-2 | Matched-hour **temp + condition label**, plus the **day's rain %** (from `fetchDaily`). One glanceable card. NO multi-hour timeline in v1. |
| R-3 | Existing rail indicator becomes a `<button>`: ≥44×44px hit area via invisible padding, `aria-label="Weather for {event title}: {label}, {temp} degrees"`, `aria-haspopup="dialog"`, `aria-expanded`. Dismiss on outside-tap + Escape; focus returns to trigger. |

### Files (all ≤150 LOC)
- `src/components/weather/WeatherPopover.jsx` — trigger button + anchored card. Renders nothing if `hour` is null (no fabrication).
- `src/components/weather/__tests__/WeatherPopover.test.jsx` — open/close, Escape, outside-tap, `aria-label`, "renders null when no hour".

### Wiring
- In `EventCard.jsx`, replace the bare `<span>` with `<WeatherPopover event={event} hour={weather} />`. Keep `EventCard` a pure renderer.
- **CC v1 deviation (noted):** the day's rain % is fetched **on popover OPEN** via `useWeatherContext().fetchDaily(date, date)` — on-interaction, NOT per-row — rather than plumbed through every parent. This honors the "no per-row fetches" concern while keeping the schedule rows untouched. Full prop-plumbing can replace it later if preferred.

### Definition of done
- [ ] Tappable, ≥44px, `aria-label` + dialog semantics; Escape/outside-tap close; focus return.
- [ ] Token-only styling; Lucide/emoji glyph; ≤150 LOC.
- [ ] Tests green; lint/build green; entry bundle ≤350 KB gz.

---

## 3. PR-3 — `RainAlertBanner` (the parish "rain alert" pillar)

### Goal
A friendly, dismissible heads-up shown when the **next in-window event** has a high chance of rain.

### Render decisions
| Ref | Decision |
|---|---|
| R-4a | Background **`--as-info-soft` (`#EFF6FF`)**, accent `--as-info` — reuse `SEVERITY_TOKENS.info`. Calm/informational. (NOT amber/warn, NOT `--as-cobalt`/`color-mix` — those don't ship; CC VF-1.) |
| R-4b | Lucide **`CloudRain`**; copy: **"Looks like rain {Day} — plan the drive."** NEVER "PRECIPITATION ALERT." §16.3 kindness mandate. |
| R-5a | **Home only** in v1 (Parent/Coach/Admin home). |
| R-5b | `precipitation_probability_max >= 50%`, named constant `RAIN_BANNER_THRESHOLD_PCT = 50` in `constants.js`. |
| R-5c | Session-dismissible via `sessionStorage` keyed by event id (`rainbanner:dismissed:{eventId}`). |

### Files (all ≤150 LOC)
- `src/components/weather/RainAlertBanner.jsx` — reads the next in-window event's day forecast via `fetchDaily`; shows when `precipitation_probability_max >= threshold`. Large dismiss `X` (≥44px). Renders nothing when no next event / out of window / no coords / fetch `[]` / under threshold / already dismissed.
- `src/components/weather/__tests__/RainAlertBanner.test.jsx`.

### Wiring
- Mount once at the top of each home surface below the greeting. The "next in-window event" is the same `comingUp` object the homes already compute — pass it in as a prop; do not recompute scheduling inside the banner.
- Recommend a tiny pure helper `parseRainPct(rn)` in `src/lib/weather/` (or expose the raw `precipitation_probability_max`) so the banner compares numerically without inline parsing.

### Definition of done
- [ ] Friendly copy + `CloudRain` icon; `--as-info-soft` background; large dismiss; session-persisted.
- [ ] Named-constant threshold; never fabricates; home-only.
- [ ] Pure component; tests + lint + build green.

---

## 4. PR-4 — `forecastWindow.js` (formalize the "next event within N days" rule) — SHIPPED

> Shipped in PR #1075. `isWithinForecastWindow(isoTime, nowMs, days)` +
> `WEATHER_FORECAST_WINDOW_DAYS = 10`; EventCard inline indicator gated on it.

### Render decision
| Ref | Decision |
|---|---|
| R-6 | `WEATHER_FORECAST_WINDOW_DAYS = 10` in `constants.js` (parish parity). Hourly indicator still returns `null` beyond ~7-day coverage — no fabrication; the window bounds *when we bother asking*. |

---

## 5. Cross-cutting guardrails (apply to all three PRs)

1. **Never fabricate** — render nothing when there's no real forecast.
2. **Pure components, logic in lib/context** — do NOT re-introduce parish-style coupling. Timezone/scheduling/threshold logic lives in `src/lib/weather/` or the context.
3. **Design system** — `var(--as-*)` tokens only, Lucide icons, 44px targets, mobile-first.
4. **Size + tests** — every new file ≤150 LOC; AP#43 invariants where a pattern repeats; AP#46 visual evidence for the `*Card`/`*Banner` visuals. lint/test/build green; entry bundle ≤350 KB gz.
5. **PR order & gating** — recommended **PR-4 → PR-2 → PR-3**. Each PR opened against `main`, CI-gated, architect-ratified before merge.

---

## 6. Open `[CONFIRM]` items — RESOLVED by the architect render

All R-1…R-6 are ratified by `ARCHITECT_RENDER_WEATHER_2026-06-18.txt` (R-4 tokens corrected per `CC_VERIFICATION_WEATHER_RENDER_2026-06-18.txt`). The helper question (`parseRainPct` vs raw value) is CC's implementation choice at PR-3 time.
