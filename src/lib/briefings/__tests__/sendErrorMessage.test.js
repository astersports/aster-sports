import { describe, expect, it } from 'vitest';
import { friendlySendError } from '../sendErrorMessage';
import { NoRecipientsError } from '../../engine/resolvers/registry';

describe('friendlySendError (DEF-8b graceful-skip boundary)', () => {
  it('translates NoRecipientsError to kind, tenant-agnostic microcopy', () => {
    const msg = friendlySendError(new NoRecipientsError('academy_callup_notice', { eventId: 'e1' }));
    expect(msg).toBe('No families to notify yet. Designate a pilot test family to test, or this sends at cutover.');
    // tenant-agnostic: no org-specific literal (DEF-13)
    expect(msg).not.toMatch(/aster aau|futures academy/i);
  });

  it('returns null for unknown errors so callers keep their existing fallback', () => {
    expect(friendlySendError(new Error('boom'))).toBeNull();
    expect(friendlySendError(null)).toBeNull();
    expect(friendlySendError(undefined)).toBeNull();
  });
});
