import { describe, expect, it } from 'vitest';
import { audienceCopy } from '../audience';

describe('audienceCopy (wave 4.1d-2 §3.1 — direct copy without "Settings → Communications" deeplink, no target route exists yet)', () => {
  it('pilot_zero copy explains 0 filter and how to disable', () => {
    const copy = audienceCopy({ filtered: 0, total: 21, mode: 'pilot_zero' });
    expect(copy).toContain('Pilot Mode is filtering');
    expect(copy).toContain('0 pilot families');
    expect(copy).toContain('out of 21');
    expect(copy).toContain('Disable pilot mode');
    expect(copy).toContain('send to all 21');
  });

  it('pilot_partial copy mentions both numbers', () => {
    const copy = audienceCopy({ filtered: 2, total: 24, mode: 'pilot_partial' });
    expect(copy).toContain('Pilot Mode is ON');
    expect(copy).toContain('sending to 2 pilot families');
    expect(copy).toContain('out of 24');
    expect(copy).toContain('send to all 24');
  });

  it('Wave 4.3-L — noun is "pilot families" not "pilot guardians" in pilot_zero/pilot_partial', () => {
    // Families is the right audience unit; each family has 1-2 guardians.
    // Wave 4.3-L renames the noun in both pilot_zero + pilot_partial.
    const zero = audienceCopy({ filtered: 0, total: 22, mode: 'pilot_zero' });
    const partial = audienceCopy({ filtered: 3, total: 102, mode: 'pilot_partial' });
    expect(zero).not.toContain('pilot guardians');
    expect(partial).not.toContain('pilot guardians');
    expect(zero).toContain('pilot families');
    expect(partial).toContain('pilot families');
  });

  it('Wave 4.3-L — pilot_test_override tail explicitly says "all N families"', () => {
    // Compose · Body banner consistency — total is the dormant-family
    // universe; copy now suffixes "families" so admins don't read "all 102"
    // as ambiguous (could be guardians, families, etc.).
    const copy = audienceCopy({ filtered: 5, total: 102, mode: 'pilot_test_override', testRecipientEmail: 'admin@legacyhoopers.org' });
    expect(copy).toContain('all 102 families');
    expect(copy).not.toContain('pilot guardians');
    expect(copy).not.toContain('out of 102');
  });

  it('Wave 4.1d-2 §3.1 — pilot_zero "Disable pilot mode" guidance is direct, no broken deeplink', () => {
    // No more "Settings → Communications" anchor since the route doesn't
    // exist yet; copy is direct and actionable.
    const copy = audienceCopy({ filtered: 0, total: 12, mode: 'pilot_zero' });
    expect(copy).not.toContain('Settings → Communications');
    expect(copy).toContain('Disable pilot mode');
  });

  it('standard copy is the simple Will send line', () => {
    expect(audienceCopy({ filtered: 5, mode: 'standard' })).toBe('Will send to 5 families.');
    expect(audienceCopy({ filtered: 1, mode: 'standard' })).toBe('Will send to 1 family.');
  });

  it('null filtered → Computing audience…', () => {
    expect(audienceCopy({ filtered: null, mode: 'standard' })).toBe('Computing audience…');
  });

  it('Wave 4.3-K — pilot_test_override copy names the test recipient and dormant family count separately', () => {
    const copy = audienceCopy({ filtered: 5, total: 102, mode: 'pilot_test_override', testRecipientEmail: 'admin@legacyhoopers.org' });
    expect(copy).toContain('Pilot test mode');
    expect(copy).toContain('admin@legacyhoopers.org');
    expect(copy).toContain('5 team views');
    expect(copy).toContain('Disable pilot mode');
    expect(copy).toContain('all 102');
  });

  it('Wave 4.3-K — pilot_test_override singular: 1 team view', () => {
    const copy = audienceCopy({ filtered: 1, total: 102, mode: 'pilot_test_override', testRecipientEmail: 'admin@legacyhoopers.org' });
    expect(copy).toContain('1 team view');
    expect(copy).not.toContain('1 team views');
  });

  it('Wave 4.3-K — pilot_test_override copy falls back to admin@ when email not provided', () => {
    const copy = audienceCopy({ filtered: 1, mode: 'pilot_test_override' });
    expect(copy).toContain('admin@');
  });
});
