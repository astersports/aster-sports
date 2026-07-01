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

/**
 * Normalize a team/division name for case- and space-insensitive matching.
 * Strips two TM-rendered team-cell annotations so a game resolves to its
 * tournament_division_team id instead of being dropped at the !homeId/!awayId
 * guard (the record-accuracy bug: a team that went 3–1 showed 2–0):
 *   - a leading bracket-seed prefix ("[1] Aster AAU (NY)")
 *   - a trailing advancement asterisk ("Lady Breakers (MA) - Jean*")
 * parseDivisionTeams strips the trailing "*" from standings names at parse time,
 * but game-row cells keep these annotations — so the matcher strips them too,
 * for consistency with team parsing. Matching-only; display names are untouched.
 */
export function normalizeName(name) {
  return (name || '').trim().replace(/^\[\d+\]\s*/, '').replace(/\s*\*+\s*$/, '').replace(/\s+/g, ' ').toLowerCase();
}

/** Read one HTML attribute value out of a raw tag-attribute string. Returns ''
 * when absent. Standard ES only (AP #30) — used to recover the source-native
 * ids (data-gameid / data-teamid / data-facilityid) the cell text drops. */
export function getAttr(tagAttrs, name) {
  const re = new RegExp(name + "\\s*=\\s*['\"]([^'\"]*)['\"]", 'i');
  const m = (tagAttrs || '').match(re);
  return m ? m[1] : '';
}

/**
 * Clean a venue label to a stable match key: strip Zero Gravity's leading
 * location ordinal ("4 - " / "05 "), the trailing "- Court X" facility suffix,
 * and lowercase. Mirrors geocode-venues' cleanVenueName so a game-row location
 * cell ("4 - House of Sports - Court 1") and the places-panel <h4> ("4 - House
 * of Sports") resolve to the same key ("house of sports").
 */
export function cleanPlaceName(name) {
  const s = (name || '').trim();
  const noOrdinal = /^\s*\d{1,2}\s*-\s+/.test(s)
    ? s.replace(/^\s*\d{1,2}\s*-\s+/, '')
    : s.replace(/^\s*\d{1,2}\s+/, '');
  return noOrdinal
    .replace(/\s*-\s*court\s*[0-9A-Za-z]+\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Extract the court label from a game-location cell. The cell is
 * "4 - House of Sports - Court 1" (ordinal + building + optional court suffix);
 * cleanPlaceName strips the ordinal + "- Court X" to key the building, so the
 * court is exactly that trailing suffix. Returns a normalized "Court 1" /
 * "Court 2A", or null when there is no court segment (single-court gyms).
 * Additive only — does NOT affect venue resolution (venue stays the deduped
 * building); it recovers the within-building court the building-dedup drops.
 */
export function parseCourt(location) {
  const m = (location || '').match(/-\s*court\s*([0-9A-Za-z]+)\s*$/i);
  return m ? `Court ${m[1].toUpperCase()}` : null;
}

/**
 * Parse the "Complexes" places panel on Tournament.aspx into venue addresses.
 * Each place renders as a `.js-list-group-item-place` (data-id + <h4> name)
 * followed by a dropdown carrying an <address> (street <br> "City, ST ZIP").
 * Returns one entry per place: { tmPlaceKey, rawName, cleanName, street, city,
 * state, zip }. cleanName is the join key to a venue's game-location string.
 * Pure; standard ES only (AP #30).
 */
export function parsePlaces(html) {
  const out = [];
  const parts = (html || '').split('js-list-group-item-place');
  for (let i = 1; i < parts.length; i++) {
    const chunk = parts[i];
    const nameM = chunk.match(/<h4>([\s\S]*?)<\/h4>/);
    if (!nameM) continue;
    const idM = chunk.match(/data-id="([^"]+)"/);
    const addrM = chunk.match(/<address>([\s\S]*?)<\/address>/i);
    const rawName = stripHtml(nameM[1]);
    let street = null, city = null, state = null, zip = null;
    if (addrM) {
      const lines = addrM[1].split(/<br\s*\/?>/i).map(stripHtml).filter(Boolean);
      if (lines.length) {
        street = lines[0] || null;
        const last = lines[lines.length - 1];
        const m = last.match(/^(.*?),\s*([A-Za-z]{2})\.?\s*(\d{5})(?:-\d{4})?$/);
        if (m) { city = m[1].trim(); state = m[2].toUpperCase(); zip = m[3]; }
        else if (lines.length > 1) { city = last; }
      }
    }
    out.push({ tmPlaceKey: idM ? idM[1] : null, rawName, cleanName: cleanPlaceName(rawName), street, city, state, zip });
  }
  return out;
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

/**
 * Is this discovered division an admin/internal block rather than a real
 * competition division? TourneyMachine tournaments carry scheduling/admin
 * divisions ("ADMIN TEAMS") that must not be ingested — they inflate the
 * division/standings surface with non-competition rows. Match by SIGNATURE
 * (shape), not a single string, so the next junk-division variant is caught;
 * the ingest LOGS every rejection so a false positive or a new variant surfaces
 * instead of silently entering. Empty/blank name → not a real division.
 * Kept deliberately narrow so real divisions ("HS Boys", "8th Grade Boys",
 * "8th - HS Girls", "GIRLS HIGH SCHOOL") never match.
 */
export function isAdminDivision(name) {
  const n = (name || '').trim().toLowerCase();
  if (!n) return true;
  return /(^|\b)(admin|administrator|administration|staff|officials?|referees?|scorekeepers?|placeholder|do\s*not\s*use|internal|test\s*teams?)(\b|$)/.test(n);
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
 *            startAt (ISO|null), status, location, homePlaceholder, awayPlaceholder,
 *            sourceGameId, homeTeamRef, awayTeamRef, facilityId }].
 * The four source-native ids (§2.B) are recovered from the <tr>/<td> attributes
 * (data-gameid / data-teamid / data-facilityid); '' when the attribute is absent.
 */
export function parseDivisionGames(html, now = new Date()) {
  const games = [];
  const seen = new Set();
  // Capture <tr> + each <td> OPEN-TAG attributes alongside the cell text (§2.B).
  // Cell text stays byte-identical; the attrs recover the source-native ids.
  const trRe = /<tr([^>]*)>([\s\S]*?)<\/tr>/gi;
  let tr;
  while ((tr = trRe.exec(html)) !== null) {
    const cells = [];
    const cellAttrs = [];
    const tdRe = /<td([^>]*)>([\s\S]*?)<\/td>/gi;
    let td;
    while ((td = tdRe.exec(tr[2])) !== null) { cellAttrs.push(td[1]); cells.push(stripHtml(td[2])); }
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
      sourceGameId: getAttr(tr[1], 'data-gameid'),
      homeTeamRef: getAttr(cellAttrs[3] || '', 'data-teamid'),
      awayTeamRef: getAttr(cellAttrs[6] || '', 'data-teamid'),
      facilityId: getAttr(cellAttrs[2] || '', 'data-facilityid'),
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
