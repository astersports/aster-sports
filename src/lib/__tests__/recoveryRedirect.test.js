import { describe, expect, it } from 'vitest';
import { recoveryTarget } from '../recoveryRedirect';

// Locks the password-recovery landing guard: a recovery hash that lands anywhere
// other than /reset-password (because GoTrue coerced redirect_to to the Site URL)
// gets rerouted to /reset-password with the token hash intact — while magic-link
// and password logins are left alone.
describe('recoveryTarget', () => {
  const RECOVERY = '#access_token=abc&expires_in=3600&refresh_token=def&token_type=bearer&type=recovery';

  it('reroutes a recovery hash landing at the root to /reset-password, preserving the hash', () => {
    expect(recoveryTarget('/', RECOVERY)).toBe(`/reset-password${RECOVERY}`);
  });

  it('reroutes from any non-reset path (e.g. /login)', () => {
    expect(recoveryTarget('/login', RECOVERY)).toBe(`/reset-password${RECOVERY}`);
  });

  it('is a no-op when already on /reset-password (no redirect loop)', () => {
    expect(recoveryTarget('/reset-password', RECOVERY)).toBeNull();
  });

  it('ignores a magic-link hash (Hub OTP sign-in)', () => {
    expect(recoveryTarget('/hub', '#access_token=abc&type=magiclink')).toBeNull();
  });

  it('ignores a plain load with no hash', () => {
    expect(recoveryTarget('/', '')).toBeNull();
    expect(recoveryTarget('/', undefined)).toBeNull();
  });
});
