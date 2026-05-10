// Wave 4.1d-4 — regression tests for the inbox team filter chip.
//
// Repros the wave 4.1d-2 punch-list bug: synth rows from
// useNeedsBriefing fell through `return true` in applyClientFilters
// because they don't carry `audience_filter.team_ids` or
// `anchor_kind === 'team'`. Chip "10U Blue ✕" left other teams' synth
// cards visible in the rendered list.
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
function synthSkipped(teamId) { return { synthetic_id: `sk-${teamId}`, kind: 'schedule_change', anchor_kind: 'event', team_id: teamId, title: 'Schedule change' }; }
function synthDigest() { return { synthetic_id: 'digest', kind: 'weekly_digest', anchor_kind: 'org', anchor_id: ORG, title: 'Weekly digest' }; }

describe('rowMatchesTeamFilter — Wave 4.1d-4', () => {
  it('synth game_recap is hidden when its team is not selected', () => {
    expect(rowMatchesTeamFilter(synthGameRecap(TEAM_BOYS), [TEAM_BLUE])).toBe(false);
  });

  it('synth tournament_prelim passes if any participating team matches', () => {
    expect(rowMatchesTeamFilter(synthTournPrelim([TEAM_BLUE, TEAM_BOYS]), [TEAM_BLUE])).toBe(true);
  });

  it('synth weekly_digest (anchor_kind=org) always passes when chip active', () => {
    expect(rowMatchesTeamFilter(synthDigest(), [TEAM_BLUE])).toBe(true);
  });

  it('default-deny: row with no team fields is hidden when chip active (regression class lock)', () => {
    const rogueRow = { synthetic_id: 'rogue', kind: 'custom_message', anchor_kind: 'unknown', title: 'Rogue' };
    expect(rowMatchesTeamFilter(rogueRow, [TEAM_BLUE])).toBe(false);
  });
});

describe('applyClientFilters — chip gates the rendered list', () => {
  const mixed = [
    dbAnnouncement([TEAM_BLUE]),
    dbAnnouncement([TEAM_BOYS]),
    synthGameRecap(TEAM_BLUE),
    synthGameRecap(TEAM_BOYS),
    synthTournPrelim([TEAM_BLUE, TEAM_BOYS]),
    synthSkipped(TEAM_BLUE),
    synthSkipped(TEAM_BOYS),
    synthDigest(),
  ];

  it('chip selected gates list to that team (digest still passes as org-scoped)', () => {
    const result = applyClientFilters(mixed, { teams: [TEAM_BLUE] }, '');
    const ids = result.map((r) => r.id || r.synthetic_id).sort();
    expect(ids).toEqual([
      'db-team-10u-blue',
      'digest',
      'g-team-10u-blue',
      'sk-team-10u-blue',
      'tp-team-10u-blue-team-9u-boys',
    ]);
  });

  it('chip cleared (empty teams[]) shows all rows', () => {
    const result = applyClientFilters(mixed, { teams: [] }, '');
    expect(result.length).toBe(mixed.length);
  });

  it('chip with empty result set returns only org-scoped rows (UI renders empty-state for narrowed views)', () => {
    const NO_MATCH = 'team-does-not-exist';
    const result = applyClientFilters(mixed, { teams: [NO_MATCH] }, '');
    expect(result.map((r) => r.synthetic_id)).toEqual(['digest']);
    const teamScoped = result.filter((r) => r.anchor_kind !== 'org');
    expect(teamScoped).toHaveLength(0);
  });
});
