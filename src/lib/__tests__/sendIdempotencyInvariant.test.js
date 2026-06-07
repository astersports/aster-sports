// G8 / SEAM-3 invariant lock. The recovery sweep (G5) re-invokes
// send-tournament-message to re-drive stuck sends. That is SAFE ONLY IF the
// edge fn is idempotent: (1) a finalized message 409s instead of re-sending,
// and (2) the recipient query processes ONLY delivery_status='queued' rows, so
// a re-invoke never double-sends to already-sent recipients. Both guards live
// in index.ts; this static assertion fails loudly if either is ever removed —
// the cheapest way to lock a DB-query invariant the unit tests can't reach.
// Same shape as verifyJwtConfigAudit / sectionRendererParity (static-grep lock).

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

const SRC = readFileSync('supabase/functions/send-tournament-message/index.ts', 'utf8');

describe('send-tournament-message re-drive idempotency (G5 prerequisite)', () => {
  it('message-level guard: a finalized (sent_at) message 409s via alreadySent', () => {
    expect(SRC).toMatch(/alreadySent\(message\)/);
    expect(SRC).toMatch(/\b409\b/);
  });

  it('recipient-level guard: the send only processes delivery_status="queued" rows', () => {
    // The literal filter that makes a re-invoke skip already-sent rows. If this
    // is removed, a recovery-sweep re-drive could double-send — block that.
    expect(SRC).toMatch(/\.eq\(\s*["']delivery_status["']\s*,\s*["']queued["']\s*\)/);
  });

  it('writeback delegates to the tested pure kernel (classifyBatchResult)', () => {
    expect(SRC).toMatch(/classifyBatchResult\(group,/);
  });
});
