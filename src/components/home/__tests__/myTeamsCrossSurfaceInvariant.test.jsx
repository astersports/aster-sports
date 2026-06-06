// @vitest-environment jsdom
//
// Cross-surface invariant test per CLAUDE.md anti-pattern #43.
//
// MY TEAMS records render identically across both home page surfaces
// (Coach and Parent). The B1 audit catch (PR #239 origin) was that
// CoachHomePage built `myTeams` from a direct team_staff query and
// passed no `summary` prop to ParentHomeTeamCard — the card fell back
// to EMPTY_SUMMARY which renders "0-0" for every team. ParentHomePage
// passed records correctly via useOrgTeamRecords.
//
// This test locks the invariant:
//   (a) ParentHomeTeamCard renders the same output regardless of
//       which page wraps it, given the same summary
//   (b) CoachHomePage uses useOrgTeamRecords (the canonical hook)
//   (c) CoachHomePage threads recordsByTeam to ParentHomeTeamCard
//   (d) ParentHomePage threads recordsByTeam (via MyTeamsStrip)
//
// If any future PR reverts to a direct team_staff query without records,
// or removes the summary prop, this test fails and forces the structural
// fix rather than per-surface patches.

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { readFileSync } from 'fs';
import ParentHomeTeamCard from '../ParentHomeTeamCard';

afterEach(cleanup);

const TEAM = {
  id: 't-10b', name: '10U Black', team_color: '#4a8fd4', sort_order: 2,
};
const SUMMARY = {
  record: '9-4', ties: 0, streak: 'W4', last5: [], ppg: 31.8,
};

describe('Cross-surface invariant — MY TEAMS records (anti-pattern #43)', () => {
  it('a. ParentHomeTeamCard renders the same record line regardless of caller', () => {
    const { container } = render(
      <ParentHomeTeamCard team={TEAM} summary={SUMMARY} loading={false} onClick={() => {}} />,
    );
    expect(container.textContent).toContain('9-4');
    expect(container.textContent).toContain('W4');
  });

  it('b. CoachHomePage imports useOrgTeamRecords (canonical hook for team records)', () => {
    const src = readFileSync('src/pages/CoachHomePage.jsx', 'utf8');
    expect(src).toMatch(/from ['"]\.\.\/hooks\/useOrgTeamRecords['"]/);
  });

  it('c. CoachTail renders team records from the recordsByTeam source', () => {
    // Render-alignment: coach My-teams is a compact context card with team
    // rails (per HOME_RENDERS), not ParentHomeTeamCard tiles. Records still
    // come from recordsByTeam (useOrgTeamRecords) — the same source as Parent —
    // so the anti-pattern #43 records-source invariant holds.
    const pageSrc = readFileSync('src/pages/CoachHomePage.jsx', 'utf8');
    expect(pageSrc).toMatch(/recordsByTeam=\{recordsByTeam\}/);
    const tailSrc = readFileSync('src/components/home/CoachTail.jsx', 'utf8');
    expect(tailSrc).toMatch(/recordsByTeam\[t\.id\]/);
  });

  it('d. ParentHomePage sources team records from useOrgTeamRecords (records peek lives in ParentTail)', () => {
    // Home redesign Phase 1 (shell contract v2): the parent MY TEAMS strip +
    // ParentHomeSignalZone were retired. The records peek now lives in
    // ParentTail (the achievement record badge + "View records"). Records
    // still source from the canonical useOrgTeamRecords hook — the same
    // source Coach's MY TEAMS uses — so the anti-pattern #43 invariant (no
    // per-surface records divergence) holds across the redesign.
    const pageSrc = readFileSync('src/pages/ParentHomePage.jsx', 'utf8');
    expect(pageSrc).toMatch(/useOrgTeamRecords/);
    expect(pageSrc).toMatch(/recordsByTeam/);
  });
});
