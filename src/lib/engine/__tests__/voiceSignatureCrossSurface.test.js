// AP #43 cross-surface invariant: the team-aware voice signature is ONE
// concept rendered by every narrative-signing kind. It must derive from the
// same source (org.signature_coaches -> buildVoiceSignature) and read the
// same on every surface for the same team. If a kind drops the signature or
// derives it differently, this test fails and forces the structural fix
// rather than a per-kind patch.
//
// The signature is DATA-DRIVEN (architect C3): a team whose team_staff
// includes an assistant (Darien on 9U/8U) signs WITH that assistant; a team
// without one does NOT — derived purely from the injected coaches, never a
// hardcoded "9U/8U" branch.

import { describe, expect, it } from 'vitest';
import { composeGameRecap } from '../resolvers/gameRecap';
import { composeGamesRecap } from '../resolvers/gamesRecap';
import { composeWeeklyDigest } from '../resolvers/composeWeeklyDigest';
import { buildRecapSections } from '../resolvers/tournamentRecapHelpers';
import { buildVoiceSignature } from '../voiceSignature';

const FRANK = { user_id: 'u-frank', display_name: 'Frank', title: 'Program Director', phone: '917' };
const KENNY = { user_id: 'u-kenny', display_name: 'Coach Kenny', title: 'Coaching Director', phone: '516' };
const DARIEN = { user_id: 'u-darien', display_name: 'Coach Darien', title: 'Assistant Coach', phone: '914' };

const KENNY_ONLY = [FRANK, KENNY];                 // 10U Blue / 11U Girls etc.
const WITH_DARIEN = [FRANK, KENNY, DARIEN];         // 9U / 8U
const EXPECT_KENNY = 'Frank & Coach Kenny';
const EXPECT_DARIEN = 'Frank, Coach Kenny & Coach Darien';

function findSignoff(sections) {
  return sections.find((s) => s.kind === 'signoff');
}

function orgCtx(signature_coaches) {
  return {
    id: 'o-1', name: 'Legacy Hoopers',
    branding: { eyebrowLink: 'x', contactEmail: 'c', logoUrl: 'l' },
    coaches: [KENNY], signature_coaches,
  };
}

describe('AP #43 — team-aware voice signature is invariant across kinds', () => {
  it('game_recap signs WITH Darien when team_staff includes Darien', () => {
    const ctx = { org: orgCtx(WITH_DARIEN), team: { id: 't', name: '9U Boys' }, event: { id: 'e', start_at: '2026-05-02T18:00:00Z' }, game_result: { our_score: 40, opponent_score: 20, result: 'W' }, player_of_game: null, location: null };
    const { content_sections } = composeGameRecap(ctx, { kind: 'family' }, {});
    expect(findSignoff(content_sections).signature).toBe(EXPECT_DARIEN);
  });

  it('game_recap signs WITHOUT Darien for a non-Darien team', () => {
    const ctx = { org: orgCtx(KENNY_ONLY), team: { id: 't', name: '10U Blue' }, event: { id: 'e', start_at: '2026-05-02T18:00:00Z' }, game_result: { our_score: 40, opponent_score: 20, result: 'W' }, player_of_game: null, location: null };
    const { content_sections } = composeGameRecap(ctx, { kind: 'family' }, {});
    expect(findSignoff(content_sections).signature).toBe(EXPECT_KENNY);
  });

  it('tournament_recap signs per-team from signature_coaches_by_team', () => {
    const ctx = {
      org: orgCtx(KENNY_ONLY),
      signature_coaches_by_team: { 't-8u': WITH_DARIEN, 't-11u': KENNY_ONLY },
      tournament: { name: 'Chase', pool_label: null },
      tournament_teams: [{ team_id: 't-8u', team_name: '8U Boys', team_color: '#f59e0b', final_place: null, wins: 0, losses: 0 }],
      events_by_team: { 't-8u': [] }, game_results_by_event: {}, locations: {},
    };
    const sections8u = buildRecapSections(ctx, { team_id: 't-8u', team_name: '8U Boys', team_color: '#f59e0b' }, {});
    expect(findSignoff(sections8u).signature).toBe(EXPECT_DARIEN);

    const ctx11 = { ...ctx, tournament_teams: [{ team_id: 't-11u', team_name: '11U Girls', team_color: '#a78bfa', final_place: null, wins: 0, losses: 0 }], events_by_team: { 't-11u': [] } };
    const sections11 = buildRecapSections(ctx11, { team_id: 't-11u', team_name: '11U Girls', team_color: '#a78bfa' }, {});
    expect(findSignoff(sections11).signature).toBe(EXPECT_KENNY);
  });

  it('games_recap (multi-team default): signs with the UNION of involved teams coaches', () => {
    // 9U + 10U weekend digest: union resolved upstream as Frank+Kenny+Darien.
    const ctx = { org: orgCtx(WITH_DARIEN), games: [{ team_name: '9U Boys', team_color: '#fff', our_score: 1, opponent_score: 0, result: 'W', day_label: 'SAT' }], summary: { record: '1-0', recordPill: '1–0' }, subject: 'x' };
    const { content_sections } = composeGamesRecap(ctx, { kind: 'family' }, {});
    expect(findSignoff(content_sections).signature).toBe(EXPECT_DARIEN);
  });

  it('weekly_digest signs from org.signature_coaches (org-wide union)', () => {
    const ctx = { org: orgCtx(KENNY_ONLY), period: { start: new Date(), end: new Date(), label: 'X' }, events: [], teams: [], tournaments: [], rsvpCountsByEvent: new Map() };
    const { content_sections } = composeWeeklyDigest(ctx, { kind: 'family', team_ids: [] }, {});
    expect(findSignoff(content_sections).signature).toBe(EXPECT_KENNY);
  });

  it('every kind uses buildVoiceSignature (same derivation, no per-kind formatting drift)', () => {
    // The string each kind emits must equal buildVoiceSignature of the same
    // coaches — proving no kind reformats the natural-list independently.
    expect(buildVoiceSignature(WITH_DARIEN)).toBe(EXPECT_DARIEN);
    expect(buildVoiceSignature(KENNY_ONLY)).toBe(EXPECT_KENNY);
  });
});
