// Wave 4.2-A-2 contract tests — locks resolver invariants:
//   1. Resolver pure
//   2. Compose pure
//   3. Slice ordering (guardian_id ASC, stable under input perm)
//   4. Pilot mode empty slices (pilotOnly=true with 0 pilot families)
//   5. Throws on unpublished result (GameRecapNotPublishedError)
//   6. No fabrication on null POG (section omitted)
//   7. No fabrication on empty coach_highlight (section omitted)

import { describe, expect, it } from 'vitest';
import { GameRecapNotPublishedError, composeGameRecap, resolveGameRecap } from '../gameRecap'; // eslint-disable-line sort-imports
import { mockClient } from './mockSupabase';
import event from './fixtures/game_recap_may_2_10u_blue/event.json';
import game_result from './fixtures/game_recap_may_2_10u_blue/game_result.json';
import player_of_game from './fixtures/game_recap_may_2_10u_blue/player_of_game.json';
import tournament from './fixtures/game_recap_may_2_10u_blue/tournament.json';
import recipients from './fixtures/game_recap_may_2_10u_blue/recipients.json';
import recipientsPilot from './fixtures/game_recap_may_2_10u_blue/recipients_pilot.json';
import player_guardians from './fixtures/game_recap_may_2_10u_blue/player_guardians.json';
import coaches from './fixtures/game_recap_may_2_10u_blue/coaches.json';
import organization from './fixtures/game_recap_may_2_10u_blue/organization.json';

const EVENT_ID = 'a0b2d68a-cd2a-4d15-9922-5c2becc0c806';
const NOW = new Date('2026-05-10T14:00:00Z');
const FIXTURES = { event, game_result, player_of_game, tournament, recipients, player_guardians, coaches, organization };
const norm = (v) => JSON.parse(JSON.stringify(v));

describe('game_recap resolver — contract', () => {
  it('1. resolver pure: identical inputs -> deeply-equal outputs', async () => {
    const a = await resolveGameRecap({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    const b = await resolveGameRecap({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    expect(norm(a)).toEqual(norm(b));
  });

  it('2. compose pure: same context+slice+overrides -> same content_sections', async () => {
    const { context, slices } = await resolveGameRecap({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    const a = composeGameRecap(context, slices[0], { coach_note: 'hello' });
    const b = composeGameRecap(context, slices[0], { coach_note: 'hello' });
    expect(norm(a)).toEqual(norm(b));
  });

  it('3. slice ordering: guardian_id ASC, stable under input permutation', async () => {
    const reversed = { ...FIXTURES, recipients: [...recipients].reverse() };
    const { slices } = await resolveGameRecap({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient(reversed), now: NOW });
    const ids = slices.map((s) => s.guardian_id);
    const sorted = [...ids].sort();
    expect(ids).toEqual(sorted);
  });

  it('4. pilot mode empty slices: pilotOnly=true with no pilot families -> []', async () => {
    const { slices, context } = await resolveGameRecap({ eventId: EVENT_ID, pilotOnly: true }, { supabase: mockClient({ ...FIXTURES, recipients: recipientsPilot }), now: NOW });
    expect(slices).toEqual([]);
    expect(context.event.id).toBe(EVENT_ID);
  });

  it('5. throws GameRecapNotPublishedError when published_at is null', async () => {
    const fixturesUnpublished = { ...FIXTURES, game_result: { ...game_result, published_at: null } };
    await expect(resolveGameRecap({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient(fixturesUnpublished), now: NOW }))
      .rejects.toBeInstanceOf(GameRecapNotPublishedError);
  });

  it('6. no fabrication: null POG -> player_of_game section omitted', async () => {
    const fixturesNoPOG = { ...FIXTURES, game_result: { ...game_result, player_of_game_id: null }, player_of_game: null };
    const { context, slices } = await resolveGameRecap({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient(fixturesNoPOG), now: NOW });
    const { content_sections } = composeGameRecap(context, slices[0], {});
    const flat = JSON.stringify(content_sections);
    expect(flat).not.toContain('Player of the game');
    expect(content_sections.find((s) => s.kind === 'player_of_game')).toBeUndefined();
  });

  it('7. no fabrication: empty coach_highlight -> highlight section omitted', async () => {
    const fixturesNoHighlight = { ...FIXTURES, game_result: { ...game_result, coach_highlight: '' } };
    const { context, slices } = await resolveGameRecap({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient(fixturesNoHighlight), now: NOW });
    const { content_sections } = composeGameRecap(context, slices[0], {});
    // The coach_highlight body 'defense' should not appear; the game_card
    // (final score) still renders before the narrative sections.
    const bodies = content_sections.filter((s) => s.kind === 'stats_narrative').map((s) => s.body);
    expect(bodies).not.toContain('defense');
    const card = content_sections.find((s) => s.kind === 'game_card');
    expect(card).toBeDefined();
    expect(card.stakeLine.text).toBe('2–0 · Win');
  });

  it('8. emits one game_card (final score) before the narrative stats_narrative sections', async () => {
    const { context, slices } = await resolveGameRecap({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    const { content_sections } = composeGameRecap(context, slices[0], {});
    const kinds = content_sections.map((s) => s.kind);
    // header → game_card → POG narrative → coach_highlight narrative → signoff → footer
    expect(kinds).toEqual(['header', 'game_card', 'stats_narrative', 'stats_narrative', 'signoff', 'footer']);
    const card = content_sections[1];
    expect(card.primary).toBe('10U Blue vs Resurrection White 4AB');
    expect(card.stakeLine).toEqual({ text: '2–0 · Win', tone: 'green' });
    expect(card.team_color).toBe('#94a3b8');
    expect(card.secondary).toEqual({ text: 'CYO Spellman', link: null });
  });
});
