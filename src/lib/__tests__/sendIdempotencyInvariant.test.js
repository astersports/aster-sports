// G8 / SEAM-3 invariant lock. These two guards are NECESSARY for re-drive
// safety: (1) a finalized message 409s instead of re-sending; (2) the recipient
// query processes ONLY delivery_status='queued' rows, so a re-invoke skips rows
// already marked 'sent'. This static assertion fails loudly if either is removed.
// NOT SUFFICIENT (architect G8 review): the queued-filter does NOT cover the
// crash-after-dispatch window — a recipient emailed-but-not-yet-marked-'sent'
// still reads 'queued', so a blind re-drive double-sends. G5 must therefore
// auto-re-drive only safe-'failed' rows and surface ambiguous 'queued' for human
// review until the window is closed durably. Same lock shape as
// verifyJwtConfigAudit / sectionRendererParity (static-grep).

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
