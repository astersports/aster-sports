// tournament_prelim "gold standard" — section builders for the three
// showcase sections the audit found missing vs the reference render
// (docs/BRIEFING_FULL_PRESENTATION.html §2): pool standings, weather
// strip, and rules.
//
// Split out of tournamentPrelimSections.js to keep both files under
// the 150-line cap (CLAUDE.md §0 rule 4 / AP #6). Called by compose()
// in tournamentPrelim.js, slotted after the bracket section and
// before signoff/footer — matching the reference order
// schedule → bracket → standings → weather → rules.
//
// All three are pure + side-effect-free (AP #27): they consume already-
// resolved data (paste text from overrides; the per-day weather array
// from context.weather) and return a content_sections entry or null.
// They NEVER fabricate — empty paste / no forecast → null (omitted).

import { trim } from './tournamentPrelimHelpers';

// Words skipped when building an acronym (legal suffixes + trivia that
// shouldn't contribute an initial). "Aster AAU LLC" -> "AA".
const ACRONYM_SKIP = new Set(['llc', 'inc', 'co', 'ltd', 'the', 'of', 'and', '&']);

// Build the acronym/initials from an org/team name's significant words:
// "Aster AAU" -> "AA". Returns null when fewer than 2 significant
// words contribute (a single-word name has no meaningful acronym and a
// 1-letter token is far too false-positive-prone to match on).
function acronymOf(name) {
  const initials = trim(name)
    .toLowerCase()
    .replace(/[.,]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !ACRONYM_SKIP.has(w))
    .map((w) => w[0]);
  return initials.length >= 2 ? initials.join('') : null;
}

// STANDINGS (paste-fed). Each non-empty pasted line becomes one
// standings row. The home team's row is highlighted (.standrow.me in
// the mockup) by matching the org/team name case-insensitively against
// the line text. Parsing is intentionally line-per-row (heuristic v1):
// pasted formats from SortableEngine / TourneyMachine / league sites
// vary wildly, so the robust contract is "one line in = one row out".
//
// Two match signals (either highlights the row):
//   (1) substring — the (suffix-stripped) full name appears in the line
//       ("Aster AAU (NY)" contains "aster aau").
//   (2) acronym — the name's initials appear as a standalone token
//       ("AA (NY)" -> "AA" for "Aster AAU"). Word-boundary anchored
//       (\bAA\b) so "AA" doesn't match inside "BAZAAR" or "AArdvark".
export function buildStandingsSection(overrides, label, homeNames) {
  const raw = trim(overrides?.standings_paste);
  if (!raw) return null;
  // Strip a trailing legal suffix ("LLC"/"Inc"/...) so an org named
  // "Aster AAU LLC" still matches a "Aster AAU (NY)" row.
  const matchers = (homeNames || [])
    .map((n) => trim(n).toLowerCase().replace(/[\s,]+(llc|inc|inc\.|co|co\.|ltd)\.?$/i, '').trim())
    .filter((n) => n.length >= 3);
  // Acronyms built from the significant words of each home name, matched
  // as whole tokens to avoid substring false positives.
  const acronyms = (homeNames || [])
    .map((n) => acronymOf(n))
    .filter(Boolean)
    .map((a) => new RegExp(`\\b${a}\\b`, 'i'));
  const rows = raw.split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((text) => {
      const lc = text.toLowerCase();
      const is_home = matchers.some((m) => lc.includes(m)) || acronyms.some((re) => re.test(text));
      return { text, is_home };
    });
  if (!rows.length) return null;
  return { kind: 'pool_standings', bar_label: trim(label) || 'Standings', rows };
}

// WEATHER (auto). Pure section emitted from the per-day array the
// resolver already fetched via the injected fetcher (context.weather).
// Omitted entirely when there's no location/forecast (no fabrication).
export function buildWeatherSection(weather, city) {
  const days = Array.isArray(weather) ? weather.filter(Boolean) : [];
  if (!days.length) return null;
  const place = trim(city);
  return { kind: 'weather', bar_label: place ? `Weather · ${place}` : 'Weather', days };
}

// RULES (paste-fed). Split the pasted text into rule lines (one per
// non-empty line). When a line matches "Label: text", the label is
// bolded (mockup: "Format:", "Fouls:"); a line with no colon (e.g.
// "Arrive 20 minutes early. Bring water.") renders as plain text with
// no bold lead. Omitted when the paste is empty.
export function buildRulesSection(overrides, label) {
  const raw = trim(overrides?.rules_paste);
  if (!raw) return null;
  const rules = raw.split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^([^:]{1,40}:)\s*(.+)$/);
      return m ? { lead: m[1], text: m[2] } : { lead: null, text: line };
    });
  if (!rules.length) return null;
  return { kind: 'rules', bar_label: trim(label) || 'Rules', rules };
}

// Fan-out for compose(): returns the gold-standard sections in
// reference order (standings -> weather -> rules), omitting any whose
// data is absent. Keeps compose() under the 150-line cap.
export function buildGoldSections(context, slice, overrides) {
  const { tournament, org, weather, weather_city } = context;
  const out = [];
  const standings = buildStandingsSection(overrides, overrides.standings_label || tournament.pool_label, [org.name, slice.team_name]);
  if (standings) out.push(standings);
  const weatherSection = buildWeatherSection(weather, weather_city);
  if (weatherSection) out.push(weatherSection);
  const rulesSection = buildRulesSection(overrides, overrides.rules_label || (tournament.circuit ? `${tournament.circuit} Rules` : null));
  if (rulesSection) out.push(rulesSection);
  return out;
}
