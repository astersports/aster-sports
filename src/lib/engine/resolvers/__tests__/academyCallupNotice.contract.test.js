// Wave 4.2-A-7 contract tests for academyCallupNotice resolver pair.

import { describe, expect, it } from 'vitest';
import {
  composeAcademyCallupNotice, EventAlreadyStartedError, EventHasNoTeamError,
  PlayerNotAcademyError, PlayerNotCalledUpError, resolveAcademyCallupNotice,
} from '../academyCallupNotice';
import { mockClient } from './mockSupabase';
import event from './fixtures/academy_callup_jake_perkiel/event.json';
import player from './fixtures/academy_callup_jake_perkiel/player.json';
import team_players from './fixtures/academy_callup_jake_perkiel/team_players.json';
import player_guardians from './fixtures/academy_callup_jake_perkiel/player_guardians.json';
import location from './fixtures/academy_callup_jake_perkiel/location.json';
import coaches from './fixtures/academy_callup_jake_perkiel/coaches.json';
import organization from './fixtures/academy_callup_jake_perkiel/organization.json';

const EVENT_ID = '0dd75745-a540-44d9-b16a-9cf0ac1ac819';
const PLAYER_ID = '4e361e9b-4cfa-46b7-bae8-48552f9841e0';
const NOW = new Date('2026-05-10T14:00:00Z');
const FIXTURES = { event, player, team_players, player_guardians, location, coaches, organization };
const norm = (v) => JSON.parse(JSON.stringify(v));

describe('academy_callup_notice resolver — contract', () => {
  it('1. resolver pure', async () => {
    const a = await resolveAcademyCallupNotice({ eventId: EVENT_ID, playerId: PLAYER_ID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    const b = await resolveAcademyCallupNotice({ eventId: EVENT_ID, playerId: PLAYER_ID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    expect(norm(a)).toEqual(norm(b));
  });

  it('2. compose pure', async () => {
    const { context, slices } = await resolveAcademyCallupNotice({ eventId: EVENT_ID, playerId: PLAYER_ID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    const o = { coach_note: 'why this player' };
    const a = composeAcademyCallupNotice(context, slices[0], o);
    const b = composeAcademyCallupNotice(context, slices[0], o);
    expect(norm(a)).toEqual(norm(b));
  });

  it('3. slice ordering: guardian_id ASC under permutation', async () => {
    const reversed = { ...FIXTURES, player_guardians: [...player_guardians].reverse() };
    const { slices } = await resolveAcademyCallupNotice({ eventId: EVENT_ID, playerId: PLAYER_ID, pilotOnly: false }, { supabase: mockClient(reversed), now: NOW });
    const ids = slices.map((s) => s.guardian_id);
    expect(ids).toEqual([...ids].sort());
  });

  it('4. cross-team callup: production anchor narrative + is_same_team false', async () => {
    const { context, slices } = await resolveAcademyCallupNotice({ eventId: EVENT_ID, playerId: PLAYER_ID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    const { content_sections } = composeAcademyCallupNotice(context, slices[0], {});
    const card = content_sections.find((s) => s.kind === 'callup_card');
    expect(card.is_same_team).toBe(false);
    expect(card.narrative).toBe('Jake has been called up from 10U Black futures to play with 10U Blue for Tuesday\'s practice.');
  });

  it('5. same-team callup: receiving == home -> is_same_team true + same-team narrative', async () => {
    const sameTeamEvent = { ...event, team_id: '6abb0447-8866-461c-bd78-1c58eebf9551', teams: { id: '6abb0447-8866-461c-bd78-1c58eebf9551', name: '10U Black', team_color: '#4a8fd4', sort_order: 2, org_id: 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' } };
    const { context, slices } = await resolveAcademyCallupNotice({ eventId: EVENT_ID, playerId: PLAYER_ID, pilotOnly: false }, { supabase: mockClient({ ...FIXTURES, event: sameTeamEvent }), now: NOW });
    const { content_sections } = composeAcademyCallupNotice(context, slices[0], {});
    const card = content_sections.find((s) => s.kind === 'callup_card');
    expect(card.is_same_team).toBe(true);
    expect(card.narrative).toContain('from the 10U Black futures roster to the 10U Black active roster');
  });

  it('6. PlayerNotAcademyError: member_type !== futures_academy', async () => {
    const rosterPlayer = { ...player, member_type: 'roster' };
    await expect(resolveAcademyCallupNotice({ eventId: EVENT_ID, playerId: PLAYER_ID, pilotOnly: false }, { supabase: mockClient({ ...FIXTURES, player: rosterPlayer }), now: NOW }))
      .rejects.toBeInstanceOf(PlayerNotAcademyError);
  });

  it('7. PlayerNotCalledUpError: playerId not in event.academy_callup_player_ids', async () => {
    const noCallup = { ...event, academy_callup_player_ids: [] };
    await expect(resolveAcademyCallupNotice({ eventId: EVENT_ID, playerId: PLAYER_ID, pilotOnly: false }, { supabase: mockClient({ ...FIXTURES, event: noCallup }), now: NOW }))
      .rejects.toBeInstanceOf(PlayerNotCalledUpError);
  });

  it('8. EventHasNoTeamError', async () => {
    const noTeam = { ...event, team_id: null, teams: null };
    await expect(resolveAcademyCallupNotice({ eventId: EVENT_ID, playerId: PLAYER_ID, pilotOnly: false }, { supabase: mockClient({ ...FIXTURES, event: noTeam }), now: NOW }))
      .rejects.toBeInstanceOf(EventHasNoTeamError);
  });

  it('9. EventAlreadyStartedError', async () => {
    const after = new Date('2026-05-13T00:00:00Z');
    await expect(resolveAcademyCallupNotice({ eventId: EVENT_ID, playerId: PLAYER_ID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: after }))
      .rejects.toBeInstanceOf(EventAlreadyStartedError);
  });

  it('10. player has no guardians -> slices = [] (not an error)', async () => {
    const { slices } = await resolveAcademyCallupNotice({ eventId: EVENT_ID, playerId: PLAYER_ID, pilotOnly: false }, { supabase: mockClient({ ...FIXTURES, player_guardians: [] }), now: NOW });
    expect(slices).toEqual([]);
  });

  it('11. pilot mode filter: only pilot guardians when pilotOnly=true', async () => {
    const withPilot = player_guardians.map((r) => r.guardian_id === '0896bcd1-4b11-4ccc-a9ce-f03c29eb1d03' ? { ...r, guardians: { ...r.guardians, is_pilot_family: true } } : r);
    // D-5(a) — pilot gate now goes through get_digest_recipients RPC; mock
    // fixtures.recipients must include the pilot guardian for the test to
    // simulate the post-cutover allowlist behavior.
    const recipients = [{ guardian_id: '0896bcd1-4b11-4ccc-a9ce-f03c29eb1d03', email: 'test@example.org', is_pilot_family: true, team_ids: [] }];
    const { slices } = await resolveAcademyCallupNotice({ eventId: EVENT_ID, playerId: PLAYER_ID, pilotOnly: true }, { supabase: mockClient({ ...FIXTURES, player_guardians: withPilot, recipients }), now: NOW });
    expect(slices.length).toBe(1);
    expect(slices[0].guardian_id).toBe('0896bcd1-4b11-4ccc-a9ce-f03c29eb1d03');
  });

  it('12. response deadline: capped at start - 30min when now+2h is later', async () => {
    // now = event start - 1h => now+2h overshoots; deadline should be start-30min.
    const closeNow = new Date('2026-05-12T22:00:00Z');
    const { context } = await resolveAcademyCallupNotice({ eventId: EVENT_ID, playerId: PLAYER_ID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: closeNow });
    expect(context.response.deadline_at).toBe('2026-05-12T22:30:00.000Z');
    expect(context.response.hours_to_respond).toBeCloseTo(0.5, 2);
    // and now+2h branch (default fixture): deadline = now+2h since start-30min is far away
    const { context: ctxFar } = await resolveAcademyCallupNotice({ eventId: EVENT_ID, playerId: PLAYER_ID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    expect(ctxFar.response.deadline_at).toBe('2026-05-10T16:00:00.000Z');
    expect(ctxFar.response.hours_to_respond).toBeCloseTo(2, 1);
  });
});
