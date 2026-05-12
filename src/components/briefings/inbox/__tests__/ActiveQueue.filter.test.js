// Wave 4.1d-4 — regression tests for the inbox team filter chip.
// Wave 4.8 6c (PR #120) — kind/teams/dateRange filtering moved to the
// briefing_active_queue RPC. applyClientFilters is now search-only.
// `rowMatchesTeamFilter` is kept (still exported) for use against the
// safety-net rows from useNeedsBriefing — those don't flow through the
// RPC and may still need client-side team checks if a future caller
// re-introduces them.
//
// Tests the pure filter logic — no React render, no Supabase.

import { describe, expect, it } from 'vitest';
import { applyClientFilters, rowMatchesTeamFilter } from '../clientFilters';

const TEAM_BLUE = 'team-10u-blue';
const TEAM_BOYS = 'team-9u-boys';
const ORG = 'org-uuid';

function dbAnnouncement(teamIds) { return { id: `db-${teamIds.join('-')}`, kind: 'announcement', audience_filter: { team_ids: teamIds }, title: 'DB row' }; }
function synthGameRecap(teamId) { return { synthetic_id: `g-${teamId}`, kind: 'game_recap', anchor_kind: 'event', team_id: teamId, title: `Game · ${teamId}` }; }
function synthTournPrelim(teamIds) { return { synthetic_id: `tp-${teamIds.join('-')}`, kind: 'tournament_prelim', anchor_kind: 'tournament', team_ids: teamIds, title: 'Tournament' }; }
function synthDigest() { return { synthetic_id: 'digest', kind: 'weekly_digest', anchor_kind: 'org', anchor_id: ORG, title: 'Weekly digest' }; }

describe('rowMatchesTeamFilter — exported helper (kept for safety-net rows)', () => {
  it('synth game_recap is hidden when its team is not selected', () => {
    expect(rowMatchesTeamFilter(synthGameRecap(TEAM_BOYS), [TEAM_BLUE])).toBe(false);
  });

  it('synth tournament_prelim passes if any participating team matches', () => {
    expect(rowMatchesTeamFilter(synthTournPrelim([TEAM_BLUE, TEAM_BOYS]), [TEAM_BLUE])).toBe(true);
  });

  it('synth weekly_digest (anchor_kind=org) always passes when chip active', () => {
    expect(rowMatchesTeamFilter(synthDigest(), [TEAM_BLUE])).toBe(true);
  });

  it('default-deny: row with no team fields is hidden when chip active', () => {
    const rogueRow = { synthetic_id: 'rogue', kind: 'custom_message', anchor_kind: 'unknown', title: 'Rogue' };
    expect(rowMatchesTeamFilter(rogueRow, [TEAM_BLUE])).toBe(false);
  });
});

describe('applyClientFilters — search-only (Wave 4.8 6c)', () => {
  const mixed = [
    dbAnnouncement([TEAM_BLUE]),
    synthGameRecap(TEAM_BLUE),
    synthTournPrelim([TEAM_BLUE, TEAM_BOYS]),
    synthDigest(),
  ];

  it('returns input verbatim when no search term', () => {
    const result = applyClientFilters(mixed, { teams: [TEAM_BLUE], kind: 'game_recap' }, '');
    expect(result).toEqual(mixed);
  });

  it('filters by case-insensitive substring on title/title_text/subject', () => {
    const rows = [
      { id: 'a', title: 'Weekly digest · all program families' },
      { id: 'b', title_text: 'Game · 10U Blue vs Falcons' },
      { id: 'c', subject: 'Tournament briefing · ZG Memorial Day' },
    ];
    const out = applyClientFilters(rows, {}, 'GAME');
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('b');
  });

  it('treats whitespace-only search as no filter', () => {
    expect(applyClientFilters(mixed, {}, '   ').length).toBe(mixed.length);
  });

  it('returns empty array when no rows match', () => {
    const out = applyClientFilters(mixed, {}, 'no-such-string');
    expect(out).toEqual([]);
  });
});
