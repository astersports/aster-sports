// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';

let selectResult = { data: null, error: null };
let updateResult = { error: null };
const updateSpy = vi.fn();
const eqUpdateSpy = vi.fn();

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: () => ({
      // read chain: .select().eq().maybeSingle()
      select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve(selectResult) }) }),
      // write chain: .update().eq()
      update: (patch) => { updateSpy(patch); return { eq: (...a) => { eqUpdateSpy(...a); return Promise.resolve(updateResult); } }; },
    }),
  },
}));
vi.mock('../../lib/reportError', () => ({ reportError: vi.fn() }));

const { useOrgSettings } = await import('../useOrgSettings');

afterEach(() => { cleanup(); vi.clearAllMocks(); });
beforeEach(() => {
  selectResult = { data: { from_name: 'Legacy Hoopers', from_email: 'admin@lh.org', reply_to_email: 'reply@lh.org', pilot_mode_enabled: false }, error: null };
  updateResult = { error: null };
});

describe('useOrgSettings', () => {
  it('reads the sender + pilot fields off organization_settings', async () => {
    const { result } = renderHook(() => useOrgSettings('org-1'));
    await waitFor(() => expect(result.current.settings).not.toBeNull());
    expect(result.current.settings.from_name).toBe('Legacy Hoopers');
    expect(result.current.settings.from_email).toBe('admin@lh.org');
    expect(result.current.pilotModeEnabled).toBe(false);
  });

  it('pilotModeEnabled fails closed (ON) when the row is missing', async () => {
    selectResult = { data: null, error: null };
    const { result } = renderHook(() => useOrgSettings('org-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.pilotModeEnabled).toBe(true);
  });

  it('save() UPDATEs organization_settings with the patch and merges locally', async () => {
    const { result } = renderHook(() => useOrgSettings('org-1'));
    await waitFor(() => expect(result.current.settings).not.toBeNull());
    let res;
    await act(async () => {
      res = await result.current.save({ from_name: 'New Name', from_email: 'new@lh.org', reply_to_email: null });
    });
    expect(res).toEqual({ ok: true });
    expect(updateSpy).toHaveBeenCalledWith({ from_name: 'New Name', from_email: 'new@lh.org', reply_to_email: null });
    expect(eqUpdateSpy).toHaveBeenCalledWith('organization_id', 'org-1');
    // local merge so the page summary updates without a refetch
    expect(result.current.settings.from_name).toBe('New Name');
  });

  it('save() returns { ok: false } on update error and does not merge', async () => {
    const { result } = renderHook(() => useOrgSettings('org-1'));
    await waitFor(() => expect(result.current.settings).not.toBeNull());
    updateResult = { error: { message: 'denied' } };
    let res;
    await act(async () => { res = await result.current.save({ from_name: 'X' }); });
    expect(res).toEqual({ ok: false });
    expect(result.current.settings.from_name).toBe('Legacy Hoopers');
  });
});
