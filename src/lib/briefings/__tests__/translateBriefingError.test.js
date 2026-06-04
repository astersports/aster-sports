import { describe, expect, it } from 'vitest';
import { translateBriefingError } from '../translateBriefingError';

describe('translateBriefingError (Phase 3 Meta / §16.3 microcopy)', () => {
  it('handles undefined / null gracefully', () => {
    expect(translateBriefingError(undefined)).toMatch(/Try again/);
    expect(translateBriefingError(null)).toMatch(/Try again/);
  });

  it('translates DIGEST_ALREADY_SENT (from digestSend D-1 c)', () => {
    const err = Object.assign(new Error('A weekly digest for the period starting 2026-06-01 is already scheduled or sent.'), { code: 'DIGEST_ALREADY_SENT' });
    expect(translateBriefingError(err)).toMatch(/inbox/);
    expect(translateBriefingError(err)).not.toMatch(/period starting/);
  });

  it('translates 23505 + weekly_digest_unique constraint name', () => {
    const err = { code: '23505', message: 'duplicate key value violates unique constraint "comms_messages_weekly_digest_unique"' };
    const out = translateBriefingError(err);
    expect(out).toMatch(/already a weekly digest/);
    expect(out).not.toMatch(/duplicate key/);
    expect(out).not.toMatch(/comms_messages_weekly_digest_unique/);
  });

  it('translates 23505 generically when constraint name does not match', () => {
    const err = { code: '23505', message: 'duplicate key value violates unique constraint "some_other_index"' };
    expect(translateBriefingError(err)).toMatch(/check your drafts/);
  });

  it('translates 23514 + audience_type_check', () => {
    const err = { code: '23514', message: 'new row violates check constraint "comms_messages_audience_type_check"' };
    const out = translateBriefingError(err);
    expect(out).toMatch(/audience isn't allowed/);
    expect(out).not.toMatch(/check constraint/);
  });

  it('translates 23514 + kind_check', () => {
    const err = { code: '23514', message: 'new row violates check constraint "comms_messages_kind_check"' };
    expect(translateBriefingError(err)).toMatch(/briefing kind isn't allowed/);
  });

  it('uses generic fallback for other 2xxxx Postgres error codes', () => {
    const err = { code: '23502', message: 'null value in column "x" violates not-null constraint' };
    expect(translateBriefingError(err)).toMatch(/Save failed/);
    expect(translateBriefingError(err)).not.toMatch(/null value/);
  });

  it('preserves message for non-Postgres errors', () => {
    expect(translateBriefingError(new Error('Network request failed'))).toBe('Network request failed');
  });

  it('falls back to friendly default when non-Postgres error message is empty', () => {
    expect(translateBriefingError(new Error(''))).toMatch(/Try again/);
  });
});
