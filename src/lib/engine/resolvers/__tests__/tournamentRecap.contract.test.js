// Wave 4.2-A-4 contract tests for tournamentRecap resolver pair.

import { describe, expect, it } from 'vitest';
import { composeTournamentRecap, resolveTournamentRecap } from '../tournamentRecap';
import { SECTION_RENDERERS } from '../../sectionRenderers';
import { mockClient } from './mockSupabase';
import tournament from './fixtures/tournament_recap_chase_for_the_chain/tournament.json';
import tournament_teams from './fixtures/tournament_recap_chase_for_the_chain/tournament_teams.json';
import events from './fixtures/tournament_recap_chase_for_the_chain/events.json';
import game_results from './fixtures/tournament_recap_chase_for_the_chain/game_results.json';
import locations from './fixtures/tournament_recap_chase_for_the_chain/locations.json';
import players from './fixtures/tournament_recap_chase_for_the_chain/players.json';
import recipients from './fixtures/tournament_recap_chase_for_the_chain/recipients.json';
import coaches from './fixtures/tournament_recap_chase_for_the_chain/coaches.json';
import team_staff from './fixtures/tournament_recap_chase_for_the_chain/team_staff.json';
import organization from './fixtures/tournament_recap_chase_for_the_chain/organization.json';

function recipientsToRpcShape(rows) {
  const m = new Map();
  for (const r of rows) {
    if (!m.has(r.guardian_id)) m.set(r.guardian_id, { guardian_id: r.guardian_id, email: r.email, full_name: '', is_pilot_family: r.is_pilot_family, team_ids: [], team_names: [] });
    m.get(r.guardian_id).team_ids.push(r.team_id);
  }
  return Array.from(m.values());
}

function buildPlayerGuardians(rows) {
  const out = []; const seen = new Set();
  for (const r of rows) for (const fn of r.kid_first_names) {
    const k = `${r.guardian_id}|${fn}`; if (seen.has(k)) continue; seen.add(k);
    out.push({ guardian_id: r.guardian_id, first_name: fn });
  }
  return out;
}

const TID = '61e2cbca-af87-4685-a928-57d3da06cd84';
const NOW = new Date('2026-05-07T12:00:00Z');
const FIXTURES = {
  tournament, tournament_teams, events, game_results, locations, players,
  coaches, team_staff, organization,
  recipients: recipientsToRpcShape(recipients),
  player_guardians: buildPlayerGuardians(recipients),
};
const norm = (v) => JSON.parse(JSON.stringify(v));

describe('tournament_recap resolver — contract', () => {
  it('1. resolver pure: identical inputs -> deeply-equal outputs', async () => {
    const a = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    const b = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    expect(norm(a)).toEqual(norm(b));
  });

  it('2. compose pure: same context+slice+overrides -> same content_sections', async () => {
    const { context, slices } = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    const o = { coach_reflection: 'good weekend' };
    const a = composeTournamentRecap(context, slices[0], o);
    const b = composeTournamentRecap(context, slices[0], o);
    expect(norm(a)).toEqual(norm(b));
  });

  it('3. slice ordering: sort_order ASC then team_id ASC; recipients guardian_id ASC', async () => {
    const reversed = { ...FIXTURES, tournament_teams: [...tournament_teams].reverse() };
    const { slices } = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(reversed), now: NOW });
    expect(slices.map((s) => s.sort_order)).toEqual([1, 2, 5]);
    for (const s of slices) {
      const ids = s.recipient_guardians.map((g) => g.guardian_id);
      expect(ids).toEqual([...ids].sort());
    }
  });

  it('4. pilotOnly filters recipient_guardians within slices, not slices themselves', async () => {
    const { slices } = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: true }, { supabase: mockClient(FIXTURES), now: NOW });
    expect(slices.length).toBe(3);
    const byTeam = Object.fromEntries(slices.map((s) => [s.team_name, s.recipient_guardians.length]));
    expect(byTeam['11U Girls']).toBe(2);
    expect(byTeam['10U Black']).toBe(0);
    expect(byTeam['8U Boys']).toBe(2);
  });

  it('5. empty tournament_teams -> slices = []', async () => {
    const empty = { ...FIXTURES, tournament_teams: [] };
    const { slices } = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(empty), now: NOW });
    expect(slices).toEqual([]);
  });

  it('6. framed run: one recap_game_cell per PUBLISHED pool game; unpublished omitted (no fabrication)', async () => {
    // Variant A: 11U Girls' first game gets published_at=null -> dropped
    const grA = game_results.map((r) => r.event_id === 'bb20c869-af98-4d39-9739-9de0bbb78e4e' ? { ...r, published_at: null } : r);
    const fA = { ...FIXTURES, game_results: grA };
    const { context: cA, slices: sA } = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(fA), now: NOW });
    const { content_sections: csA } = composeTournamentRecap(cA, sA[0], {});
    const cellsA = csA.filter((s) => s.kind === 'recap_game_cell');
    // 11U Girls has 4 pool games; one unpublished -> 3 cells render
    expect(cellsA.length).toBe(3);
    expect(cellsA.every((c) => c.our_score != null && c.result)).toBe(true);
    // No unpublished placeholder leaks into the framed cells
    expect(JSON.stringify(csA)).not.toContain('Result not published');

    // Variant B: each cell carries its own team_color rail + W/L + venue context
    const { context: cB, slices: sB } = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    const { content_sections: csB } = composeTournamentRecap(cB, sB[2], {});
    const cellsB = csB.filter((s) => s.kind === 'recap_game_cell');
    expect(cellsB.length).toBe(4);
    expect(cellsB[0].team_color).toBe(sB[2].team_color);
    expect(cellsB[0].matchup).toContain('8U Boys vs');
    expect(['W', 'L', 'T']).toContain(cellsB[0].result);
    expect(JSON.stringify(csB)).not.toContain('undefined');
  });

  it('7. no fabrication on placement: null final_place omits block; record absent if 0-0', async () => {
    // Variant A: 11U Girls final_place = null
    const ttA = tournament_teams.map((t) => t.team_id === '507d7a4e-553e-4ba7-a61c-38d6cdf2f364' ? { ...t, final_place: null } : t);
    const { context: cA, slices: sA } = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient({ ...FIXTURES, tournament_teams: ttA }), now: NOW });
    const { content_sections: csA } = composeTournamentRecap(cA, sA[0], {});
    expect(csA.find((s) => s.kind === 'placement_block')).toBeUndefined();

    // Variant B: 8U Boys final_place set but wins/losses both 0
    const ttB = tournament_teams.map((t) => t.team_id === 'e6dde2e0-38f7-46c9-ad1a-5ac253a2a570' ? { ...t, final_record_wins: 0, final_record_losses: 0 } : t);
    const { context: cB, slices: sB } = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient({ ...FIXTURES, tournament_teams: ttB }), now: NOW });
    const { content_sections: csB } = composeTournamentRecap(cB, sB[2], {});
    const placement = csB.find((s) => s.kind === 'placement_block');
    expect(placement).toBeDefined();
    expect(placement.final_place).toBe('Finalists');
    expect(placement.record).toBeUndefined();
  });

  it('8. override sections render iff provided, under a "From the Sideline" bar', async () => {
    const { context, slices } = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    const empty = composeTournamentRecap(context, slices[2], {});
    expect(empty.content_sections.find((s) => s.kind === 'standout_moments')).toBeUndefined();
    expect(empty.content_sections.find((s) => s.kind === 'coach_reflection')).toBeUndefined();
    // No narrative -> no "From the Sideline" bar (the run bar is "The Run")
    expect(empty.content_sections.filter((s) => s.kind === 'section_bar').map((s) => s.label)).toEqual(['The Run']);
    const onlyStandout = composeTournamentRecap(context, slices[2], { standout_moments: 'good' });
    expect(onlyStandout.content_sections.find((s) => s.kind === 'standout_moments')).toBeDefined();
    expect(onlyStandout.content_sections.find((s) => s.kind === 'coach_reflection')).toBeUndefined();
    expect(onlyStandout.content_sections.filter((s) => s.kind === 'section_bar').map((s) => s.label)).toEqual(['The Run', 'From the Sideline']);
  });

  it('9. framed shell: frame_open/cobalt_band header/section_bar/recap_game_cell/...footer/frame_close in order', async () => {
    const { context, slices } = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    const { content_sections } = composeTournamentRecap(context, slices[2], {});
    const kinds = content_sections.map((s) => s.kind);
    expect(kinds).toEqual([
      'frame_open', 'header', 'placement_block', 'section_bar',
      'recap_game_cell', 'recap_game_cell', 'recap_game_cell', 'recap_game_cell',
      'footer', 'frame_close',
    ]);
    expect(content_sections[0].kind).toBe('frame_open');
    expect(content_sections[content_sections.length - 1].kind).toBe('frame_close');
    const header = content_sections[1];
    expect(header.variant).toBe('cobalt_band');
    expect(header.record_pill).toBe('2–2 RECORD');
  });

  it('10. bracket path renders from PLAYED bracket games (W/L); pool-only omits it', async () => {
    // Pool-only baseline (fixture has no bracket games): no bracket_callout
    const { context: cPool, slices: sPool } = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    const poolSections = composeTournamentRecap(cPool, sPool[2], {}).content_sections;
    expect(poolSections.find((s) => s.kind === 'bracket_callout')).toBeUndefined();

    // Variant: mark 8U Boys' two Sunday games as Semifinal + Final bracket games
    const brEvents = events.map((e) => {
      if (e.id === '21802388-462a-42b7-b4cb-afe5da30bc71') return { ...e, bracket_label: 'Semifinal' };
      if (e.id === '24b998e9-8fe6-4123-bc95-607f20a70c8d') return { ...e, bracket_label: 'Final', is_championship_final: true };
      return e;
    });
    const { context: cBr, slices: sBr } = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient({ ...FIXTURES, events: brEvents }), now: NOW });
    const brSections = composeTournamentRecap(cBr, sBr[2], {}).content_sections;
    const callout = brSections.find((s) => s.kind === 'bracket_callout');
    expect(callout).toBeDefined();
    expect(callout.text).toBe('BRACKET PATH · TO THE FINAL');
    // The two bracket games moved OUT of "The Run" (2 pool cells) and into
    // the bracket path (2 more cells, labeled by stage).
    const calloutIdx = brSections.indexOf(callout);
    const after = brSections.slice(calloutIdx + 1).filter((s) => s.kind === 'recap_game_cell');
    const stages = after.slice(0, 2).map((c) => c.date_label);
    expect(stages).toEqual(['SEMIFINAL', 'FINAL']);
    expect(after.every((c) => ['W', 'L', 'T'].includes(c.result))).toBe(true);
    // Run now has 2 published pool cells (4 pool games − 2 promoted to bracket)
    const runBarIdx = brSections.findIndex((s) => s.kind === 'section_bar' && s.label === 'The Run');
    const runCells = brSections.slice(runBarIdx + 1, calloutIdx).filter((s) => s.kind === 'recap_game_cell');
    expect(runCells.length).toBe(2);
  });

  it('11. final standings: paste -> pool_standings with home highlight; empty paste omits', async () => {
    const { context, slices } = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    // Empty paste -> no pool_standings
    expect(composeTournamentRecap(context, slices[2], {}).content_sections.find((s) => s.kind === 'pool_standings')).toBeUndefined();
    // Paste -> one row per line, home team (Aster AAU) highlighted
    const paste = 'NY Extreme Black\nAster AAU (NY)\nShowtime Elite';
    const sections = composeTournamentRecap(context, slices[2], { standings_paste: paste }).content_sections;
    const standings = sections.find((s) => s.kind === 'pool_standings');
    expect(standings).toBeDefined();
    expect(standings.bar_label).toBeTruthy();
    expect(standings.rows.length).toBe(3);
    const home = standings.rows.find((r) => r.is_home);
    expect(home.text).toBe('Aster AAU (NY)');
    expect(standings.rows.filter((r) => r.is_home).length).toBe(1);
    // Standings slots after the run/bracket, before the sideline narrative
    const standingsIdx = sections.indexOf(standings);
    const footerIdx = sections.findIndex((s) => s.kind === 'footer');
    expect(standingsIdx).toBeLessThan(footerIdx);
  });

  it('12. AP #38 renderer-emit parity: every emitted section kind is registered', async () => {
    const { context, slices } = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    const overrides = { standout_moments: 'x', coach_reflection: 'y', coach_note: 'z', parent_shoutout: 'q', standings_paste: 'Aster AAU (NY)\nFoo' };
    const brEvents = events.map((e) => (e.id === '24b998e9-8fe6-4123-bc95-607f20a70c8d' ? { ...e, bracket_label: 'Final', is_championship_final: true } : e));
    const { context: cBr, slices: sBr } = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient({ ...FIXTURES, events: brEvents }), now: NOW });
    for (const [ctx, sl] of [[context, slices[2]], [cBr, sBr[2]]]) {
      const { content_sections } = composeTournamentRecap(ctx, sl, overrides);
      const kinds = [...new Set(content_sections.map((s) => s.kind))];
      for (const k of kinds) expect(SECTION_RENDERERS[k], `kind "${k}" must be registered`).toBeTypeOf('function');
    }
  });
});
