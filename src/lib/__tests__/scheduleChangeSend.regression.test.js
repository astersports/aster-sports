// Wave 4.4-T0d regression test — pre-fix this asserts the silent failure
// reproduces; post-fix it asserts the function completes end-to-end.
//
// The bug: scheduleChangeSend.js called compose({kind:'schedule_change'})
// but Wave 4.2-A-8a removed that entry from KIND_COMPOSERS. Every send
// threw "No engine composer for kind 'schedule_change'", caught silently
// by useScheduleChangeAudit:55. Audit rows wrote dispatch_email_id=NULL.
// Parents received nothing for weeks. This test exists so the next
// registry-removal-without-caller-migration doesn't slip through again.

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../unsubscribeUrl', () => ({
  applyUnsubscribeUrls: vi.fn((rows) => Promise.resolve(rows)),
}));

vi.mock('../engine/resolvers/registry', async () => {
  const actual = await vi.importActual('../engine/resolvers/registry');
  return {
    ...actual,
    RESOLVER_REGISTRY: {
      ...actual.RESOLVER_REGISTRY,
      schedule_change: { ...actual.RESOLVER_REGISTRY.schedule_change, resolve: vi.fn() },
    },
  };
});

const baseContext = {
  org: { id: 'o-1', name: 'Aster AAU', branding: { eyebrowLink: '#', contactEmail: 'x@x', logoUrl: '' }, coaches: [], voice_config: null, brand_colors: null },
  event: { id: 'e-1', title: 'Practice', team_id: 't-1', event_type: 'practice', start_at: '2026-05-12T23:35:00Z', end_at: '2026-05-13T00:35:00Z', location: 'WCC', location_id: null, opponent: null, status: 'scheduled', publish_status: 'published', teams: { id: 't-1', name: '10U Black', team_color: '#000', sort_order: 2, org_id: 'o-1' } },
  team: { id: 't-1', name: '10U Black', team_color: '#000', sort_order: 2 },
  location: null,
  audit: { id: 'a-1', event_id: 'e-1', changed_at: '2026-05-11T18:00:00Z', change_kind: 'time', before_jsonb: { start_at: '2026-05-12T22:35:00Z', end_at: '2026-05-13T00:35:00Z' }, after_jsonb: { start_at: '2026-05-12T23:35:00Z', end_at: '2026-05-13T00:35:00Z' } },
  diff: { changed_fields: ['start_at'], before_normalized: {}, after_normalized: {} },
};

const slice1 = { kind: 'family', guardian_id: 'g1', email: 'g1@x', kid_first_names: ['Hudson'], team_id: 't-1' };

function makeSupabase() {
  const tableChain = (table) => {
    const chain = {
      insert: vi.fn(() => chain),
      select: vi.fn(() => chain),
      single: vi.fn(() => Promise.resolve({ data: { id: `${table}-row-1` }, error: null })),
      update: vi.fn(() => chain),
      eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
    };
    return chain;
  };
  return {
    from: vi.fn((t) => tableChain(t)),
    rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
    functions: { invoke: vi.fn(() => Promise.resolve({ data: { ok: true, sent: 1, failed: 0 }, error: null })) },
  };
}

const { sendScheduleChange } = await import('../scheduleChangeSend');
const { RESOLVER_REGISTRY } = await import('../engine/resolvers/registry');

const baseState = (overrides = {}) => ({
  kind: 'schedule_change', anchor_kind: 'event', anchor_id: 'e-1',
  body: {}, signoff_message: '', test_only: false, pilot_only: false,
  ...overrides,
});

beforeEach(() => { vi.clearAllMocks(); });

describe('sendScheduleChange — T0d regression (no compose() throw)', () => {
  it('1. completes end-to-end and returns a messageId', async () => {
    RESOLVER_REGISTRY.schedule_change.resolve.mockResolvedValueOnce({ context: baseContext, slices: [slice1] });
    const result = await sendScheduleChange({ state: baseState(), supabase: makeSupabase(), now: new Date('2026-05-11T18:00:00Z') });
    expect(result).toBeDefined();
    expect(result.messageId).toBeTruthy();
    expect(result.audienceCount).toBe(1);
  });

  it('2. dispatch invokes send-tournament-message edge function', async () => {
    RESOLVER_REGISTRY.schedule_change.resolve.mockResolvedValueOnce({ context: baseContext, slices: [slice1] });
    const supa = makeSupabase();
    await sendScheduleChange({ state: baseState(), supabase: supa, now: new Date('2026-05-11T18:00:00Z') });
    expect(supa.functions.invoke).toHaveBeenCalledWith('send-tournament-message', expect.objectContaining({ body: expect.objectContaining({ message_id: expect.any(String) }) }));
  });

  it('3. F-DUAL-FINALIZE: does NOT client-write status=sent (edge fn owns finalize)', async () => {
    RESOLVER_REGISTRY.schedule_change.resolve.mockResolvedValueOnce({ context: baseContext, slices: [slice1] });
    const supa = makeSupabase();
    await sendScheduleChange({ state: baseState(), supabase: supa, now: new Date('2026-05-11T18:00:00Z') });
    // The helper no longer writes status='sent' — that's the edge fn's job. A
    // client write would force-finalize a partial send and 409-lock recovery.
    const updateCalls = supa.from.mock.results
      .filter((r, i) => supa.from.mock.calls[i][0] === 'comms_messages')
      .flatMap((r) => r.value.update.mock.calls);
    const sentCall = updateCalls.find((c) => c[0]?.status === 'sent');
    expect(sentCall).toBeFalsy();
  });

  it('4. does NOT throw "No engine composer for kind" — the bug', async () => {
    RESOLVER_REGISTRY.schedule_change.resolve.mockResolvedValueOnce({ context: baseContext, slices: [slice1] });
    await expect(sendScheduleChange({ state: baseState(), supabase: makeSupabase(), now: new Date('2026-05-11T18:00:00Z') }))
      .resolves.not.toThrow();
  });
});
