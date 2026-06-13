// Wave 4.2-A-8b-b — sendRsvpNudge integration tests. Mocks the
// registry resolver + queueComposedMessages + supabase client so we
// exercise the per-slice loop, per-kid mint, and substitution paths
// without DB IO. Real composeRsvpNudge runs (per the wave-4.2-A-6
// pure-compose contract) so the rsvp_request sections are real.

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../briefings/queueComposedMessages', () => ({
  queueComposedMessages: vi.fn(() => Promise.resolve({ audienceCount: 0, adminBcc: true })),
}));
const baseContext = { org: { id: 'o-1', name: 'X', branding: { eyebrowLink: '#', contactEmail: 'x@x', logoUrl: '' }, coaches: [] }, event: { id: 'e-1', title: 'Skills Lab', team_id: 't-1', start_at: '2026-05-12T00:00:00Z' }, team: { id: 't-1', name: '10U Black', team_color: '#000' }, location: null, urgency: { day_label: 'Tomorrow', time_label: '7:35 PM', time_range_label: '7:35 PM' }, rsvp_summary: { total_roster: 1, responded_count: 0, unresponded_count: 1 } };
const sliceWithKids = (gid, email, kids) => ({ kind: 'family', guardian_id: gid, email, team_id: 't-1', unresponded_kids: kids });

vi.mock('../engine/resolvers/registry', async () => {
  const actual = await vi.importActual('../engine/resolvers/registry');
  return {
    ...actual,
    RESOLVER_REGISTRY: {
      ...actual.RESOLVER_REGISTRY,
      rsvp_nudge: { ...actual.RESOLVER_REGISTRY.rsvp_nudge, resolve: vi.fn() },
    },
  };
});

const { sendRsvpNudge, AlreadySentError } = await import('../rsvpNudgeSend');
const { queueComposedMessages } = await import('../briefings/queueComposedMessages');
const { NoRecipientsError, RESOLVER_REGISTRY } = await import('../engine/resolvers/registry');

function mockSupabase({ mintError = false, priorSent = null } = {}) {
  const tableChain = (table) => {
    const chain = {
      insert: vi.fn(() => chain),
      select: vi.fn(() => chain),
      single: vi.fn(() => Promise.resolve({ data: { id: `${table}-row-1` }, error: null })),
      update: vi.fn(() => chain),
      // F-1(a) dedup query is a chain ending in maybeSingle; priorSent
      // controls whether a prior sent nudge is "found".
      eq: vi.fn(() => chain),
      gte: vi.fn(() => chain),
      order: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      maybeSingle: vi.fn(() => Promise.resolve({ data: priorSent, error: null })),
    };
    return chain;
  };
  return {
    from: vi.fn((t) => tableChain(t)),
    rpc: vi.fn((name, args) => mintError
      ? Promise.resolve({ data: null, error: { message: 'rpc-failed' } })
      : Promise.resolve({ data: `mock-${name}-${args.p_player_id}-${args.p_response}`, error: null })),
    functions: { invoke: vi.fn(() => Promise.resolve({ data: {}, error: null })) },
  };
}

const baseState = (overrides = {}) => ({ kind: 'rsvp_nudge', anchor_kind: 'event', anchor_id: 'e-1', body: {}, signoff_message: '', test_only: false, pilot_only: false, ...overrides });

beforeEach(() => { vi.clearAllMocks(); });

describe('sendRsvpNudge — integration', () => {
  it('1. single-kid family: 1 message queued, content_sections has substituted rsvp_token_urls', async () => {
    RESOLVER_REGISTRY.rsvp_nudge.resolve.mockResolvedValueOnce({
      context: baseContext,
      slices: [sliceWithKids('g1', 'g1@x', [{ player_id: 'p1', first_name: 'Hudson' }])],
    });
    await sendRsvpNudge({ state: baseState(), supabase: mockSupabase(), now: new Date('2026-05-10T14:00:00Z') });
    const arg = queueComposedMessages.mock.calls[0][0];
    expect(arg.messages).toHaveLength(1);
    const sections = arg.messages[0].content_sections;
    const rsvpReq = sections.filter((s) => s.kind === 'rsvp_request');
    expect(rsvpReq).toHaveLength(1);
    expect(rsvpReq[0].rsvp_token_urls.going).toContain('rsvp-token-handler');
    expect(rsvpReq[0].rsvp_token_urls.going).toContain('t=mock-mint_rsvp_token-p1-going');
    expect(rsvpReq[0].rsvp_token_urls.going).toContain('action=going');
    expect(rsvpReq[0].rsvp_token_placeholders).toBeUndefined();
    expect(arg.adminSample).toBeTruthy();
    expect(arg.adminSample.content_sections.find((s) => s.kind === 'rsvp_request').rsvp_token_placeholders).toBeTruthy();
  });

  it('2. multi-kid family: 3 rsvp_request sections each with own player_id-mapped tokens', async () => {
    RESOLVER_REGISTRY.rsvp_nudge.resolve.mockResolvedValueOnce({
      context: baseContext,
      slices: [sliceWithKids('g1', 'g1@x', [
        { player_id: 'p1', first_name: 'Aubtin' },
        { player_id: 'p2', first_name: 'Frankie' },
        { player_id: 'p3', first_name: 'Hudson' },
      ])],
    });
    await sendRsvpNudge({ state: baseState(), supabase: mockSupabase(), now: new Date('2026-05-10T14:00:00Z') });
    const arg = queueComposedMessages.mock.calls[0][0];
    const rsvpReq = arg.messages[0].content_sections.filter((s) => s.kind === 'rsvp_request');
    expect(rsvpReq).toHaveLength(3);
    expect(rsvpReq[0].kid_first_name).toBe('Aubtin');
    expect(rsvpReq[0].rsvp_token_urls.going).toContain('rsvp-token-handler');
    expect(rsvpReq[0].rsvp_token_urls.going).toContain('t=mock-mint_rsvp_token-p1-going');
    expect(rsvpReq[0].rsvp_token_urls.going).toContain('action=going');
    expect(rsvpReq[1].kid_first_name).toBe('Frankie');
    expect(rsvpReq[1].rsvp_token_urls.going).toContain('t=mock-mint_rsvp_token-p2-going');
    expect(rsvpReq[2].kid_first_name).toBe('Hudson');
    expect(rsvpReq[2].rsvp_token_urls.going).toContain('t=mock-mint_rsvp_token-p3-going');
  });

  it('3. NoRecipientsError when slices empty (no queue, no INSERT)', async () => {
    RESOLVER_REGISTRY.rsvp_nudge.resolve.mockResolvedValueOnce({ context: baseContext, slices: [] });
    const supa = mockSupabase();
    await expect(sendRsvpNudge({ state: baseState(), supabase: supa, now: new Date('2026-05-10T14:00:00Z') }))
      .rejects.toBeInstanceOf(NoRecipientsError);
    expect(queueComposedMessages).not.toHaveBeenCalled();
    expect(supa.from).not.toHaveBeenCalled();
  });

  it('4. mint_rsvp_token RPC error propagates and aborts the send', async () => {
    RESOLVER_REGISTRY.rsvp_nudge.resolve.mockResolvedValueOnce({
      context: baseContext,
      slices: [sliceWithKids('g1', 'g1@x', [{ player_id: 'p1', first_name: 'Hudson' }])],
    });
    await expect(sendRsvpNudge({ state: baseState(), supabase: mockSupabase({ mintError: true }), now: new Date('2026-05-10T14:00:00Z') }))
      .rejects.toThrow(/mint_rsvp_token failed: rpc-failed/);
    expect(queueComposedMessages).not.toHaveBeenCalled();
  });

  it('5. F-1(a) send-dedup: a prior sent nudge for the event short-circuits before mint/queue', async () => {
    RESOLVER_REGISTRY.rsvp_nudge.resolve.mockResolvedValueOnce({
      context: baseContext,
      slices: [sliceWithKids('g1', 'g1@x', [{ player_id: 'p1', first_name: 'Hudson' }])],
    });
    const supa = mockSupabase({ priorSent: { id: 'prior-msg', sent_at: '2026-05-10T13:00:00Z' } });
    await expect(sendRsvpNudge({ state: baseState(), supabase: supa, now: new Date('2026-05-10T14:00:00Z') }))
      .rejects.toBeInstanceOf(AlreadySentError);
    expect(supa.rpc).not.toHaveBeenCalled();          // no token mint
    expect(queueComposedMessages).not.toHaveBeenCalled(); // no queue, no dup row
  });
});
