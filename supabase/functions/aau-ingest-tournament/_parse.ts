// AAU tournament ingest — pure TourneyMachine HTML parsing (Deno mirror).
// VITEST source of truth: src/lib/aau/parseTournament.js (CLAUDE.md AP #30 —
// keep byte-near-identical apart from TS annotations; change both in the same
// commit). Standard ES + Intl only so the two stay in sync and run under both
// vitest (Node) and the edge runtime.
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

export interface DivisionListEntry { externalDivisionKey: string; name: string; }
export interface DivisionTeam { externalTeamKey: string; displayName: string; pool: string | null; }
export interface DivisionGame {
  externalGameId: string;
  homeName: string;
  awayName: string;
  homeScore: number | null;
  awayScore: number | null;
  startAt: string | null;
  status: 'scheduled' | 'live' | 'final';
  location: string;
  homePlaceholder: boolean;
  awayPlaceholder: boolean;
  // §2.B source-native refs (additive capture). TM stamps every game row with a
  // durable `data-gameid` (h<created-ts><hex>) and every team/venue cell with a
  // stable id; the parser used to discard them. `sourceGameId` is the durable
  // game ref (the §2.D Layer-1 identity, source-neutral — see the ingest writer);
  // homeTeamRef/awayTeamRef are TM team ids (empty for an unresolved seed); and
  // facilityId is the TM venue id. All empty-string when the attribute is absent.
  sourceGameId: string;
  homeTeamRef: string;
  awayTeamRef: string;
  facilityId: string;
}

// ─── HTML helpers ───────────────────────────────────────────────────────────

/** Strip tags + decode the entity set TourneyMachine actually emits. */
export function stripHtml(html: string): string {
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

/** Read one HTML attribute value out of a raw tag-attribute string. Returns ''
 * when absent. Standard ES only (AP #30) — used to recover the source-native
 * ids (data-gameid / data-teamid / data-facilityid) the cell text drops. */
export function getAttr(tagAttrs: string, name: string): string {
  const re = new RegExp(name + "\\s*=\\s*['\"]([^'\"]*)['\"]", 'i');
  const m = (tagAttrs || '').match(re);
  return m ? m[1] : '';
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
export function normalizeName(name?: string | null): string {
  return (name || '').trim().replace(/^\[\d+\]\s*/, '').replace(/\s*\*+\s*$/, '').replace(/\s+/g, ' ').toLowerCase();
}

export interface PlaceEntry {
  tmPlaceKey: string | null;
  rawName: string;
  cleanName: string;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

/**
 * Clean a venue label to a stable match key: strip Zero Gravity's leading
 * location ordinal ("4 - " / "05 "), the trailing "- Court X" facility suffix,
 * and lowercase. Mirrors geocode-venues' cleanVenueName so a game-row location
 * cell ("4 - House of Sports - Court 1") and the places-panel <h4> ("4 - House
 * of Sports") resolve to the same key ("house of sports").
 */
export function cleanPlaceName(name?: string | null): string {
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
export function parseCourt(location: string): string | null {
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
export function parsePlaces(html: string): PlaceEntry[] {
  const out: PlaceEntry[] = [];
  const parts = (html || '').split('js-list-group-item-place');
  for (let i = 1; i < parts.length; i++) {
    const chunk = parts[i];
    const nameM = chunk.match(/<h4>([\s\S]*?)<\/h4>/);
    if (!nameM) continue;
    const idM = chunk.match(/data-id="([^"]+)"/);
    const addrM = chunk.match(/<address>([\s\S]*?)<\/address>/i);
    const rawName = stripHtml(nameM[1]);
    let street: string | null = null, city: string | null = null, state: string | null = null, zip: string | null = null;
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
export function isPlaceholderTeam(name?: string | null): boolean {
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
export function parseTournamentName(html: string): string {
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
export function parseTournamentDates(html: string): { startDate: string | null; endDate: string | null } {
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
export function parseDivisionList(html: string): DivisionListEntry[] {
  const out: DivisionListEntry[] = [];
  const seen = new Set<string>();
  const re = /<a[^>]*class="[^"]*tournamentDivision[^"]*"[^>]*href="[^"]*IDDivision=(h[a-f0-9]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
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
export function isAdminDivision(name: string): boolean {
  const n = (name || '').trim().toLowerCase();
  if (!n) return true;
  return /(^|\b)(admin|administrator|administration|staff|officials?|referees?|scorekeepers?|placeholder|do\s*not\s*use|internal|test\s*teams?)(\b|$)/.test(n);
}

export interface IngestCompleteness {
  divisionsExpected: number;
  divisionsIngested: number;
  missingDivisions: Array<{ name: string; key: string; reason: string }>;
  complete: boolean;
}

/**
 * Condition-3 completeness gate (PURE — the load-bearing accounting the ingest returns).
 * Given the divisions we intended to ingest (`divisionList`, post-admin-filter) and the
 * per-division `results` the ingest loop pushed, compute honest completeness by
 * DISCOVERED-vs-INGESTED — never `count == expected`: a churned slot label mints a new
 * row, so a count check can pass while a division is missing (see stableGameKey.js).
 *
 * A division counts as INGESTED only if it produced a SUCCESS result (has
 * `externalDivisionKey`, no `error`). Every expected division NOT in that success set is
 * MISSING — including a NEVER-ATTEMPTED one (the loop deadline cut the run before reaching
 * it): it has no result at all, so it counts as missing BY CONSTRUCTION rather than being
 * silently counted as ingested. A bracket-only sub-result (has neither `error` nor
 * `externalDivisionKey`) never counts as a success and never pollutes the set.
 * `divisionsExpected === divisionsIngested + missingDivisions.length` always holds.
 */
export function computeIngestCompleteness(
  divisionList: Array<{ externalDivisionKey: string; name: string }>,
  results: Array<Record<string, unknown>>,
): IngestCompleteness {
  const rows = Array.isArray(results) ? results : [];
  const succeededKeys = new Set(
    rows.filter((r) => r && !('error' in r) && r.externalDivisionKey).map((r) => r.externalDivisionKey as string),
  );
  const errorByKey = new Map<string, string>(
    rows.filter((r) => r && 'error' in r && r.externalDivisionKey).map((r) => [r.externalDivisionKey as string, r.error as string]),
  );
  const expected = Array.isArray(divisionList) ? divisionList : [];
  const missingDivisions = expected
    .filter((d) => !succeededKeys.has(d.externalDivisionKey))
    .map((d) => ({
      name: d.name,
      key: d.externalDivisionKey,
      reason: errorByKey.get(d.externalDivisionKey) ?? 'not attempted (loop deadline)',
    }));
  const divisionsIngested = expected.filter((d) => succeededKeys.has(d.externalDivisionKey)).length;
  return {
    divisionsExpected: expected.length,
    divisionsIngested,
    missingDivisions,
    complete: missingDivisions.length === 0,
  };
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
export function parseDivisionTeams(html: string): DivisionTeam[] {
  const out: DivisionTeam[] = [];
  const seen = new Set<string>();
  // Walk the document, tracking the most recent pool heading. TM renders each
  // pool's standings table with a <th class="tournamentResultsTitle"> carrying
  // the pool name, then the team rows for that pool.
  const poolHeadingRe = /<th[^>]*class="[^"]*tournamentResultsTitle[^"]*"[^>]*>([\s\S]*?)<\/th>/gi;
  // Build an index of [position, poolName] to assign each team its pool.
  const poolMarks: Array<{ pos: number; name: string }> = [];
  let pm: RegExpExecArray | null;
  while ((pm = poolHeadingRe.exec(html)) !== null) {
    const name = stripHtml(pm[1]);
    if (name) poolMarks.push({ pos: pm.index, name });
  }
  const teamRe = /Team\.aspx\?[^"']*IDTeam=(h[a-f0-9]+)['"][^>]*>([^<]+)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = teamRe.exec(html)) !== null) {
    const key = m[1];
    if (seen.has(key)) continue;
    // Strip the trailing "*" advancement annotation TM adds in standings rows
    // (the clean form is what game rows use) so team↔game name matching lines up.
    const displayName = stripHtml(m[2]).replace(/\s*\*+\s*$/, '');
    if (!displayName) continue;
    // Nearest pool heading at or before this team's position.
    let pool: string | null = null;
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
 */
export function parseDivisionGames(html: string, now: Date = new Date()): DivisionGame[] {
  const games: DivisionGame[] = [];
  const seen = new Set<string>();
  // Capture the <tr> + each <td> OPEN-TAG attributes alongside the cell text, so
  // the source-native ids (data-gameid on the row, data-teamid on the team cells,
  // data-facilityid on the location cell) survive — the old regex kept only inner
  // text and dropped them (§2.B). Cell text is byte-identical to before.
  const trRe = /<tr([^>]*)>([\s\S]*?)<\/tr>/gi;
  let tr: RegExpExecArray | null;
  while ((tr = trRe.exec(html)) !== null) {
    const cells: string[] = [];
    const cellAttrs: string[] = [];
    const tdRe = /<td([^>]*)>([\s\S]*?)<\/td>/gi;
    let td: RegExpExecArray | null;
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
export function parseScore(s?: string | null): number | null {
  const t = (s || '').trim();
  return /^\d+$/.test(t) ? parseInt(t, 10) : null;
}

// ─── Date + status (Eastern time, mirrored from the reference scraper) ────────

/**
 * Parse a TM Eastern-time datetime string ("Sat 06/27/26 10:45 AM" or
 * "6/27/2026 10:45 AM") into a UTC Date. Returns null when no time is present
 * (date-only cells, e.g. completed-day rows that drop the clock).
 */
export function parseGameDate(dateStr?: string | null): Date | null {
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
export function isEasternDST(year: number, month: number, day: number, localHour: number): boolean {
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
export function getGameStatus(startAtDate: Date | null, hasScores: boolean, now: Date = new Date()): 'scheduled' | 'live' | 'final' {
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
export function parseDivision(html: string, now: Date = new Date()): { teams: DivisionTeam[]; games: DivisionGame[]; pools: string[] } {
  const teams = parseDivisionTeams(html);
  const games = parseDivisionGames(html, now);
  const pools = [...new Set(teams.map((t) => t.pool).filter(Boolean))] as string[];
  return { teams, games, pools };
}
