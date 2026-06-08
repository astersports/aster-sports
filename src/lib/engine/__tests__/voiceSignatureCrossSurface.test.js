// AP #43 cross-surface invariant: contact info (the coach signature line +
// the name · title · phone block) is ONE concept gated the SAME way on every
// narrative-signing kind. It is OFF by default and renders only on per-message
// opt-in (overrides.signoff_enabled + overrides.signoff_coaches), uniform
// across kinds via the shared buildSignoffSection. If a kind renders the
// signoff differently (on by default, or ignoring the toggle), this fails and
// forces the structural fix rather than a per-kind patch.
//
// (Supersedes the prior always-on team-aware auto-signature invariant — the
// signature is now the admin's per-message manual selection, not derived from
// team_staff. buildVoiceSignature's natural-list formatting is still covered
// in voiceSignature.test.js + buildSignoffSection.test.js.)

import { describe, expect, it } from 'vitest';
import { composeGameRecap } from '../resolvers/gameRecap';
import { composeGamesRecap } from '../resolvers/gamesRecap';
import { composeWeeklyDigest } from '../resolvers/composeWeeklyDigest';
import { buildRecapSections } from '../resolvers/tournamentRecapHelpers';

const FRANK = { user_id: 'u-frank', display_name: 'Frank', title: 'Program Director', phone: '(917) 991-9830' };
const KENNY = { user_id: 'u-kenny', display_name: 'Coach Kenny', title: 'Coaching Director', phone: '(516) 644-0208' };
const PICKED = [FRANK, KENNY];
const EXPECT_SIG = 'Frank & Coach Kenny';
const ENABLED = { signoff_enabled: true, signoff_coaches: PICKED };

function findSignoff(sections) {
  return sections.find((s) => s.kind === 'signoff');
}

function orgCtx() {
  return { id: 'o-1', name: 'Legacy Hoopers', branding: { eyebrowLink: 'x', contactEmail: 'c', logoUrl: 'l' }, coaches: [], signature_coaches: [] };
}

// (compose fn, contextFor) per narrative-signing kind that routes the wizard.
const KINDS = [
  ['game_recap', (ov) => composeGameRecap(
    { org: orgCtx(), team: { id: 't', name: '9U Boys' }, event: { id: 'e', start_at: '2026-05-02T18:00:00Z' }, game_result: { our_score: 40, opponent_score: 20, result: 'W' }, player_of_game: null, location: null },
    { kind: 'family' }, ov)],
  ['games_recap', (ov) => composeGamesRecap(
    { org: orgCtx(), games: [{ team_name: '9U Boys', team_color: '#fff', our_score: 1, opponent_score: 0, result: 'W', day_label: 'SAT' }], summary: { record: '1-0', recordPill: '1–0' }, subject: 'x' },
    { kind: 'family' }, ov)],
  ['weekly_digest', (ov) => composeWeeklyDigest(
    { org: orgCtx(), period: { start: new Date(), end: new Date(), label: 'X' }, events: [], teams: [], tournaments: [], rsvpCountsByEvent: new Map() },
    { kind: 'family', team_ids: [] }, ov)],
];

describe('AP #43 — contact info is OFF by default on every kind', () => {
  it.each(KINDS)('%s: no signoff coaches/signature with default overrides', (_name, composeFor) => {
    const { content_sections } = composeFor({});
    const s = findSignoff(content_sections);
    // either omitted entirely, or present only for prose (never coaches/signature)
    expect(s?.coaches?.length || 0).toBe(0);
    expect(s?.signature || '').toBe('');
  });

  it.each(KINDS)('%s: opt-in renders the selected signature + contact rows uniformly', (_name, composeFor) => {
    const { content_sections } = composeFor(ENABLED);
    const s = findSignoff(content_sections);
    expect(s.signature).toBe(EXPECT_SIG);
    expect(s.coaches).toEqual([
      { display_name: 'Frank', title: 'Program Director', phone: '(917) 991-9830' },
      { display_name: 'Coach Kenny', title: 'Coaching Director', phone: '(516) 644-0208' },
    ]);
  });
});

describe('AP #43 — tournament_recap gates the same way', () => {
  const recapCtx = () => ({
    org: orgCtx(),
    tournament: { name: 'Chase', pool_label: null },
    tournament_teams: [{ team_id: 't-8u', team_name: '8U Boys', team_color: '#f59e0b', final_place: null, wins: 0, losses: 0 }],
    events_by_team: { 't-8u': [] }, game_results_by_event: {}, locations: {},
  });
  const slice = { team_id: 't-8u', team_name: '8U Boys', team_color: '#f59e0b' };

  it('off by default', () => {
    const s = findSignoff(buildRecapSections(recapCtx(), slice, {}));
    expect(s?.coaches?.length || 0).toBe(0);
    expect(s?.signature || '').toBe('');
  });

  it('opt-in renders the selected signature', () => {
    const s = findSignoff(buildRecapSections(recapCtx(), slice, ENABLED));
    expect(s.signature).toBe(EXPECT_SIG);
    expect(s.coaches).toHaveLength(2);
  });
});
