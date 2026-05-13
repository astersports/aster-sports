// Wave 4.2-A-8d (P0 hotfix) — wrapper-delegation test for the wizard send.
// The pure mapping function tests live in mapWizardStateToDigestArgs.test.js
// (split from this file for the 150-line cap).

import { describe, expect, it, vi } from 'vitest';

vi.mock('../../digestSend', () => ({ sendWeeklyDigest: vi.fn(() => Promise.resolve({ composedFamilies: 7 })) }));

const { sendWeeklyDigestFromWizard } = await import('../sendWeeklyDigestFromWizard');
const { sendWeeklyDigest } = await import('../../digestSend');

const { baseState, COACHES, ev, period, recip } = await import('./_sendWizardFixtures');

describe('sendWeeklyDigestFromWizard', () => {
  it('6. delegates to sendWeeklyDigest with mapped args', async () => {
    vi.clearAllMocks();
    await sendWeeklyDigestFromWizard({
      state: baseState({ test_only: true }), orgId: 'o-1', period,
      recipients: [recip('g1', ['t-1'])],
      events: [ev('e1', 't-1')],
      tournaments: [], teams: [], coaches: COACHES, rsvpCountsByEvent: new Map(),
    });
    expect(sendWeeklyDigest).toHaveBeenCalledOnce();
    const args = sendWeeklyDigest.mock.calls[0][0];
    expect(args.testOnly).toBe(true);
    expect(args.bodyNotes).toBe('have a great week');
    expect(args.recipients).toHaveLength(1);
  });
});
