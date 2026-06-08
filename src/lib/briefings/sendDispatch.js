// Pure dispatch-decision kernels for the send-tournament-message edge fn.
// AP#30 mirror: this is the vitest source of truth; the Deno mirror is
// supabase/functions/send-tournament-message/_dispatch.ts (keep in sync).
//
// Why this exists (G8 / SEAM-3): the recovery sweep (G5) re-drives stuck sends.
// This proves the PARTIAL idempotency that DOES hold: (1) a message-level guard
// — alreadySent() drives the 409 so a re-invoke of a FINALIZED message never
// re-sends; (2) the recipient query filters delivery_status='queued', so a
// re-invoke skips rows already marked 'sent'. classifyBatchResult is the
// per-recipient writeback decision (pure, unit-tested: "whole batch -> failed on
// rejection" + "per-row sent/failed on success") instead of buried in the loop.
//
// SCOPE LIMIT (architect G8 review, 2026-06-07): this does NOT cover the
// crash-after-dispatch window — if the fn dies AFTER Resend accepts a batch but
// BEFORE the rows are marked 'sent', those recipients were emailed yet their
// rows still read 'queued'. A blind re-drive of 'queued' would double-send them.
// So G5 must NOT auto-re-drive ambiguous 'queued' rows on the strength of these
// guards: it auto-re-drives only the provably-safe class (failed-by-batch-
// rejection, no email sent) and surfaces ambiguous 'queued' for human review,
// until the window is closed durably (sending-claim state or provider
// idempotency keys). "Idempotency proven" here = finalized + clean-queued only.

// Message-level idempotency: a message with sent_at set has already been
// finalized — re-invoking must 409, never re-send.
export function alreadySent(message) {
  return !!(message && message.sent_at);
}

// Per-batch writeback decision. Input: the batch's recipient rows (`group`)
// and the Resend batch result ({ data, error }). Output: which rows are sent
// vs failed, the counts, and the per-row error strings — exactly mirroring the
// prior inline logic so the IO layer (index.ts) just applies the decision.
//   - batch error  -> the WHOLE group is failed (one batch-level error string).
//   - batch success -> per row: a result with an id is sent; otherwise failed
//     (with a "<email>: <error>" string).
export function classifyBatchResult(group, { data, error } = {}) {
  if (error) {
    return {
      sentIds: [],
      failedIds: group.map((r) => r.id),
      sent: 0,
      failed: group.length,
      errors: [error.message ?? 'Batch rejected'],
    };
  }
  const res = (data && data.data) ? data.data : [];
  const decided = group.map((r, i) => ({ r, ok: !!(res[i] && res[i].id), err: (res[i] && res[i].error) ? res[i].error : 'unknown' }));
  const failedRows = decided.filter((d) => !d.ok);
  return {
    sentIds: decided.filter((d) => d.ok).map((d) => d.r.id),
    failedIds: failedRows.map((d) => d.r.id),
    sent: decided.length - failedRows.length,
    failed: failedRows.length,
    errors: failedRows.map((d) => `${d.r.email_at_send}: ${d.err}`),
  };
}
