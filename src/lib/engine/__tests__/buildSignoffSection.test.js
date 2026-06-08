// Unit + cross-surface invariant for the per-message gated signoff
// (contact info OFF by default; opt-in carries the selected staff).

import { describe, expect, it } from 'vitest';
import { buildSignoffSection } from '../buildSignoffSection';

const FRANK = { user_id: 'u-frank', display_name: 'Frank', title: 'Program Director', phone: '(917) 991-9830' };
const KENNY = { user_id: 'u-kenny', display_name: 'Coach Kenny', title: 'Coaching Director', phone: '(516) 644-0208' };
const NOPHONE = { user_id: 'u-x', display_name: 'No Phone', title: 'Helper', phone: '' };

describe('buildSignoffSection — contact OFF by default', () => {
  it('returns null with no overrides at all', () => {
    expect(buildSignoffSection()).toBeNull();
    expect(buildSignoffSection({ overrides: {} })).toBeNull();
  });

  it('does NOT render coaches/signature when disabled, even if coaches are supplied', () => {
    const s = buildSignoffSection({ overrides: { signoff_enabled: false, signoff_coaches: [FRANK, KENNY] } });
    expect(s).toBeNull();
  });

  it('does NOT render coaches/signature when enabled but nobody is selected', () => {
    const s = buildSignoffSection({ overrides: { signoff_enabled: true, signoff_coaches: [] } });
    expect(s).toBeNull();
  });

  it('still renders a prose-only signoff (closing note is independent of the toggle)', () => {
    const s = buildSignoffSection({ overrides: { signoff_message: '  See you Saturday.  ' } });
    expect(s).toEqual({ kind: 'signoff', prose: 'See you Saturday.', signature: '', coaches: [] });
  });
});

describe('buildSignoffSection — opt-in renders the selected staff', () => {
  it('renders signature line + contact rows for the selected coaches', () => {
    const s = buildSignoffSection({ overrides: { signoff_enabled: true, signoff_coaches: [FRANK, KENNY] } });
    expect(s.signature).toBe('Frank & Coach Kenny');
    expect(s.coaches).toEqual([
      { display_name: 'Frank', title: 'Program Director', phone: '(917) 991-9830' },
      { display_name: 'Coach Kenny', title: 'Coaching Director', phone: '(516) 644-0208' },
    ]);
  });

  it('signature uses every selected name, but the contact block drops phone-less staff', () => {
    const s = buildSignoffSection({ overrides: { signoff_enabled: true, signoff_coaches: [FRANK, NOPHONE] } });
    expect(s.signature).toBe('Frank & No Phone');
    expect(s.coaches).toEqual([{ display_name: 'Frank', title: 'Program Director', phone: '(917) 991-9830' }]);
  });

  it('combines prose with the opted-in signature', () => {
    const s = buildSignoffSection({ overrides: { signoff_message: 'Go team.', signoff_enabled: true, signoff_coaches: [KENNY] } });
    expect(s.prose).toBe('Go team.');
    expect(s.signature).toBe('Coach Kenny');
  });
});
