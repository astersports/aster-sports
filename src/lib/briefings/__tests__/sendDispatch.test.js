// G8 / SEAM-3: the recovery sweep (G5) re-drives stuck sends, so the dispatch
// must be idempotent + its writeback decision must be correct. These tests
// cover the pure kernels send-tournament-message/index.ts now delegates to
// (the AP#30 mirror src/lib/briefings/sendDispatch.js ↔ _dispatch.ts). The
// DB-query side of idempotency (recipients filtered to delivery_status='queued')
// is locked separately by sendIdempotencyInvariant.test.js.

import { describe, expect, it } from 'vitest';
import { alreadySent, classifyBatchResult } from '../sendDispatch';

describe('alreadySent — message-level idempotency (drives the 409)', () => {
  it('true when sent_at is set (a finalized message must 409, never re-send)', () => {
    expect(alreadySent({ sent_at: '2026-06-07T12:00:00Z' })).toBe(true);
  });
  it('false when sent_at is null/absent (still sendable)', () => {
    expect(alreadySent({ sent_at: null })).toBe(false);
    expect(alreadySent({})).toBe(false);
    expect(alreadySent(null)).toBe(false);
  });
});

const GROUP = [
  { id: 'r1', email_at_send: 'a@x.com' },
  { id: 'r2', email_at_send: 'b@x.com' },
  { id: 'r3', email_at_send: 'c@x.com' },
];

describe('classifyBatchResult — per-recipient writeback decision', () => {
  it('batch error → the WHOLE group is failed, one batch-level error, zero sent', () => {
    const c = classifyBatchResult(GROUP, { error: { message: 'rate limited' } });
    expect(c.failedIds).toEqual(['r1', 'r2', 'r3']);
    expect(c.sentIds).toEqual([]);
    expect(c.sent).toBe(0);
    expect(c.failed).toBe(3);
    expect(c.errors).toEqual(['rate limited']);
  });

  it('batch error without a message → falls back to "Batch rejected"', () => {
    const c = classifyBatchResult(GROUP, { error: {} });
    expect(c.errors).toEqual(['Batch rejected']);
    expect(c.failed).toBe(3);
  });

  it('all-success → every row sent, no errors', () => {
    const c = classifyBatchResult(GROUP, { data: { data: [{ id: 'e1' }, { id: 'e2' }, { id: 'e3' }] } });
    expect(c.sentIds).toEqual(['r1', 'r2', 'r3']);
    expect(c.failedIds).toEqual([]);
    expect(c.sent).toBe(3);
    expect(c.failed).toBe(0);
    expect(c.errors).toEqual([]);
  });

  it('mixed → per-row sent/failed; failed rows carry "<email>: <error>"', () => {
    const c = classifyBatchResult(GROUP, { data: { data: [{ id: 'e1' }, { error: 'invalid recipient' }, { id: 'e3' }] } });
    expect(c.sentIds).toEqual(['r1', 'r3']);
    expect(c.failedIds).toEqual(['r2']);
    expect(c.sent).toBe(2);
    expect(c.failed).toBe(1);
    expect(c.errors).toEqual(['b@x.com: invalid recipient']);
  });

  it('success row missing both id and error → failed with "unknown"', () => {
    const c = classifyBatchResult([GROUP[0]], { data: { data: [{}] } });
    expect(c.failedIds).toEqual(['r1']);
    expect(c.errors).toEqual(['a@x.com: unknown']);
  });

  it('empty group → empty result (no throw)', () => {
    const c = classifyBatchResult([], { data: { data: [] } });
    expect(c).toEqual({ sentIds: [], failedIds: [], sent: 0, failed: 0, errors: [] });
  });
});
