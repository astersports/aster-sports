// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { rsvpMinGoingThreshold, rsvpNudgesEnabled } from '../../lib/cron/rsvpNudgeThreshold';

let selectResult = { data: { auto_notifications: {} }, error: null };
let rpcResult = { data: {}, error: null };
const rpcSpy = vi.fn();
const fromSpy = vi.fn();

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: (...a) => {
      fromSpy(...a);
      const chain = {
        select: () => chain,
        eq: () => chain,
        maybeSingle: () => Promise.resolve(selectResult),
      };
      return chain;
    },
    rpc: (...a) => { rpcSpy(...a); return Promise.resolve(rpcResult); },
  },
}));

vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ orgId: 'org-1' }) }));
vi.mock('../../lib/reportError', () => ({ reportError: vi.fn() }));

const { useOrgAutoNotifications } = await import('../useOrgAutoNotifications');

afterEach(() => { cleanup(); vi.clearAllMocks(); });
beforeEach(() => {
  selectResult = { data: { auto_notifications: {} }, error: null };
  rpcResult = { data: {}, error: null };
});

describe('useOrgAutoNotifications', () => {
  it('empty config → reminders ON, nudges OFF, floor 5 (matches the cron defaults)', async () => {
    const { result } = renderHook(() => useOrgAutoNotifications());
    await waitFor(() => expect(result.current.config).not.toBeNull());
    expect(result.current.remindersOn).toBe(true);
    expect(result.current.nudgesOn).toBe(false);
    expect(result.current.minGoing).toBe(5);
  });

  it('reflects explicitly-set values', async () => {
    selectResult = { data: { auto_notifications: { reminders_enabled: false, rsvp_nudges_enabled: true, rsvp_min_going: 8 } }, error: null };
    const { result } = renderHook(() => useOrgAutoNotifications());
    await waitFor(() => expect(result.current.config).not.toBeNull());
    expect(result.current.remindersOn).toBe(false);
    expect(result.current.nudgesOn).toBe(true);
    expect(result.current.minGoing).toBe(8);
  });

  it('AP#43 invariant: nudge reads come from the SAME cron helpers (no drift)', async () => {
    const cfg = { rsvp_nudges_enabled: true, rsvp_min_going: 9 };
    selectResult = { data: { auto_notifications: cfg }, error: null };
    const { result } = renderHook(() => useOrgAutoNotifications());
    await waitFor(() => expect(result.current.config).not.toBeNull());
    expect(result.current.nudgesOn).toBe(rsvpNudgesEnabled(cfg));
    expect(result.current.minGoing).toBe(rsvpMinGoingThreshold(cfg));
  });

  it('save() writes via the admin-gated RPC with a merged patch — NOT a direct table update', async () => {
    const { result } = renderHook(() => useOrgAutoNotifications());
    await waitFor(() => expect(result.current.config).not.toBeNull());
    fromSpy.mockClear(); // ignore the read-phase from('organizations')

    let res;
    await act(async () => {
      res = await result.current.save({ reminders_enabled: true, rsvp_nudges_enabled: true, rsvp_min_going: 6 });
    });

    expect(res).toEqual({ ok: true });
    expect(rpcSpy).toHaveBeenCalledWith('set_org_auto_notifications', {
      p_org_id: 'org-1',
      p_patch: { reminders_enabled: true, rsvp_nudges_enabled: true, rsvp_min_going: 6 },
    });
    // The write path is the RPC, never a supabase.from(...).update() chain.
    expect(fromSpy).not.toHaveBeenCalled();
  });

  it('save() returns { ok: false } on RPC error', async () => {
    const { result } = renderHook(() => useOrgAutoNotifications());
    await waitFor(() => expect(result.current.config).not.toBeNull());
    rpcResult = { data: null, error: { message: 'not authorized' } };
    let res;
    await act(async () => { res = await result.current.save({ rsvp_nudges_enabled: true }); });
    expect(res).toEqual({ ok: false });
  });
});
