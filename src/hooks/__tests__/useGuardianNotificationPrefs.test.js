// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({ guardianId: 'g-1', selectResult: { data: null, error: null }, upsertResult: { error: null }, upsertSpy: vi.fn() }));
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve(h.selectResult) }) }),
      upsert: (...a) => { h.upsertSpy(...a); return Promise.resolve(h.upsertResult); },
    }),
  },
}));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ guardianId: h.guardianId }) }));
vi.mock('../../lib/reportError', () => ({ reportError: vi.fn() }));
const { useGuardianNotificationPrefs } = await import('../useGuardianNotificationPrefs');

const ALL_ON = { receive_weekly_digest: true, receive_tournament_briefings: true, receive_game_recaps: true, receive_org_announcements: true };
afterEach(() => { cleanup(); vi.clearAllMocks(); });
beforeEach(() => { h.guardianId = 'g-1'; h.selectResult = { data: null, error: null }; h.upsertResult = { error: null }; });

describe('useGuardianNotificationPrefs', () => {
  it('greenfield (no row) → all-ON defaults', async () => {
    const { result } = renderHook(() => useGuardianNotificationPrefs());
    await waitFor(() => expect(result.current.prefs).not.toBeNull());
    expect(result.current.prefs).toEqual(ALL_ON);
    expect(result.current.isGuardian).toBe(true);
  });

  it('reflects an existing row', async () => {
    h.selectResult = { data: { ...ALL_ON, receive_weekly_digest: false }, error: null };
    const { result } = renderHook(() => useGuardianNotificationPrefs());
    await waitFor(() => expect(result.current.prefs).not.toBeNull());
    expect(result.current.prefs.receive_weekly_digest).toBe(false);
  });

  it('save() UPSERTs by guardian_id (the row may not exist yet)', async () => {
    const { result } = renderHook(() => useGuardianNotificationPrefs());
    await waitFor(() => expect(result.current.prefs).not.toBeNull());
    let res;
    await act(async () => { res = await result.current.save({ ...ALL_ON, receive_weekly_digest: false }); });
    expect(res).toEqual({ ok: true });
    expect(h.upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ guardian_id: 'g-1', receive_weekly_digest: false }),
      { onConflict: 'guardian_id' },
    );
  });

  it('non-guardian → isGuardian false, prefs null (the group hides)', async () => {
    h.guardianId = null;
    const { result } = renderHook(() => useGuardianNotificationPrefs());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isGuardian).toBe(false);
    expect(result.current.prefs).toBeNull();
  });
});
