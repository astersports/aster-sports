import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { COMPETITIVE_TEAM_SLUGS, isCompetitiveTeam } from '../teamTypes';

// C-12 team-type semantics + the cross-surface invariant (anti-pattern #43):
// the SAME exclusion (non-competitive teams off AAU-semantics surfaces) must
// hold on every surface that renders standings / records / a bracket picker.
// If a future PR adds a fourth AAU surface without the filter, the invariant
// section below fails and forces the structural fix.
describe('isCompetitiveTeam', () => {
  it('true for game / tournament / hybrid teams (they play games)', () => {
    for (const slug of COMPETITIVE_TEAM_SLUGS) {
      expect(isCompetitiveTeam({ team_types: { slug } })).toBe(true);
    }
  });

  it('false for camp / clinic / training-only / academy teams', () => {
    for (const slug of ['clinic_camp', 'training_only', 'academy']) {
      expect(isCompetitiveTeam({ team_types: { slug } })).toBe(false);
    }
  });

  it('defaults to competitive when no joined type (no-regression for legacy rows)', () => {
    expect(isCompetitiveTeam({})).toBe(true);
    expect(isCompetitiveTeam({ team_types: null })).toBe(true);
    expect(isCompetitiveTeam(undefined)).toBe(true);
  });
});

describe('cross-surface invariant — camp excluded from AAU-semantics surfaces', () => {
  it('useTeams embeds team_types(slug) so consumers can classify', () => {
    const src = readFileSync('src/hooks/useTeams.js', 'utf8');
    expect(src).toMatch(/team_types\(slug\)/);
  });

  it('RecordsPage filters standings via isCompetitiveTeam', () => {
    const src = readFileSync('src/pages/RecordsPage.jsx', 'utf8');
    expect(src).toMatch(/isCompetitiveTeam/);
    expect(src).toMatch(/\.filter\(isCompetitiveTeam\)/);
  });

  it('GamesView filters standings via isCompetitiveTeam', () => {
    const src = readFileSync('src/components/schedule/GamesView.jsx', 'utf8');
    expect(src).toMatch(/\.filter\(isCompetitiveTeam\)/);
  });

  it('TeamMultiSelect (tournament bracket) filters via isCompetitiveTeam + embeds slug', () => {
    const src = readFileSync('src/components/tournament/TeamMultiSelect.jsx', 'utf8');
    expect(src).toMatch(/team_types\(slug\)/);
    expect(src).toMatch(/\.filter\(isCompetitiveTeam\)/);
  });
});
