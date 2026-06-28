// Gold-standard showcase sections for tournament_prelim:
// weather strip (auto) + pool standings (paste) + rules (paste).
// Covers: resolver weather injection (AP #27), compose section
// emission + ordering, empty-paste / no-location omission (no
// fabrication), home-row highlight, renderer-to-mockup shape, and
// AP #38 renderer-emit parity.

import { describe, expect, it } from 'vitest';
import { composeTournamentPrelim, resolveTournamentPrelim } from '../tournamentPrelim';
import { buildRulesSection, buildStandingsSection } from '../tournamentPrelimGoldSections';
import { fetchTournamentWeather, weatherLocationFrom } from '../tournamentWeather';
import { SECTION_RENDERERS } from '../../sectionRenderers';
import renderPoolStandings from '../../renderers/poolStandings';
import renderWeather from '../../renderers/weather';
import renderRules from '../../renderers/rules';
import { mockClient } from './mockSupabase';
import tournament from './fixtures/tournament_prelim_rumble_for_the_ring/tournament.json';
import tournament_teams from './fixtures/tournament_prelim_rumble_for_the_ring/tournament_teams.json';
import events from './fixtures/tournament_prelim_rumble_for_the_ring/events.json';
import recipients from './fixtures/tournament_prelim_rumble_for_the_ring/recipients.json';
import coaches from './fixtures/tournament_prelim_rumble_for_the_ring/coaches.json';
import organization from './fixtures/tournament_prelim_rumble_for_the_ring/organization.json';

const TID = '196e595d-6b35-4b5e-8253-502b122cb5cb';
const NOW = new Date('2026-05-10T14:00:00Z');

function rpcShape(rows) {
  const m = new Map();
  for (const r of rows) {
    if (!m.has(r.guardian_id)) m.set(r.guardian_id, { guardian_id: r.guardian_id, email: r.email, full_name: '', is_pilot_family: r.is_pilot_family, team_ids: [], team_names: [] });
    m.get(r.guardian_id).team_ids.push(r.team_id);
  }
  return Array.from(m.values());
}

// locations WITH coords so weatherLocationFrom resolves an anchor.
const LOC_ID = events[0].location_id;
const locationsWithCoords = [{ id: LOC_ID, name: 'Monty Tech HS', address: '1050 Westminster St, Waltham, MA', google_maps_url: null, lat: 42.288, lon: -71.416 }];

function fixtures(extra = {}) {
  return {
    tournament, tournament_teams, events, coaches, organization,
    locations: extra.locations || locationsWithCoords,
    recipients: rpcShape(recipients),
    player_guardians: [],
  };
}

// Deterministic injected weather fetcher (no network).
const stubWeather = async () => ([
  { day: 'FRI 6/5', em: '⛅', tp: '91°', rn: '1% rain' },
  { day: 'SAT 6/6', em: '⛈️', tp: '94°', rn: '55% storms' },
]);
const stubNoWeather = async () => [];

describe('tournament_prelim gold — weather (auto, AP #27 injected IO)', () => {
  it('fetchTournamentWeather is injectable and never calls real fetch when stubbed', async () => {
    const { context } = await resolveTournamentPrelim({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(fixtures()), now: NOW, fetchWeather: stubWeather });
    expect(context.weather).toHaveLength(2);
    expect(context.weather_city).toBe('Waltham');
  });

  it('compose emits a weather section from context.weather', async () => {
    const { context, slices } = await resolveTournamentPrelim({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(fixtures()), now: NOW, fetchWeather: stubWeather });
    const { content_sections } = composeTournamentPrelim(context, slices[0], {});
    const wx = content_sections.find((s) => s.kind === 'weather');
    expect(wx).toBeDefined();
    expect(wx.bar_label).toBe('Weather · Waltham');
    expect(wx.days).toHaveLength(2);
  });

  it('omits weather when no location coords (no fabrication)', async () => {
    const noCoords = [{ id: LOC_ID, name: 'Gym', address: null, google_maps_url: null }];
    const { context, slices } = await resolveTournamentPrelim({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(fixtures({ locations: noCoords })), now: NOW, fetchWeather: stubWeather });
    expect(context.weather).toEqual([]);
    const { content_sections } = composeTournamentPrelim(context, slices[0], {});
    expect(content_sections.find((s) => s.kind === 'weather')).toBeUndefined();
  });

  it('omits weather when forecast fetch returns empty', async () => {
    const { context, slices } = await resolveTournamentPrelim({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(fixtures()), now: NOW, fetchWeather: stubNoWeather });
    const { content_sections } = composeTournamentPrelim(context, slices[0], {});
    expect(content_sections.find((s) => s.kind === 'weather')).toBeUndefined();
  });

  it('weatherLocationFrom picks first event-location with coords; city from address', () => {
    const locs = { [LOC_ID]: locationsWithCoords[0] };
    const wx = weatherLocationFrom([{ location_id: LOC_ID }], locs);
    expect(wx).toEqual({ lat: 42.288, lon: -71.416, city: 'Waltham' });
    expect(weatherLocationFrom([{ location_id: 'missing' }], {})).toBeNull();
  });

  it('fetchTournamentWeather returns [] for missing coords and maps daily payload otherwise', async () => {
    expect(await fetchTournamentWeather({ lat: null, lon: null, startDate: '2026-06-06' }, async () => ({}))).toEqual([]);
    const stubFetch = async () => ({ json: async () => ({ daily: { time: ['2026-06-06'], weather_code: [95], temperature_2m_max: [94], precipitation_probability_max: [55] } }) });
    const rows = await fetchTournamentWeather({ lat: 1, lon: 2, startDate: '2026-06-06', endDate: '2026-06-06' }, stubFetch);
    expect(rows).toHaveLength(1);
    expect(rows[0].tp).toBe('94°');
    expect(rows[0].rn).toBe('55% storms');
    expect(rows[0].em).toBe('⛈️');
  });
});

describe('tournament_prelim gold — standings (paste-fed)', () => {
  it('emits one row per non-empty pasted line; highlights home row', async () => {
    const { context, slices } = await resolveTournamentPrelim({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(fixtures()), now: NOW, fetchWeather: stubNoWeather });
    const overrides = { standings_paste: 'ASA (MA)\n\nAster AAU (NY)\nTeam Spartans Academy (MA)\n' };
    const { content_sections } = composeTournamentPrelim(context, slices[0], overrides);
    const st = content_sections.find((s) => s.kind === 'pool_standings');
    expect(st).toBeDefined();
    expect(st.rows).toHaveLength(3); // blank line dropped
    const home = st.rows.filter((r) => r.is_home);
    expect(home).toHaveLength(1);
    expect(home[0].text).toBe('Aster AAU (NY)');
  });

  it('builder omits when paste empty / whitespace', () => {
    expect(buildStandingsSection({ standings_paste: '' }, 'X', ['Aster AAU'])).toBeNull();
    expect(buildStandingsSection({ standings_paste: '   \n  ' }, 'X', ['Aster AAU'])).toBeNull();
    expect(buildStandingsSection({}, 'X', [])).toBeNull();
  });
});

// AP #43 cross-surface invariant: buildStandingsSection is shared by
// BOTH tournament_prelim (buildGoldSections) AND tournament_recap
// (tournamentRecapHelpers), so the acronym/initials match must hold
// for any caller. These exercise the builder directly (the one source).
describe('tournament_prelim gold — standings home-row acronym match', () => {
  it('highlights an abbreviated row ("AA (NY)") for "Aster AAU LLC"', () => {
    const sec = buildStandingsSection(
      { standings_paste: 'ASA (MA)\nAA (NY)\nTeam Spartans Academy (MA)' },
      'X', ['Aster AAU LLC'],
    );
    const home = sec.rows.filter((r) => r.is_home);
    expect(home).toHaveLength(1);
    expect(home[0].text).toBe('AA (NY)');
  });

  it('still highlights the full-name row (existing substring match preserved)', () => {
    const sec = buildStandingsSection(
      { standings_paste: 'ASA (MA)\nAster AAU (NY)\nSpartans (MA)' },
      'X', ['Aster AAU LLC'],
    );
    const home = sec.rows.filter((r) => r.is_home);
    expect(home).toHaveLength(1);
    expect(home[0].text).toBe('Aster AAU (NY)');
  });

  it('does NOT highlight a non-matching row, and does not match initials inside a word', () => {
    // "FLASH" contains the letters l-h but the \bLH\b token guard must
    // not fire; no row should highlight.
    const sec = buildStandingsSection(
      { standings_paste: 'ASA (MA)\nFLASH Elite (NJ)\nAlhambra Hoops (CA)' },
      'X', ['Aster AAU LLC'],
    );
    expect(sec.rows.filter((r) => r.is_home)).toHaveLength(0);
  });

  it('matches the team_name acronym too (second home-name signal)', () => {
    // homeNames is [org.name, slice.team_name] at the callsites; a row
    // abbreviating the team name highlights.
    const sec = buildStandingsSection(
      { standings_paste: 'ASA (MA)\nWB (NY)' },
      'X', ['Some Org', 'Westchester Ballers'],
    );
    const home = sec.rows.filter((r) => r.is_home);
    expect(home).toHaveLength(1);
    expect(home[0].text).toBe('WB (NY)');
  });

  it('single-word home name yields no acronym (no 1-letter false positives)', () => {
    // "Spartans" -> no 2+ word acronym; a stray "S ..." row must not
    // highlight off a single initial.
    const sec = buildStandingsSection(
      { standings_paste: 'S Team (MA)\nOther (NY)' },
      'X', ['Spartans'],
    );
    expect(sec.rows.filter((r) => r.is_home)).toHaveLength(0);
  });
});

describe('tournament_prelim gold — rules (paste-fed)', () => {
  it('splits lines; bolds the "Label:" lead; plain line has no lead', () => {
    const sec = buildRulesSection({ rules_paste: 'Format: two halves.\nArrive 20 minutes early.' }, 'Zero Gravity Rules');
    expect(sec.bar_label).toBe('Zero Gravity Rules');
    expect(sec.rules).toHaveLength(2);
    expect(sec.rules[0]).toEqual({ lead: 'Format:', text: 'two halves.' });
    expect(sec.rules[1]).toEqual({ lead: null, text: 'Arrive 20 minutes early.' });
  });

  it('omits when paste empty', () => {
    expect(buildRulesSection({ rules_paste: '' }, 'Rules')).toBeNull();
    expect(buildRulesSection({}, 'Rules')).toBeNull();
  });
});

describe('tournament_prelim gold — section ordering', () => {
  it('renders standings -> weather -> rules after bracket, before footer', async () => {
    const { context, slices } = await resolveTournamentPrelim({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(fixtures()), now: NOW, fetchWeather: stubWeather });
    const overrides = { standings_paste: 'Aster AAU (NY)', rules_paste: 'Format: two halves.' };
    const { content_sections } = composeTournamentPrelim(context, slices[0], overrides);
    const kinds = content_sections.map((s) => s.kind);
    const si = kinds.indexOf('pool_standings');
    const wi = kinds.indexOf('weather');
    const ri = kinds.indexOf('rules');
    const bf = kinds.indexOf('brand_footer');
    expect(si).toBeGreaterThan(-1);
    expect(wi).toBeGreaterThan(si);
    expect(ri).toBeGreaterThan(wi);
    expect(bf).toBe(kinds.length - 1);
    expect(ri).toBeLessThan(bf);
  });
});

describe('tournament_prelim gold — renderer shape (to mockup)', () => {
  it('standings renderer: .ebar.gold bar + row per line; home row highlighted', () => {
    const { html, plainText } = renderPoolStandings({ bar_label: 'Division 3 Orange', rows: [{ text: 'ASA (MA)', is_home: false }, { text: 'Aster AAU (NY)', is_home: true }] });
    expect(html).toContain('Division 3 Orange'); // bar label present
    expect(html).toContain('Aster AAU (NY)');
    expect(html).toContain('#eef4fb'); // home-row cobalt wash
    expect(html).toContain('font-weight:800'); // home row bold
    expect(plainText).toContain('→ Aster AAU (NY)');
  });

  it('weather renderer: per-day cell with day/emoji/temp/rain', () => {
    const { html } = renderWeather({ bar_label: 'Weather · Waltham, MA', days: [{ day: 'SAT 6/6', em: '⛈️', tp: '94°', rn: '55% storms' }] });
    expect(html).toContain('Weather · Waltham, MA');
    expect(html).toContain('SAT 6/6');
    expect(html).toContain('⛈️');
    expect(html).toContain('94°');
    expect(html).toContain('55% storms');
  });

  it('rules renderer: bold cobalt lead label + dot bullet', () => {
    const { html } = renderRules({ bar_label: 'Rules', rules: [{ lead: 'Format:', text: 'two halves.' }, { lead: null, text: 'Bring water.' }] });
    expect(html).toContain('<b style="color:#8f6708');
    expect(html).toContain('Format:');
    expect(html).toContain('two halves.');
    expect(html).toContain('Bring water.');
  });

  it('empty section -> empty html (renderers fail-soft)', () => {
    expect(renderPoolStandings({ rows: [] }).html).toBe('');
    expect(renderWeather({ days: [] }).html).toBe('');
    expect(renderRules({ rules: [] }).html).toBe('');
  });
});

describe('tournament_prelim gold — AP #38 renderer-emit parity', () => {
  it('all three new section kinds are registered in SECTION_RENDERERS', () => {
    expect(typeof SECTION_RENDERERS.pool_standings).toBe('function');
    expect(typeof SECTION_RENDERERS.weather).toBe('function');
    expect(typeof SECTION_RENDERERS.rules).toBe('function');
  });
});
