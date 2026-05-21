// Locking test for src/lib/loginRedirectAllowlist.js — the canonical
// post-login redirect allowlist consumed by LoginPage. The allowlist
// is UX-only (not an auth boundary; routes are RLS-gated at the data
// layer). This test pins the contract so a future narrowing doesn't
// silently land admins at '/' instead of their last admin/* surface
// (the original regression that motivated Q1 expansion of the
// allowlist from a 1-route ('/admin/locations') match to a broad
// '/admin/' prefix).

import { describe, expect, it } from 'vitest';
import {
  isAllowedRedirect,
  REDIRECT_ALLOWLIST,
  resolveLoginRedirect,
} from '../loginRedirectAllowlist';

describe('REDIRECT_ALLOWLIST — admin route expansion', () => {
  it('includes /admin/ broadly (not just /admin/locations)', () => {
    expect(REDIRECT_ALLOWLIST).toContain('/admin/');
    expect(REDIRECT_ALLOWLIST).not.toContain('/admin/locations');
  });
});

describe('isAllowedRedirect — admin routes', () => {
  it('allows /admin/seasons', () => {
    expect(isAllowedRedirect('/admin/seasons')).toBe(true);
  });

  it('allows /admin/financials', () => {
    expect(isAllowedRedirect('/admin/financials')).toBe(true);
  });

  it('allows /admin/locations (preserves prior coverage)', () => {
    expect(isAllowedRedirect('/admin/locations')).toBe(true);
  });

  it('allows /admin/teams', () => {
    expect(isAllowedRedirect('/admin/teams')).toBe(true);
  });

  it('allows nested admin subpaths', () => {
    expect(isAllowedRedirect('/admin/seasons/spring-2026/edit')).toBe(true);
  });
});

describe('isAllowedRedirect — non-admin allowed routes', () => {
  it('allows /events/<id>', () => {
    expect(isAllowedRedirect('/events/abc')).toBe(true);
  });

  it('allows /tournaments/<id>', () => {
    expect(isAllowedRedirect('/tournaments/xyz')).toBe(true);
  });

  it('allows /teams/<id>', () => {
    expect(isAllowedRedirect('/teams/123')).toBe(true);
  });

  it('allows /schedule', () => {
    expect(isAllowedRedirect('/schedule')).toBe(true);
  });

  it('allows /records', () => {
    expect(isAllowedRedirect('/records')).toBe(true);
  });

  it('allows /account', () => {
    expect(isAllowedRedirect('/account')).toBe(true);
  });

  it('allows /messages', () => {
    expect(isAllowedRedirect('/messages')).toBe(true);
  });
});

describe('isAllowedRedirect — blocked / invalid inputs', () => {
  it('blocks /random/path', () => {
    expect(isAllowedRedirect('/random/path')).toBe(false);
  });

  it('blocks empty string', () => {
    expect(isAllowedRedirect('')).toBe(false);
  });

  it('blocks null', () => {
    expect(isAllowedRedirect(null)).toBe(false);
  });

  it('blocks undefined', () => {
    expect(isAllowedRedirect(undefined)).toBe(false);
  });

  it('blocks non-string inputs', () => {
    expect(isAllowedRedirect(42)).toBe(false);
    expect(isAllowedRedirect({})).toBe(false);
  });

  it('blocks paths that do not start with an allowed prefix', () => {
    expect(isAllowedRedirect('foo/admin/seasons')).toBe(false);
    // Trailing slash on '/admin/' prevents '/adminx/...' from matching —
    // confirms the prefix is path-segment safe, not just string-prefix loose.
    expect(isAllowedRedirect('/adminx/seasons')).toBe(false);
  });
});

describe('resolveLoginRedirect — full integration contract', () => {
  it('returns the intended path when allowlisted (admin)', () => {
    expect(resolveLoginRedirect('/admin/seasons')).toBe('/admin/seasons');
  });

  it('returns the intended path when allowlisted (event)', () => {
    expect(resolveLoginRedirect('/events/abc')).toBe('/events/abc');
  });

  it('returns / when intended path is not allowlisted', () => {
    expect(resolveLoginRedirect('/random/path')).toBe('/');
  });

  it('returns / when intended path is empty', () => {
    expect(resolveLoginRedirect('')).toBe('/');
  });

  it('returns / when intended path is null', () => {
    expect(resolveLoginRedirect(null)).toBe('/');
  });

  it('returns / when intended path is undefined', () => {
    expect(resolveLoginRedirect(undefined)).toBe('/');
  });
});
