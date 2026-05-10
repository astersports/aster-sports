// Wave 4.2-A-8c — sendAcademyCallupNotice integration tests. Mocks
// the registry resolver + queueComposedMessages + supabase client so
// we exercise the per-slice loop, per-(player, guardian) mint, and
// substitution paths without DB IO. Real composeAcademyCallupNotice
// runs (per the wave-4.2-A-7 pure-compose contract) so the
// callup_response sections are real.

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../briefings/queueComposedMessages', () => ({
  queueComposedMessages: vi.fn(() => Promise.resolve({ audienceCount: 0, adminBcc: true })),
}));

const baseContext = {
  org: { id: 'o-1', name: 'X', branding: { eyebrowLink: '#', contactEmail: 'x@x', logoUrl: '' }, coaches: [] },
  event: { id: 'e-1', title: 'Game vs Mavs', team_id: 't-1', start_at: '2026-05-12T00:00:00Z' },
  receiving_team: { id: 't-1', name: '10U Black', team_color: '#000' },
  home_team: { id: 't-2', name: 'Futures Academy', team_color: '#fff' },
  location: null,
  player: { id: 'p-1', first_name: 'Jake', last_name: 'Perkiel', grade: 4, member_type: 'futures_academy' },
  urgency: { day_label: 'Tomorrow', time_label: '7:35 PM', time_range_label: '7:35 PM' },
  response: { window_label: 'Respond by noon', deadline_at: '2026-05-11T16:00:00Z' },
};
const slice = (gid, email) => ({ kind: 'family', guardian_id: gid, email, player_id: 'p-1', kid_first_name: 'Jake', team_id: 't-1' });

vi.mock('../engine/resolvers/registry', async () => {
  const actual = await vi.importActual('../engine/resolvers/registry');
  return {
    ...actual,
    RESOLVER_REGISTRY: {
      ...actual.RESOLVER_REGISTRY,
      academy_callup_notice: { ...actual.RESOLVER_REGISTRY.academy_callup_notice, resolve: vi.fn() },
    },
  };
});

const { sendAcademyCallupNotice } = await import('../academyCallupSend');
const { queueComposedMessages } = await import('../briefings/queueComposedMessages');
const { NoRecipientsError, RESOLVER_REGISTRY } = await import('../engine/resolvers/registry');

function mockSupabase({ mintError = false } = {}) {
  const chain = (table) => {
    const c = {
      insert: vi.fn(() => c),
      select: vi.fn(() => c),
      single: vi.fn(() => Promise.resolve({ data: { id: `${table}-row-1` }, error: null })),
      update: vi.fn(() => c),
      eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
    };
    return c;
  };
  return {
    from: vi.fn((t) => chain(t)),
    rpc: vi.fn((name, args) => mintError
      ? Promise.resolve({ data: null, error: { message: 'rpc-failed' } })
      : Promise.resolve({ data: `mock-${name}-${args.p_player_id}-${args.p_response}-${args.p_guardian_id}`, error: null })),
    functions: { invoke: vi.fn(() => Promise.resolve({ data: {}, error: null })) },
  };
}

const baseState = () => ({ kind: 'academy_callup_notice', anchor_kind: 'event', anchor_id: 'e-1', audience_filter: { player_ids: ['p-1'] }, body: {}, signoff_message: '', test_only: false, pilot_only: false });

beforeEach(() => { vi.clearAllMocks(); });

describe('sendAcademyCallupNotice — integration', () => {
  it('1. single-guardian: 1 message queued, callup_response has substituted urls', async () => {
    RESOLVER_REGISTRY.academy_callup_notice.resolve.mockResolvedValueOnce({ context: baseContext, slices: [slice('g1', 'g1@x')] });
    await sendAcademyCallupNotice({ state: baseState(), supabase: mockSupabase(), now: new Date('2026-05-10T14:00:00Z') });
    const arg = queueComposedMessages.mock.calls[0][0];
    expect(arg.messages).toHaveLength(1);
    const sections = arg.messages[0].content_sections;
    const callupReq = sections.filter((s) => s.kind === 'callup_response');
    expect(callupReq).toHaveLength(1);
    expect(callupReq[0].callup_token_urls.accept).toContain('mock-mint_callup_token-p-1-accept');
    expect(callupReq[0].callup_token_urls.accept).toContain('functions/v1/callup-token-handler');
    expect(callupReq[0].callup_token_urls.accept).toContain('action=accept');
    expect(callupReq[0].callup_token_placeholders).toBeUndefined();
    // adminSample preserves placeholders.
    expect(arg.adminSample.content_sections.find((s) => s.kind === 'callup_response').callup_token_placeholders).toBeTruthy();
  });

  it('2. two guardians: 2 messages with their own substituted urls (distinct nonces in mock differ by guardian)', async () => {
    RESOLVER_REGISTRY.academy_callup_notice.resolve.mockResolvedValueOnce({
      context: baseContext,
      slices: [slice('g1', 'g1@x'), slice('g2', 'g2@x')],
    });
    await sendAcademyCallupNotice({ state: baseState(), supabase: mockSupabase(), now: new Date('2026-05-10T14:00:00Z') });
    const arg = queueComposedMessages.mock.calls[0][0];
    expect(arg.messages).toHaveLength(2);
    const g1Section = arg.messages[0].content_sections.find((s) => s.kind === 'callup_response');
    const g2Section = arg.messages[1].content_sections.find((s) => s.kind === 'callup_response');
    expect(g1Section.callup_token_urls.accept).toContain('g1');
    expect(g2Section.callup_token_urls.accept).toContain('g2');
    expect(g1Section.callup_token_urls.accept).not.toBe(g2Section.callup_token_urls.accept);
  });

  it('3. NoRecipientsError when slices empty (no queue, no INSERT)', async () => {
    RESOLVER_REGISTRY.academy_callup_notice.resolve.mockResolvedValueOnce({ context: baseContext, slices: [] });
    const supa = mockSupabase();
    await expect(sendAcademyCallupNotice({ state: baseState(), supabase: supa, now: new Date('2026-05-10T14:00:00Z') }))
      .rejects.toBeInstanceOf(NoRecipientsError);
    expect(queueComposedMessages).not.toHaveBeenCalled();
    expect(supa.from).not.toHaveBeenCalled();
  });

  it('4. mint_callup_token RPC error propagates and aborts', async () => {
    RESOLVER_REGISTRY.academy_callup_notice.resolve.mockResolvedValueOnce({ context: baseContext, slices: [slice('g1', 'g1@x')] });
    await expect(sendAcademyCallupNotice({ state: baseState(), supabase: mockSupabase({ mintError: true }), now: new Date('2026-05-10T14:00:00Z') }))
      .rejects.toThrow(/mint_callup_token failed: rpc-failed/);
    expect(queueComposedMessages).not.toHaveBeenCalled();
  });
});
