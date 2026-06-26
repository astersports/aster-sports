// AAU tournament ingest — pure TourneyMachine HTML parsing. VITEST-COVERED
// SOURCE OF TRUTH. Deno mirror: supabase/functions/aau-ingest-tournament/_parse.ts
// (CLAUDE.md AP #30 — keep the two byte-near-identical apart from TS annotations;
// change both in the same commit). Standard ES + Intl only (no Node/Deno APIs)
// so the two stay in sync and run under both vitest (Node) and the edge runtime.
//
// Parses two TourneyMachine page shapes (both desktop-UA, server-rendered HTML):
//   1. Tournament.aspx  → division list (IDDivision + name) + tournament name/dates
//   2. Division.aspx    → real teams (from the standings table, with IDTeam keys),
//                         pools, and games (P#/B#/G# rows).
//
// Approach reused from the reference parser at
// astersports-web/server/scraper.ts (game-id regex /^[PBG]\d+/, ET tz handling,
// 8-cell game-row shape, score-presence detection), generalized from a hardcoded
// (tournamentId, divisionId) registry to discovery-driven multi-division ingest.

// ─── HTML helpers ───────────────────────────────────────────────────────────

/** Strip tags + decode the entity set TourneyMachine actually emits. */
export function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normalize a team/division name for case- and space-insensitive matching. */
export function normalizeName(name) {
  return (name || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

// Seed/advancement placeholders that appear in bracket rows but are NOT real
// teams (they resolve once pool play finishes). We never persist these as teams
// and never ingest a game whose side is one of them.
const PLACEHOLDER_PATTERNS = [
  /\bpool\b/i,
  /\bseed\b/i,
  /\bwinner\b/i,
  /\bloser\b/i,
  /\bplace\b/i,
  /\bbracket\b/i,
  /\bsemi/i,
  /\bquarter/i,
  /\bfinal/i,
  /^\s*(tbd|bye)\s*$/i,
];

/** A game-row team cell that is a bracket/seed placeholder, not a real team. */
export function isPlaceholderTeam(name) {
  const n = (name || '').trim();
  if (!n) return true;
  return PLACEHOLDER_PATTERNS.some((p) => p.test(n));
}

// ─── Tournament.aspx → tournament meta + division list ───────────────────────

/**
 * Parse the tournament name from Tournament.aspx. TM puts the real event name
 * in an <h1> (the <title> is a generic "SportsEngine Tourney"). Falls back to
 * the title, then to a generic label.
 */
export function parseTournamentName(html) {
  // TM emits a leading empty <h1> then the real name in a later <h1>; take the
  // first NON-empty one.
  for (const m of (html || '').matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)) {
    const text = stripHtml(m[1]);
    if (text) return text;
  }
  const title = (html || '').match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const fromTitle = title ? stripHtml(title[1]) : '';
  if (fromTitle && !/sportsengine\s+tourney/i.test(fromTitle)) return fromTitle;
  return 'Tournament';
}

/**
 * Parse start/end dates (ISO yyyy-mm-dd) from the first two M/D/YYYY tokens on
 * Tournament.aspx (TM renders the event window as the leading date pair).
 * Returns { startDate, endDate } as date-only strings, or nulls if unparseable.
 */
export function parseTournamentDates(html) {
  const dates = [...(html || '').matchAll(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g)].map((m) => {
    const mm = String(m[1]).padStart(2, '0');
    const dd = String(m[2]).padStart(2, '0');
    return `${m[3]}-${mm}-${dd}`;
  });
  const uniq = [...new Set(dates)].sort();
  return { startDate: uniq[0] || null, endDate: uniq[uniq.length - 1] || null };
}

/**
 * Discover divisions from Tournament.aspx. Each division is an anchor with
 * class "tournamentDivision" whose href carries IDDivision and whose first
 * inner <div> holds the division name.
 * Returns [{ externalDivisionKey, name }] in document order, de-duped by key.
 */
export function parseDivisionList(html) {
  const out = [];
  const seen = new Set();
  const re = /<a[^>]*class="[^"]*tournamentDivision[^"]*"[^>]*href="[^"]*IDDivision=(h[a-f0-9]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const key = m[1];
    if (seen.has(key)) continue;
    const innerDiv = m[2].match(/<div[^>]*>([\s\S]*?)<\/div>/i);
    const name = innerDiv ? stripHtml(innerDiv[1]) : stripHtml(m[2]);
    if (!name) continue;
    seen.add(key);
    out.push({ externalDivisionKey: key, name });
  }
  return out;
}

// ─── Division.aspx → teams + games ───────────────────────────────────────────

/**
 * Parse the REAL teams of a division from its standings table. Standings rows
 * carry a Team.aspx link with IDTeam — that link is the only reliable signal
 * for "this is an actual entered team" (game rows also contain bracket-seed
 * placeholders). The pool heading nearest above each team is captured as
 * `pool` (best-effort; null when no heading precedes it).
 * Returns [{ externalTeamKey, displayName, pool }] de-duped by externalTeamKey.
 */
export function parseDivisionTeams(html) {
  const out = [];
  const seen = new Set();
  // Walk the document, tracking the most recent pool heading. TM renders each
  // pool's standings table with a <th class="tournamentResultsTitle"> carrying
  // the pool name, then the team rows for that pool.
  const poolHeadingRe = /<th[^>]*class="[^"]*tournamentResultsTitle[^"]*"[^>]*>([\s\S]*?)<\/th>/gi;
  // Build an index of [position, poolName] to assign each team its pool.
  const poolMarks = [];
  let pm;
  while ((pm = poolHeadingRe.exec(html)) !== null) {
    const name = stripHtml(pm[1]);
    if (name) poolMarks.push({ pos: pm.index, name });
  }
  const teamRe = /Team\.aspx\?[^"']*IDTeam=(h[a-f0-9]+)['"][^>]*>([^<]+)<\/a>/gi;
  let m;
  while ((m = teamRe.exec(html)) !== null) {
    const key = m[1];
    if (seen.has(key)) continue;
    // Strip the trailing "*" advancement annotation TM adds in standings rows
    // (the clean form is what game rows use) so team↔game name matching lines up.
    const displayName = stripHtml(m[2]).replace(/\s*\*+\s*$/, '');
    if (!displayName) continue;
    // Nearest pool heading at or before this team's position.
    let pool = null;
    for (const mark of poolMarks) {
      if (mark.pos <= m.index) pool = mark.name;
      else break;
    }
    seen.add(key);
    out.push({ externalTeamKey: key, displayName, pool });
  }
  return out;
}

/**
 * Parse the games of a division. Game rows have 7+ <td> cells, the first
 * matching /^[PBG]\d+/ (Pool / Bracket / Game id), shaped:
 *   [ gameId, dateTime, location, team1, score1, score2, team2, (status?) ]
 * Scores are present only once a game is played. Bracket-placeholder sides are
 * surfaced via isPlaceholderTeam so the caller can skip non-external games.
 * `now` is injectable for deterministic status tests.
 * Returns [{ externalGameId, homeName, awayName, homeScore, awayScore,
 *            startAt (ISO|null), status, location, homePlaceholder, awayPlaceholder }].
 */
export function parseDivisionGames(html, now = new Date()) {
  const games = [];
  const seen = new Set();
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let tr;
  while ((tr = trRe.exec(html)) !== null) {
    const cells = [];
    const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let td;
    while ((td = tdRe.exec(tr[1])) !== null) cells.push(stripHtml(td[1]));
    if (cells.length < 7) continue;

    const externalGameId = cells[0];
    if (!/^[PBG]\d+/.test(externalGameId)) continue;
    if (seen.has(externalGameId)) continue;
    seen.add(externalGameId);

    const startAtDate = parseGameDate(cells[1]);
    const homeName = cells[3] || '';
    const awayName = cells[6] || '';
    const homeScore = parseScore(cells[4]);
    const awayScore = parseScore(cells[5]);
    const hasScores = homeScore !== null && awayScore !== null;
    const status = getGameStatus(startAtDate, hasScores, now);

    games.push({
      externalGameId,
      homeName,
      awayName,
      homeScore,
      awayScore,
      startAt: startAtDate ? startAtDate.toISOString() : null,
      status,
      location: cells[2] || '',
      homePlaceholder: isPlaceholderTeam(homeName),
      awayPlaceholder: isPlaceholderTeam(awayName),
    });
  }
  return games;
}

/** Parse a TM score cell → integer or null (empty/non-numeric = not played). */
export function parseScore(s) {
  const t = (s || '').trim();
  return /^\d+$/.test(t) ? parseInt(t, 10) : null;
}

// ─── Date + status (Eastern time, mirrored from the reference scraper) ────────

/**
 * Parse a TM Eastern-time datetime string ("Sat 06/27/26 10:45 AM" or
 * "6/27/2026 10:45 AM") into a UTC Date. Returns null when no time is present
 * (date-only cells, e.g. completed-day rows that drop the clock).
 */
export function parseGameDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const cleaned = dateStr.trim().replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+/i, '');
  const match = cleaned.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  const month = parseInt(match[1], 10);
  const day = parseInt(match[2], 10);
  let year = parseInt(match[3], 10);
  let hours = parseInt(match[4], 10);
  const minutes = parseInt(match[5], 10);
  const ampm = match[6].toUpperCase();
  if (year < 100) year += 2000;
  if (ampm === 'PM' && hours !== 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  const offsetHours = isEasternDST(year, month, day, hours) ? 4 : 5;
  return new Date(Date.UTC(year, month - 1, day, hours + offsetHours, minutes, 0));
}

/** US Eastern DST test for an Eastern wall-clock instant (mirrors scraper.ts). */
export function isEasternDST(year, month, day, localHour) {
  if (month < 3 || month > 11) return false;
  if (month > 3 && month < 11) return true;
  if (month === 3) {
    // UTC-anchored weekday of Mar 1 (date-only; getUTCDay is the guard-legal
    // form — calendarMathAudit R12. Same answer as a local-anchored getDay).
    const firstDay = new Date(Date.UTC(year, 2, 1)).getUTCDay();
    const secondSunday = firstDay === 0 ? 8 : 14 - firstDay + 1;
    if (day > secondSunday) return true;
    if (day < secondSunday) return false;
    return localHour >= 2;
  }
  const firstDay = new Date(Date.UTC(year, 10, 1)).getUTCDay();
  const firstSunday = firstDay === 0 ? 1 : 7 - firstDay + 1;
  if (day < firstSunday) return true;
  if (day > firstSunday) return false;
  return localHour < 2;
}

const LIVE_WINDOW_MS = 75 * 60 * 1000; // 75-min game window (reference scraper)

/**
 * Map a parsed game to the division_games status enum ('scheduled'|'live'|
 * 'final'). Scores present → final. Started within the live window, unscored →
 * live. Otherwise scheduled. Unparseable time + scores → final; else scheduled.
 */
export function getGameStatus(startAtDate, hasScores, now = new Date()) {
  if (hasScores) return 'final';
  if (!startAtDate) return 'scheduled';
  const elapsed = now.getTime() - startAtDate.getTime();
  if (elapsed >= 0 && elapsed <= LIVE_WINDOW_MS) return 'live';
  return 'scheduled';
}

/**
 * Full Division.aspx parse: teams + pools + games, with games annotated by
 * whether each side resolves to a real (non-placeholder) team key. Pure; the
 * edge function layers DB resolution + upserts on top.
 */
export function parseDivision(html, now = new Date()) {
  const teams = parseDivisionTeams(html);
  const games = parseDivisionGames(html, now);
  const pools = [...new Set(teams.map((t) => t.pool).filter(Boolean))];
  return { teams, games, pools };
}
