import { describe, expect, it } from 'vitest';
import { selectSignoffCoaches } from '../signoffCoaches';

const FRANK = { user_id: 'u-f', display_name: 'Frank', title: 'Program Director', phone: '1' };
const KENNY = { user_id: 'u-k', display_name: 'Coach Kenny', title: 'Coaching Director', phone: '2' };

describe('selectSignoffCoaches — OFF by default, explicit-pick, no all-staff fallback', () => {
  it('returns [] when the toggle is off (the default — fixes the announcement signature bug)', () => {
    expect(selectSignoffCoaches({ signoff_enabled: false, signoff_coaches: [FRANK, KENNY] })).toEqual([]);
    expect(selectSignoffCoaches({ signoff_coaches: [FRANK] })).toEqual([]);
    expect(selectSignoffCoaches(undefined)).toEqual([]);
  });

  it('returns [] when enabled but nobody picked — NO fallback to all staff', () => {
    expect(selectSignoffCoaches({ signoff_enabled: true, signoff_coaches: [] })).toEqual([]);
    expect(selectSignoffCoaches({ signoff_enabled: true, signoff_coaches: null })).toEqual([]);
    expect(selectSignoffCoaches({ signoff_enabled: true })).toEqual([]);
  });

  it('returns exactly the picked staff when enabled', () => {
    expect(selectSignoffCoaches({ signoff_enabled: true, signoff_coaches: [KENNY] })).toEqual([KENNY]);
  });
});
