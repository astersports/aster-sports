// @vitest-environment jsdom
//
// COMPOSE-FRONT P1 — useResolvedAudienceCount resolves the recipient count for
// the async audience types (event/tournament/multi_event/player_specific) via
// the SAME resolveAudience the send pipeline uses, and short-circuits for the
// synchronously-derivable types (count stays null → caller uses the sync path).

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';

const resolveAudience = vi.fn();
vi.mock('../../lib/briefings/recipientFilter', () => ({ resolveAudience: (...a) => resolveAudience(...a) }));

const { useResolvedAudienceCount } = await import('../useResolvedAudienceCount');

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('useResolvedAudienceCount', () => {
  it('resolves the count for event_attendees via resolveAudience', async () => {
    resolveAudience.mockResolvedValue({ audience: [{}, {}, {}], teamIds: ['t1'] });
    const { result } = renderHook(() => useResolvedAudienceCount({
      recipients: [], audienceType: 'event_attendees', audienceFilter: null, anchorId: 'e-1',
    }));
    await waitFor(() => expect(result.current.count).toBe(3));
    expect(result.current.resolving).toBe(false);
    expect(resolveAudience).toHaveBeenCalled();
  });

  it('does NOT resolve for a sync type (org_all) — count stays null', async () => {
    const { result } = renderHook(() => useResolvedAudienceCount({
      recipients: [], audienceType: 'org_all', audienceFilter: null, anchorId: null,
    }));
    await waitFor(() => expect(result.current.count).toBe(null));
    expect(resolveAudience).not.toHaveBeenCalled();
  });

  it('surfaces an error from resolveAudience (count null, gate stays blocked)', async () => {
    resolveAudience.mockRejectedValue(new Error('lookup failed'));
    const { result } = renderHook(() => useResolvedAudienceCount({
      recipients: [], audienceType: 'tournament_attendees', audienceFilter: null, anchorId: 'trn-1',
    }));
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.count).toBe(null);
  });
});
