// @vitest-environment jsdom
//
// SD-11 / §16.8 gate (SCHEDULE_L99_BUILD_SPEC §8 PR-B'): a staff RSVP
// write AFTER start_at logs an immutable event_rsvp_audit row (old/new
// response, actor). Pre-start staff writes do NOT log. Non-staff writes
// after start are blocked client-side (isRsvpOpen) before any request.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { useRsvps } from '../useRsvps';

const h = vi.hoisted(() => ({ calls: [] }));

vi.mock('../../lib/supabase', () => {
  const makeQuery = (table) => {
    const q = {};
    ['select', 'eq', 'in', 'order'].forEach((m) => { q[m] = () => q; });
    q.maybeSingle = () => Promise.resolve({ data: null, error: null });
    q.upsert = (payload) => { h.calls.push({ table, op: 'upsert', payload }); return { then: (r) => Promise.resolve({ error: null }).then(r) }; };
    q.insert = (payload) => { h.calls.push({ table, op: 'insert', payload }); return { then: (r) => Promise.resolve({ error: null }).then(r) }; };
    q.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
    return q;
  };
  return { supabase: { from: (t) => makeQuery(t) } };
});
vi.mock('../../context/useToast', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../lib/reportError', () => ({ reportError: vi.fn() }));

beforeEach(() => { h.calls.length = 0; });
afterEach(cleanup);

const HOUR = 60 * 60 * 1000;
const staffOverride = (startAt) => ({ startAt, isStaff: true, actorUserId: 'u-staff', actorName: 'Coach Kenny' });

async function mount(override) {
  const hook = renderHook(() => useRsvps('e-1', 't-1', override));
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

describe('useRsvps — SD-11 override audit', () => {
  it('staff write AFTER start logs an event_rsvp_audit row with actor + old/new', async () => {
    const { result } = await mount(staffOverride(new Date(Date.now() - HOUR).toISOString()));
    await act(async () => { expect(await result.current.setRsvp('p-1', 'going')).toBe(true); });
    const audit = h.calls.find((c) => c.table === 'event_rsvp_audit' && c.op === 'insert');
    expect(audit).toBeTruthy();
    expect(audit.payload).toMatchObject({
      event_id: 'e-1', player_id: 'p-1', actor_user_id: 'u-staff',
      actor_name: 'Coach Kenny', old_response: null, new_response: 'going',
    });
  });

  it('staff write BEFORE start does NOT log', async () => {
    const { result } = await mount(staffOverride(new Date(Date.now() + HOUR).toISOString()));
    await act(async () => { await result.current.setRsvp('p-1', 'going'); });
    expect(h.calls.some((c) => c.table === 'event_rsvps' && c.op === 'upsert')).toBe(true);
    expect(h.calls.some((c) => c.table === 'event_rsvp_audit')).toBe(false);
  });

  it('non-staff write AFTER start is blocked before any request', async () => {
    const { result } = await mount({ startAt: new Date(Date.now() - HOUR).toISOString(), isStaff: false });
    let ok;
    await act(async () => { ok = await result.current.setRsvp('p-1', 'going'); });
    expect(ok).toBe(false);
    expect(h.calls.some((c) => c.op === 'upsert' || c.op === 'insert')).toBe(false);
  });
});
