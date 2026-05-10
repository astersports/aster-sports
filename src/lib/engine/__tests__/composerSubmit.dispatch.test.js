// Wave 4.2-A-8a — composerSubmit dispatch tests. Verifies the
// 5-branch routing in submitBriefing: registry path for the 4
// migrated kinds (game_recap, tournament_prelim, tournament_recap,
// schedule_change), legacy path for free-form kinds (announcement,
// custom_message), short-circuit for rsvp_nudge, blocked path for
// academy_callup_notice, and wrong-call-site guards for kinds that
// don't dispatch through composerSubmit (weekly_digest).

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../supabase', () => {
  const chain = {};
  Object.assign(chain, {
    select: () => chain, eq: () => chain, update: () => chain,
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
  });
  return { supabase: { from: () => chain, functions: { invoke: () => Promise.resolve({ data: {}, error: null }) } } };
});
vi.mock('../../briefings/queueRecipients', () => ({
  queueRecipients: vi.fn(() => Promise.resolve({ audienceCount: 3, adminBcc: true })),
}));
vi.mock('../../briefings/recipientFilter', () => ({
  resolveAudience: vi.fn(() => Promise.resolve({ teamIds: ['t-1'], audience: [{ guardian_id: 'g1', email: 'g1@x' }] })),
}));
vi.mock('../../rsvpNudgeSend', () => ({
  sendRsvpNudge: vi.fn(() => Promise.resolve({ audienceCount: 4 })),
}));
vi.mock('../composer', () => ({
  compose: vi.fn(() => ({ subject: 'Legacy', html: '<p>L</p>', plainText: 'L', content_sections: [{ kind: 'header' }] })),
  renderSections: vi.fn(() => '<inner/>'),
  renderSectionsPlainText: vi.fn(() => 'inner'),
}));
vi.mock('../resolvers/registry', async () => {
  const actual = await vi.importActual('../resolvers/registry');
  const resolve = vi.fn(() => Promise.resolve({ context: { ok: true }, slices: [{ guardian_id: 'g1' }] }));
  const compose = vi.fn(() => ({ subject: 'S', content_sections: [{ kind: 'header' }] }));
  const swap = (kind) => ({ ...actual.RESOLVER_REGISTRY[kind], resolve, compose });
  return {
    ...actual,
    RESOLVER_REGISTRY: {
      ...actual.RESOLVER_REGISTRY,
      game_recap: swap('game_recap'),
      tournament_prelim: swap('tournament_prelim'),
      tournament_recap: swap('tournament_recap'),
      schedule_change: swap('schedule_change'),
    },
  };
});

const { submitBriefing } = await import('../../../components/briefings/composerSubmit');
const { queueRecipients } = await import('../../briefings/queueRecipients');
const { resolveAudience } = await import('../../briefings/recipientFilter');
const { sendRsvpNudge } = await import('../../rsvpNudgeSend');
const { compose } = await import('../composer');
const { NoCallupTokenInfrastructureError, RESOLVER_REGISTRY } = await import('../resolvers/registry');

const baseDraft = () => ({
  submitSend: vi.fn(() => Promise.resolve({ id: 'm-1' })),
  submitSchedule: vi.fn(() => Promise.resolve({ id: 'm-2' })),
});
const baseArgs = (overrides = {}) => ({
  state: {
    kind: 'game_recap', anchor_kind: 'event', anchor_id: 'e-1',
    audience_type: 'event_attendees', audience_filter: {},
    body: { coach_note: 'ok' }, signoff_message: 'thanks',
    send_mode: 'now', test_only: false, pilot_only: false, ...overrides,
  },
  draft: baseDraft(), orgId: 'o-1', recipients: [], coaches: [], pilotModeEnabled: false,
});

beforeEach(() => { vi.clearAllMocks(); });

describe('composerSubmit dispatch — wave 4.2-A-8a', () => {
  it.each(['game_recap', 'tournament_prelim', 'tournament_recap', 'schedule_change'])(
    '%s -> registry resolve+compose -> draft.submitSend -> queueRecipients',
    async (kind) => {
      const args = baseArgs({ kind, anchor_kind: kind === 'tournament_prelim' || kind === 'tournament_recap' ? 'tournament' : 'event' });
      const entry = RESOLVER_REGISTRY[kind];
      const r = await submitBriefing(args);
      expect(entry.resolve).toHaveBeenCalledOnce();
      expect(entry.compose).toHaveBeenCalledOnce();
      expect(args.draft.submitSend).toHaveBeenCalledOnce();
      expect(resolveAudience).toHaveBeenCalledOnce();
      expect(queueRecipients).toHaveBeenCalledOnce();
      expect(r).toEqual({ sent: true, audienceCount: 3 });
    }
  );

  it('announcement (free-form) -> legacy compose path', async () => {
    const args = baseArgs({ kind: 'announcement' });
    const r = await submitBriefing(args);
    expect(compose).toHaveBeenCalledWith(expect.objectContaining({ kind: 'announcement' }));
    expect(args.draft.submitSend).toHaveBeenCalledOnce();
    expect(r.sent).toBe(true);
  });

  it('custom_message (free-form) -> legacy compose path', async () => {
    const args = baseArgs({ kind: 'custom_message' });
    await submitBriefing(args);
    expect(compose).toHaveBeenCalledWith(expect.objectContaining({ kind: 'custom_message' }));
  });

  it('academy_callup_notice -> NoCallupTokenInfrastructureError, no submitSend', async () => {
    const args = baseArgs({ kind: 'academy_callup_notice' });
    await expect(submitBriefing(args)).rejects.toBeInstanceOf(NoCallupTokenInfrastructureError);
    expect(args.draft.submitSend).not.toHaveBeenCalled();
    expect(queueRecipients).not.toHaveBeenCalled();
  });

  it('weekly_digest -> throws (wrong call site; routes through digestSend)', async () => {
    const args = baseArgs({ kind: 'weekly_digest' });
    await expect(submitBriefing(args)).rejects.toThrow(/digestSend/);
    expect(args.draft.submitSend).not.toHaveBeenCalled();
  });

  it('rsvp_nudge with event anchor -> short-circuits to sendRsvpNudge', async () => {
    const args = baseArgs({ kind: 'rsvp_nudge', anchor_kind: 'event', anchor_id: 'e-1' });
    const r = await submitBriefing(args);
    expect(sendRsvpNudge).toHaveBeenCalledOnce();
    expect(args.draft.submitSend).not.toHaveBeenCalled();
    expect(r).toEqual({ audienceCount: 4 });
  });

  it('NoRecipientsError when registry.resolve returns 0 slices', async () => {
    RESOLVER_REGISTRY.game_recap.resolve.mockResolvedValueOnce({ context: {}, slices: [] });
    const args = baseArgs({ kind: 'game_recap' });
    await expect(submitBriefing(args)).rejects.toThrow(/No recipients for game_recap/);
    const draft = args.draft;
    expect(draft.submitSend).not.toHaveBeenCalled();
    expect(queueRecipients).not.toHaveBeenCalled();
  });
});
