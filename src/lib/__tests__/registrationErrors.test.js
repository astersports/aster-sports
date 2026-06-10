import { describe, expect, it } from 'vitest';
import { registrationErrorInfo } from '../registrationErrors';

// B3 — the 9-code microcopy map. Each known RPC code resolves to warm, actionable
// copy; grade/gender failures carry routeTo='player'; an unknown error falls back.
describe('registrationErrorInfo', () => {
  it('maps each of the 7 server-raised codes + 2 special codes to non-empty copy', () => {
    const codes = [
      'registration_closed', 'no_children', 'too_many_children', 'guardian_email_required',
      'invalid_division', 'grade_below_band', 'grade_above_band', 'gender_mismatch', 'already_registered',
    ];
    for (const c of codes) {
      const info = registrationErrorInfo({ message: c });
      expect(info.code).toBe(c);
      expect(info.message.length).toBeGreaterThan(10);
    }
  });

  it('matches the code as a substring of the raw Postgres error text', () => {
    const info = registrationErrorInfo({ message: 'ERROR: grade_above_band (SQLSTATE P0001)' });
    expect(info.code).toBe('grade_above_band');
    expect(info.routeTo).toBe('player');
  });

  it('routes only grade/gender failures back to the player step', () => {
    expect(registrationErrorInfo({ message: 'grade_below_band' }).routeTo).toBe('player');
    expect(registrationErrorInfo({ message: 'gender_mismatch' }).routeTo).toBe('player');
    expect(registrationErrorInfo({ message: 'guardian_email_required' }).routeTo).toBeUndefined();
  });

  it('accepts a raw string as well as an error object', () => {
    expect(registrationErrorInfo('no_children').code).toBe('no_children');
  });

  it('falls back to generic copy for an unknown / network error', () => {
    const info = registrationErrorInfo({ message: 'TypeError: failed to fetch' });
    expect(info.code).toBeNull();
    expect(info.message).toMatch(/try again/i);
  });
});
