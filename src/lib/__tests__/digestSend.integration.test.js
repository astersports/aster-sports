// Wave 4.8 hygiene PR #127 — sendWeeklyDigest orchestration tests.
// Mocks supabase + applyUnsubscribeUrls + composeWeeklyDigest so we
// exercise the queue / dispatch path (insert message → insert
// recipients → apply unsubscribe tokens → invoke edge function →
// status='sent') without DB IO. Resolver internals are covered by
// weeklyDigest.contract.test.js / .snapshot.test.js; this file
// focuses on digestSend's own contract. Pilot-mode + unsubscribed-
// guardian filtering happen UPSTREAM (get_digest_recipients RPC +
// useDigestRecipients hook); digestSend trusts its recipients arg.

import { beforeEach, describe, expect, it, vi } from 'vitest';

const inserted = { messages: [], recipients: [] };
const updates = [];
const dispatchCalls = [];
let messageErr = null;

function tableChain(table) {
  const chain = {
    insert: vi.fn((row) => {
      if (table === 'comms_message_recipients') {
        inserted.recipients.push(...row);
        return Promise.resolve({ error: null });
      }
      inserted.messages.push(row);
      return chain;
    }),
    select: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data: messageErr ? null : { id: 'msg-1' }, error: messageErr })),
    update: vi.fn((patch) => { updates.push(patch); return chain; }),
    eq: vi.fn(() => Promise.resolve({ error: null })),
  };
  return chain;
}

vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn((table) => tableChain(table)),
    functions: { invoke: vi.fn((name, opts) => { dispatchCalls.push({ name, opts }); return Promise.resolve({ data: { ok: true }, error: null }); }) },
    // Cutover PR 7b-2.5: digestSend now calls mint_feedback_token RPC
    // per family. Stub returns a deterministic token per (email, rating).
    rpc: vi.fn((name, args) => {
      if (name === 'mint_feedback_token') {
        return Promise.resolve({ data: `tok-${args.p_recipient_email}-${args.p_rating}`, error: null });
      }
      return Promise.resolve({ data: null, error: { message: `unmocked rpc: ${name}` } });
    }),
  },
}));

vi.mock('../unsubscribeUrl', () => ({
  applyUnsubscribeUrls: vi.fn((rows) => Promise.resolve(rows.map((r) => ({
    ...r,
    body_html_rendered: (r.body_html_rendered || '').replace('{{UNSUBSCRIBE_URL}}', `https://test/unsub/${r.guardian_id || 'admin'}`),
    body_plain_rendered: (r.body_plain_rendered || '').replace('{{UNSUBSCRIBE_URL}}', `https://test/unsub/${r.guardian_id || 'admin'}`),
  })))),
}));

vi.mock('../engine/resolvers/weeklyDigest', () => ({
  composeWeeklyDigest: vi.fn((_ctx, slice) => ({
    subject: `Week ahead for ${slice.guardian_id || 'admin'}`,
    content_sections: [{ kind: 'header', headline: 'WEEK AHEAD' }, { kind: 'footer', text: '{{UNSUBSCRIBE_URL}}' }],
  })),
}));

const { sendWeeklyDigest } = await import('../digestSend');
const { applyUnsubscribeUrls } = await import('../unsubscribeUrl');

const period = { start: new Date('2026-05-11T00:00:00Z'), end: new Date('2026-05-17T23:59:59Z') };
const baseEvents = [{ id: 'e-1', team_id: 't-1', title: 'Practice', start_at: '2026-05-13T19:00:00Z' }];
const baseRecipients = [
  { guardian_id: 'g-1', email: 'g1@example.com', kid_first_names: ['A'], team_ids: ['t-1'] },
  { guardian_id: 'g-2', email: 'g2@example.com', kid_first_names: ['B'], team_ids: ['t-1'] },
];
const call = (overrides = {}) => sendWeeklyDigest({
  orgId: 'org-1', period, recipients: baseRecipients,
  events: baseEvents, teams: [{ id: 't-1', name: 'A' }], tournaments: [], coaches: [],
  rsvpCountsByEvent: {}, testOnly: false, ...overrides,
});

beforeEach(() => {
  inserted.messages.length = 0; inserted.recipients.length = 0;
  updates.length = 0; dispatchCalls.length = 0;
  messageErr = null;
  vi.clearAllMocks();
});

describe('sendWeeklyDigest — orchestration', () => {
  it('a. happy path: insert message → recipients → dispatch → flip status=sent', async () => {
    const result = await call();
    expect(inserted.messages).toHaveLength(1);
    expect(inserted.messages[0].kind).toBe('weekly_digest');
    expect(inserted.messages[0].org_id).toBe('org-1');
    expect(inserted.messages[0].status).toBe('draft');
    expect(inserted.recipients).toHaveLength(3); // 2 families + admin BCC
    expect(inserted.recipients.find((r) => r.email_at_send === 'admin@legacyhoopers.org')).toBeTruthy();
    expect(dispatchCalls[0].name).toBe('send-tournament-message');
    expect(dispatchCalls[0].opts.body.message_id).toBe('msg-1');
    expect(updates).toContainEqual({ status: 'sent' });
    expect(result.messageId).toBe('msg-1');
    expect(result.composedFamilies).toBe(2);
  });

  it('b. UNSUBSCRIBE_URL substitutes per-recipient via applyUnsubscribeUrls', async () => {
    await call();
    expect(applyUnsubscribeUrls).toHaveBeenCalledTimes(1);
    const g1 = inserted.recipients.find((r) => r.guardian_id === 'g-1');
    expect(g1.body_html_rendered).toContain('https://test/unsub/g-1');
    expect(g1.body_html_rendered).not.toContain('{{UNSUBSCRIBE_URL}}');
    const admin = inserted.recipients.find((r) => r.email_at_send === 'admin@legacyhoopers.org');
    expect(admin.body_html_rendered).toContain('https://test/unsub/admin');
  });

  it('c. throws on missing orgId — no insert, no dispatch', async () => {
    await expect(sendWeeklyDigest({ orgId: null, period, recipients: baseRecipients }))
      .rejects.toThrow('Missing orgId.');
    expect(inserted.messages).toHaveLength(0);
    expect(dispatchCalls).toHaveLength(0);
  });

  it('d. throws on missing period — no insert, no dispatch', async () => {
    await expect(sendWeeklyDigest({ orgId: 'org-1', period: { start: null, end: null }, recipients: baseRecipients }))
      .rejects.toThrow('Pick a digest period.');
    expect(inserted.messages).toHaveLength(0);
  });

  it('e. throws on empty recipients — no insert, no dispatch', async () => {
    await expect(call({ recipients: [] })).rejects.toThrow('No recipients available.');
    expect(inserted.messages).toHaveLength(0);
    expect(dispatchCalls).toHaveLength(0);
  });

  it('f. testOnly=true drops family rows, keeps admin BCC only', async () => {
    await call({ testOnly: true });
    expect(inserted.recipients).toHaveLength(1);
    expect(inserted.recipients[0].email_at_send).toBe('admin@legacyhoopers.org');
    expect(inserted.recipients[0].guardian_id).toBeNull();
  });

  it('g. hasEvents=false slices are dropped (recipient on a team with no events)', async () => {
    await call({ recipients: [{ guardian_id: 'g-orphan', email: 'g@x', kid_first_names: ['Z'], team_ids: ['t-99'] }] });
    expect(inserted.recipients.find((r) => r.guardian_id === 'g-orphan')).toBeUndefined();
    // Admin BCC still inserted; composedFamilies = 0.
    expect(inserted.recipients.find((r) => r.email_at_send === 'admin@legacyhoopers.org')).toBeTruthy();
  });
});
