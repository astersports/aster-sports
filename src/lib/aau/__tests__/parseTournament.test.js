// Parser coverage for the AAU TourneyMachine ingest (src/lib/aau/parseTournament.js).
// Runs against real captured Tournament.aspx / Division.aspx snippets (trimmed
// fixtures) so the parse contract is locked against actual TM HTML shape, not a
// synthetic mock. The edge function (supabase/functions/aau-ingest-tournament)
// uses the byte-near-identical Deno mirror _parse.ts (AP #30).

/* global process */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  cleanPlaceName,
  computeIngestCompleteness,
  getGameStatus,
  isAdminDivision,
  isPlaceholderTeam,
  normalizeName,
  parseCourt,
  parseDivision,
  parseDivisionGames,
  parseDivisionList,
  parseDivisionTeams,
  parseGameDate,
  parsePlaces,
  parseScore,
  parseTournamentDates,
  parseTournamentName,
} from '../parseTournament.js';

// Verbatim shape of the Tournament.aspx "Complexes" places panel (captured from a
// live Zero Gravity tournament). Two places: one full address, one with a 2-line
// street + "City, ST ZIP" — locks the address parse + the cleanName join key.
const PLACES_HTML = `
<div class="panel panel-default panel-places complexList" data-type="complex">
  <div class="list-group">
    <div class="list-group-item js-list-group-item-place" data-id="hPLACE1">
      <h4>4 - House of Sports</h4>
      <button type="button" class="btn"><i class="fa fa-map-marker"></i></button>
    </div>
    <div class="list-group-item-dropdown hidden">
      <a href="http://maps.google.com/maps?q=1%20Elm%20St" target="_blank">
        <address>
          1 Elm St<br />
          Ardsley, NY 10502
        </address>
      </a>
      <h5>Facilities</h5>
      <ul><li><b>Court 1</b></li><li><b>Court 2</b></li></ul>
    </div>
    <div class="list-group-item js-list-group-item-place" data-id="hPLACE2">
      <h4>3 - Harry S. Truman High School</h4>
      <button type="button" class="btn"><i class="fa fa-map-marker"></i></button>
    </div>
    <div class="list-group-item-dropdown hidden">
      <a href="#"><address>750 Baychester Ave<br />Bronx, NY 10475</address></a>
      <h5>Facilities</h5><ul><li><b>Court 1</b></li></ul>
    </div>
  </div>
</div>`;

describe('parsePlaces (Tournament.aspx Complexes panel)', () => {
  it('parses each venue name + street/city/state/zip + tm place id', () => {
    const places = parsePlaces(PLACES_HTML);
    expect(places.length).toBe(2);
    expect(places[0]).toEqual({
      tmPlaceKey: 'hPLACE1',
      rawName: '4 - House of Sports',
      cleanName: 'house of sports',
      street: '1 Elm St',
      city: 'Ardsley',
      state: 'NY',
      zip: '10502',
    });
    expect(places[1].cleanName).toBe('harry s. truman high school');
    expect(places[1]).toMatchObject({ street: '750 Baychester Ave', city: 'Bronx', state: 'NY', zip: '10475' });
  });

  it('cleanName joins a game-row location (with court) to the place <h4>', () => {
    // game cell carries the ordinal AND the court; the place <h4> carries only the
    // ordinal — both must clean to the same key so the address attaches.
    expect(cleanPlaceName('4 - House of Sports - Court 1')).toBe('house of sports');
    expect(cleanPlaceName('4 - House of Sports')).toBe('house of sports');
    expect(cleanPlaceName('05 Ramapo College - Court 3')).toBe('ramapo college');
    // a number that is part of the real name survives (only the leading ordinal goes)
    expect(cleanPlaceName('05 24 Hour Fitness')).toBe('24 hour fitness');
  });

  it('parseCourt recovers exactly the "- Court X" suffix cleanPlaceName strips', () => {
    // the court is the venue/court split's other half: whatever cleanPlaceName drops
    // as the court suffix, parseCourt keeps. Two courts of one building (the House of
    // Sports case) → same venue, distinct court.
    expect(parseCourt('4 - House of Sports - Court 1')).toBe('Court 1');
    expect(parseCourt('4 - House of Sports - Court 2')).toBe('Court 2');
    expect(parseCourt('05 Ramapo College - Court 3')).toBe('Court 3');
    // alphanumeric court labels are upper-cased ("2a" → "2A")
    expect(parseCourt('House of Sports - court 2a')).toBe('Court 2A');
    // single-court gyms (no suffix) → null, so the card shows the venue with no court
    expect(parseCourt('4 - House of Sports')).toBeNull();
    expect(parseCourt('Harry S. Truman High School')).toBeNull();
    expect(parseCourt('')).toBeNull();
    expect(parseCourt(null)).toBeNull();
    // NOT fooled by "court" embedded mid-name (no trailing court-number segment)
    expect(parseCourt('The Courtside Club')).toBeNull();
  });

  it('returns [] when there is no places panel', () => {
    expect(parsePlaces('<div>no places here</div>')).toEqual([]);
  });
} );

describe('isAdminDivision (admin/internal division signature filter)', () => {
  it('rejects TM admin/internal blocks by shape', () => {
    // the live WPCYO junk division that inflated the standings surface
    expect(isAdminDivision('ADMIN TEAMS')).toBe(true);
    expect(isAdminDivision('Admin')).toBe(true);
    expect(isAdminDivision('Administration')).toBe(true);
    expect(isAdminDivision('Staff')).toBe(true);
    expect(isAdminDivision('Officials')).toBe(true);
    expect(isAdminDivision('Test Teams')).toBe(true);
    expect(isAdminDivision('Placeholder')).toBe(true);
    expect(isAdminDivision('Do Not Use')).toBe(true);
    // blank/absent name is not a real division
    expect(isAdminDivision('')).toBe(true);
    expect(isAdminDivision(null)).toBe(true);
  });

  it('never rejects a real competition division (the safety property)', () => {
    // the 13 REAL WPCYO 2025-26 divisions (the 14th discovered, ADMIN TEAMS, is
    // filtered + asserted true separately) + representative ZG divisions — NONE
    // may match, or the ingest would silently drop real games.
    for (const name of [
      '3rd Grade Boys', '3rd Grade Girls', '4th Grade Boys', '5th Grade Girls',
      '6th Grade Boys', '7th Grade Girls', '8th Grade Boys', '8th - HS Girls',
      'HS Boys', 'GIRLS HIGH SCHOOL', 'Boys - 5th', '10U Black', '11U Girls',
    ]) {
      expect(isAdminDivision(name)).toBe(false);
    }
  });
});

describe('computeIngestCompleteness (condition-3 gate — discovered vs ingested)', () => {
  const divs = [
    { externalDivisionKey: 'hA', name: 'A' },
    { externalDivisionKey: 'hB', name: 'B' },
    { externalDivisionKey: 'hC', name: 'C' },
  ];
  const ok = (key) => ({ division: 'x', externalDivisionKey: key, gamesUpserted: 5 });
  const err = (key, msg) => ({ division: 'x', externalDivisionKey: key, error: msg });

  it('all divisions succeed -> complete, zero missing, ingested = expected', () => {
    const r = computeIngestCompleteness(divs, [ok('hA'), ok('hB'), ok('hC')]);
    expect(r).toEqual({ divisionsExpected: 3, divisionsIngested: 3, missingDivisions: [], complete: true });
  });

  it('a failed division is missing with its error as the reason', () => {
    const r = computeIngestCompleteness(divs, [ok('hA'), err('hB', 'HTTP 500'), ok('hC')]);
    expect(r.complete).toBe(false);
    expect(r.divisionsIngested).toBe(2);
    expect(r.missingDivisions).toEqual([{ name: 'B', key: 'hB', reason: 'HTTP 500' }]);
  });

  it('a NEVER-ATTEMPTED division (no result at all) counts as missing by construction', () => {
    // the loop deadline cut the run before division C -> C has NO result entry.
    // The old (expected - missing) accounting counted it as INGESTED; this must not.
    const r = computeIngestCompleteness(divs, [ok('hA'), ok('hB')]);
    expect(r.complete).toBe(false);
    expect(r.divisionsIngested).toBe(2);
    expect(r.missingDivisions).toEqual([{ name: 'C', key: 'hC', reason: 'not attempted (loop deadline)' }]);
  });

  it('a bracket-only sub-result (no error, no externalDivisionKey) never counts as success or pollutes', () => {
    // the ingest can push { division, bracketError } with no externalDivisionKey; it
    // must not inject `undefined` into the success set nor mark any division ingested.
    const r = computeIngestCompleteness(divs, [ok('hA'), { division: 'B', bracketError: 'shape quirk' }, err('hB', 'boom')]);
    expect(r.divisionsIngested).toBe(1); // only A
    expect(r.missingDivisions.map((m) => m.key).sort()).toEqual(['hB', 'hC']);
  });

  it('invariant: expected === ingested + missing, on every mix', () => {
    for (const results of [
      [],
      [ok('hA')],
      [ok('hA'), err('hB', 'x')],
      [ok('hA'), ok('hB'), ok('hC')],
      [{ division: 'B', bracketError: 'q' }],
    ]) {
      const r = computeIngestCompleteness(divs, results);
      expect(r.divisionsIngested + r.missingDivisions.length).toBe(r.divisionsExpected);
    }
  });
});

const FIX = join(process.cwd(), 'src/lib/aau/__tests__');
const tournamentHtml = readFileSync(join(FIX, 'tournament.fixture.html'), 'utf8');
const divisionHtml = readFileSync(join(FIX, 'division.fixture.html'), 'utf8');

describe('Tournament.aspx parsing', () => {
  it('parses the real tournament name from the h1 (not the generic title)', () => {
    expect(parseTournamentName(tournamentHtml)).toBe('Zero Gravity NY Grand Finale');
  });

  it('falls back through title then to a generic label', () => {
    expect(parseTournamentName('<title>SportsEngine Tourney</title>')).toBe('Tournament');
    expect(parseTournamentName('<title>My Cup</title>')).toBe('My Cup');
    expect(parseTournamentName('')).toBe('Tournament');
  });

  it('parses the date window (min/max M/D/YYYY) as ISO date-only strings', () => {
    expect(parseTournamentDates(tournamentHtml)).toEqual({
      startDate: '2026-06-26',
      endDate: '2026-06-28',
    });
  });

  it('discovers divisions (IDDivision + name) in document order, de-duped', () => {
    const divs = parseDivisionList(tournamentHtml);
    expect(divs.length).toBe(3);
    expect(divs[0]).toEqual({
      externalDivisionKey: 'h2026062416582521129cbe8a63f1049',
      name: 'Boys - 2nd/3rd',
    });
    expect(divs.map((d) => d.name)).toEqual(['Boys - 2nd/3rd', 'Boys - 4th', 'Boys - 5th']);
    // every key is unique
    expect(new Set(divs.map((d) => d.externalDivisionKey)).size).toBe(3);
  });
});

describe('Division.aspx team parsing', () => {
  it('extracts the real (IDTeam-linked) teams with external keys + pool', () => {
    const teams = parseDivisionTeams(divisionHtml);
    expect(teams.map((t) => t.displayName)).toEqual([
      'CT Northstars',
      'High Rise - Will',
      'Pelham Hustle',
      'LI All Stars',
    ]);
    for (const t of teams) {
      expect(t.externalTeamKey).toMatch(/^h[a-f0-9]+$/);
      expect(t.pool).toBe('National Orange');
    }
    // unique external keys
    expect(new Set(teams.map((t) => t.externalTeamKey)).size).toBe(4);
  });
});

describe('Division.aspx game parsing', () => {
  const games = parseDivisionGames(divisionHtml, new Date('2026-06-27T20:00:00Z'));

  it('parses one row per game id, de-duped, with the [PBG]# id', () => {
    const ids = games.map((g) => g.externalGameId);
    expect(ids).toContain('P3');
    expect(ids).toContain('P9');
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[PBG]\d+/);
  });

  it('marks scheduled games (no scores) and a played game as final with scores', () => {
    const scheduled = games.find((g) => g.externalGameId === 'P3');
    expect(scheduled.homeScore).toBeNull();
    expect(scheduled.awayScore).toBeNull();
    expect(scheduled.status).toBe('scheduled');

    const played = games.find((g) => g.externalGameId === 'P9');
    expect(played.homeName).toBe('CT Northstars');
    expect(played.awayName).toBe('Pelham Hustle');
    expect(played.homeScore).toBe(41);
    expect(played.awayScore).toBe(33);
    expect(played.status).toBe('final');
  });

  it('parses start_at into a UTC ISO timestamp (Eastern → UTC, +4h DST)', () => {
    const p3 = games.find((g) => g.externalGameId === 'P3');
    // "Sat 06/27/26 10:45 AM" ET (EDT, +4) → 14:45 UTC
    expect(p3.startAt).toBe('2026-06-27T14:45:00.000Z');
  });

  it('flags bracket-placeholder sides so the caller can skip them', () => {
    const bracket = games.find((g) => /^B\d/.test(g.externalGameId));
    if (bracket) {
      // bracket rows reference seed placeholders, not real teams
      expect(bracket.homePlaceholder || bracket.awayPlaceholder).toBe(true);
    }
    // P-rows between real teams are not placeholders
    const p3 = games.find((g) => g.externalGameId === 'P3');
    expect(p3.homePlaceholder).toBe(false);
    expect(p3.awayPlaceholder).toBe(false);
  });
});

describe('parseDivision (combined)', () => {
  it('returns teams, games, and the distinct pool set', () => {
    const { teams, games, pools } = parseDivision(divisionHtml, new Date('2026-06-27T20:00:00Z'));
    expect(teams.length).toBe(4);
    expect(games.length).toBeGreaterThanOrEqual(5);
    expect(pools).toEqual(['National Orange']);
  });
});

describe('pure helpers', () => {
  it('parseScore: numeric → int, empty/non-numeric → null', () => {
    expect(parseScore('41')).toBe(41);
    expect(parseScore('0')).toBe(0);
    expect(parseScore('')).toBeNull();
    expect(parseScore('  ')).toBeNull();
    expect(parseScore('-')).toBeNull();
    expect(parseScore(null)).toBeNull();
  });

  it('isPlaceholderTeam: seed/bracket labels are placeholders, real names are not', () => {
    expect(isPlaceholderTeam('Bracket Winner B1')).toBe(true);
    expect(isPlaceholderTeam('National Orange 2nd Place')).toBe(true);
    expect(isPlaceholderTeam('Loser of P3')).toBe(true);
    expect(isPlaceholderTeam('Pool A Seed 1')).toBe(true);
    expect(isPlaceholderTeam('TBD')).toBe(true);
    expect(isPlaceholderTeam('')).toBe(true);
    expect(isPlaceholderTeam('CT Northstars')).toBe(false);
    expect(isPlaceholderTeam('High Rise - Will')).toBe(false);
  });

  it('parseGameDate: ET datetime → UTC; date-only / junk → null', () => {
    // EDT (+4): 10:45 AM ET → 14:45 UTC
    expect(parseGameDate('Sat 06/27/26 10:45 AM').toISOString()).toBe('2026-06-27T14:45:00.000Z');
    // EST (+5) in January: 1:00 PM ET → 18:00 UTC
    expect(parseGameDate('1/10/2026 1:00 PM').toISOString()).toBe('2026-01-10T18:00:00.000Z');
    expect(parseGameDate('Sat 06/27/26')).toBeNull();
    expect(parseGameDate('')).toBeNull();
    expect(parseGameDate(null)).toBeNull();
  });

  it('getGameStatus: scores→final, in-window→live, else scheduled', () => {
    const start = new Date('2026-06-27T14:45:00Z');
    expect(getGameStatus(start, true, new Date('2026-06-27T16:00:00Z'))).toBe('final');
    // 20 min after tip, unscored → live
    expect(getGameStatus(start, false, new Date('2026-06-27T15:05:00Z'))).toBe('live');
    // 3h after tip, unscored → scheduled (past window, still no score)
    expect(getGameStatus(start, false, new Date('2026-06-27T18:00:00Z'))).toBe('scheduled');
    // before tip, unscored → scheduled
    expect(getGameStatus(start, false, new Date('2026-06-27T10:00:00Z'))).toBe('scheduled');
    expect(getGameStatus(null, false, new Date())).toBe('scheduled');
  });

  it('normalizeName: case/space-insensitive', () => {
    expect(normalizeName('  CT   Northstars ')).toBe('ct northstars');
    expect(normalizeName(null)).toBe('');
  });

  it('normalizeName: strips a leading bracket-seed prefix so bracket games resolve', () => {
    // TM stamps "[1]"/"[2]" seed prefixes on bracket-game team cells but NOT on
    // the standings rows the team list is built from — the match must ignore it.
    expect(normalizeName('[1] Aster AAU (NY)')).toBe('aster aau (ny)');
    expect(normalizeName('[12] NE Storm Black (MA)')).toBe('ne storm black (ma)');
    // resolves to the same key as the clean standings name
    expect(normalizeName('[3] CT Northstars')).toBe(normalizeName('CT Northstars'));
    // a bare "[..]" that isn't a numeric seed is left intact
    expect(normalizeName('[A] Team')).toBe('[a] team');
  });

  it('normalizeName: strips a trailing advancement asterisk so those games resolve', () => {
    // TM stamps a trailing "*" advancement marker on some game-row team cells but
    // strips it from standings rows — the match must ignore it (Legacy 2-0→3-1 bug,
    // Girls Nationals P7 "Lady Breakers (MA) - Jean*" was dropped without this).
    expect(normalizeName('Lady Breakers (MA) - Jean*')).toBe('lady breakers (ma) - jean');
    expect(normalizeName('Castle Athletics (NY)*')).toBe('castle athletics (ny)');
    // resolves to the same key as the clean standings name
    expect(normalizeName('CT Falcons (CT) - ST*')).toBe(normalizeName('CT Falcons (CT) - ST'));
    // both annotations at once (leading seed + trailing asterisk)
    expect(normalizeName('[2] CT Northstars (CT) - Tracy*')).toBe('ct northstars (ct) - tracy');
  });
});
