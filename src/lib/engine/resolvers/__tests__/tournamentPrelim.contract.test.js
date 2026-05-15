// Wave 4.2-A-3 contract tests for tournamentPrelim resolver pair.

import { describe, expect, it } from 'vitest';
import { composeTournamentPrelim, resolveTournamentPrelim } from '../tournamentPrelim';
import { mockClient } from './mockSupabase';
import tournament from './fixtures/tournament_prelim_rumble_for_the_ring/tournament.json';
import tournament_teams from './fixtures/tournament_prelim_rumble_for_the_ring/tournament_teams.json';
import events from './fixtures/tournament_prelim_rumble_for_the_ring/events.json';
import locations from './fixtures/tournament_prelim_rumble_for_the_ring/locations.json';
import recipients from './fixtures/tournament_prelim_rumble_for_the_ring/recipients.json';
import coaches from './fixtures/tournament_prelim_rumble_for_the_ring/coaches.json';
import organization from './fixtures/tournament_prelim_rumble_for_the_ring/organization.json';

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

const TID = '196e595d-6b35-4b5e-8253-502b122cb5cb';
const NOW = new Date('2026-05-10T14:00:00Z');
const FIXTURES = {
  tournament, tournament_teams, events, locations, coaches, organization,
  recipients: recipientsToRpcShape(recipients),
  player_guardians: buildPlayerGuardians(recipients),
};
const norm = (v) => JSON.parse(JSON.stringify(v));

describe('tournament_prelim resolver — contract', () => {
  it('1. resolver pure: identical inputs -> deeply-equal outputs', async () => {
    const a = await resolveTournamentPrelim({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    const b = await resolveTournamentPrelim({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    expect(norm(a)).toEqual(norm(b));
  });

  it('2. compose pure: same context+slice+overrides -> same content_sections', async () => {
    const { context, slices } = await resolveTournamentPrelim({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    const o = { coach_keys: 'x' };
    const a = composeTournamentPrelim(context, slices[0], o);
    const b = composeTournamentPrelim(context, slices[0], o);
    expect(norm(a)).toEqual(norm(b));
  });

  it('3. slice ordering: sort_order ASC then team_id ASC; recipients guardian_id ASC', async () => {
    const reversed = { ...FIXTURES, tournament_teams: [...tournament_teams].reverse() };
    const { slices } = await resolveTournamentPrelim({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(reversed), now: NOW });
    expect(slices.map((s) => s.sort_order)).toEqual([1, 2, 5]);
    for (const s of slices) {
      const ids = s.recipient_guardians.map((g) => g.guardian_id);
      expect(ids).toEqual([...ids].sort());
    }
  });

  it('4. pilotOnly filters recipient_guardians within slices, not slices themselves', async () => {
    const { slices } = await resolveTournamentPrelim({ tournamentId: TID, pilotOnly: true }, { supabase: mockClient(FIXTURES), now: NOW });
    expect(slices.length).toBe(3);
    const byTeam = Object.fromEntries(slices.map((s) => [s.team_name, s.recipient_guardians.length]));
    expect(byTeam['11U Girls']).toBe(2);
    expect(byTeam['10U Black']).toBe(0);
    expect(byTeam['8U Boys']).toBe(2);
  });

  it('5. empty tournament_teams -> slices = []', async () => {
    const empty = { ...FIXTURES, tournament_teams: [] };
    const { slices } = await resolveTournamentPrelim({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(empty), now: NOW });
    expect(slices).toEqual([]);
  });

  it('6. no fabrication — empty schedule renders Schedule TBD placeholder (no fabricated rows)', async () => {
    // Wave 5 PR 1: empty schedule emits a day_header with "Schedule TBD"
    // label (replaces the old team_schedule_table placeholder structure).
    const noEvents = { ...FIXTURES, events: [] };
    const { context, slices } = await resolveTournamentPrelim({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(noEvents), now: NOW });
    const { content_sections } = composeTournamentPrelim(context, slices[0], {});
    const placeholder = content_sections.find((s) => s.kind === 'day_header' && s.label === 'Schedule TBD');
    expect(placeholder).toBeDefined();
    expect(content_sections.find((s) => s.kind === 'game_card')).toBeUndefined();
  });

  it('7. no fabrication — sparse tournament metadata emits aligned section sequence', async () => {
    // Wave 5 PR 1: tournament_prelim aligned to Frank's hand-composed
    // pattern. Required sections (always): header / rsvp_callout /
    // (placeholder day_header for empty events) / logistics_line /
    // brand_footer. Optional (data-driven): venue_list, day_header+
    // game_card rows, bracket_callout, hotel_block, signoff,
    // tagline_footer.
    const { context, slices } = await resolveTournamentPrelim({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    const { content_sections } = composeTournamentPrelim(context, slices[0], {});
    const kinds = content_sections.map((s) => s.kind);
    // Required-always sections present
    expect(kinds).toContain('header');
    expect(kinds).toContain('rsvp_callout');
    expect(kinds).toContain('logistics_line');
    expect(kinds).toContain('brand_footer');
    // Ordering invariants
    const headerIdx = kinds.indexOf('header');
    const rsvpIdx = kinds.indexOf('rsvp_callout');
    const logisticsIdx = kinds.indexOf('logistics_line');
    const brandIdx = kinds.indexOf('brand_footer');
    expect(headerIdx).toBe(0);
    expect(rsvpIdx).toBeGreaterThan(headerIdx);
    expect(logisticsIdx).toBeGreaterThan(rsvpIdx);
    expect(brandIdx).toBe(kinds.length - 1);
  });

  it('8. override-merge precedence: hotel_block override beats tournament.hotel_url', async () => {
    const withHotelUrl = { ...FIXTURES, tournament: { ...tournament, hotel_url: 'https://example.com/booking' } };
    const { context, slices } = await resolveTournamentPrelim({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(withHotelUrl), now: NOW });
    const { content_sections } = composeTournamentPrelim(context, slices[0], { hotel_block: 'Hampton Inn block, code LEGACY11U.' });
    const hotel = content_sections.find((s) => s.kind === 'hotel_block');
    expect(hotel).toBeDefined();
    expect(hotel.text).toBe('Hampton Inn block, code LEGACY11U.');
    expect(hotel.text).not.toContain('example.com');
  });
});
