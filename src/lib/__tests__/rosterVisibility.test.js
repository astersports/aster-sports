import { describe, expect, it } from 'vitest';
import { rosterVisible } from '../rosterVisibility';

// Locks the COALESCE(team.override, program.roster_visibility, program_type='season')
// chain in lockstep with current_user_teammate_player_ids() (RV-2). The SQL side is
// verified by impersonated replay (48→27 baseline; camp Show→48; season Hide→13).
describe('rosterVisible (RV-2 effective visibility)', () => {
  it('team override wins over everything', () => {
    expect(rosterVisible(true, false, 'camp')).toBe(true);   // Show a camp team
    expect(rosterVisible(false, true, 'season')).toBe(false); // Hide a season team
  });
  it('no override → program value wins', () => {
    expect(rosterVisible(null, true, 'camp')).toBe(true);
    expect(rosterVisible(null, false, 'season')).toBe(false);
  });
  it('no override + no program value → program_type default', () => {
    expect(rosterVisible(null, null, 'season')).toBe(true);
    expect(rosterVisible(null, null, 'camp')).toBe(false);
    expect(rosterVisible(null, null, 'tryout')).toBe(false);
  });
});
