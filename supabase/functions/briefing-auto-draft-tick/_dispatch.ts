// Pure dispatch-decision kernels — the CRON's mirror copy.
// AP#30 mirror: this is the cron's Deno mirror; the vitest source of truth is
// src/lib/briefings/sendDispatch.js, and send-tournament-message keeps its own
// Deno mirror at supabase/functions/send-tournament-message/_dispatch.ts. All
// three stay byte-near-identical apart from TS annotations.
//
// Why the cron needs a LOCAL copy (not a cross-tree import): Edge deploys
// bundle the function directory only, so importing from a sibling function's
// directory doesn't resolve at deploy time (AP#30 rationale). The G5 OPT-B
// re-drive sweep (_redrive.ts) imports decideSuppression/decidePilotGate/
// classifyBatchResult from THIS file so the pilot + suppression gate is
// re-applied at re-drive time using the SAME pure decision logic the
// message-level send uses.
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
export function alreadySent(message: any) {
  return !!(message && message.sent_at);
}

// Per-batch writeback decision. Input: the batch's recipient rows (`group`)
// and the Resend batch result ({ data, error }). Output: which rows are sent
// vs failed, the counts, and the per-row error strings — exactly mirroring the
// prior inline logic so the IO layer (index.ts) just applies the decision.
//   - batch error  -> the WHOLE group is failed (one batch-level error string).
//   - batch success -> per row: a result with an id is sent; otherwise failed
//     (with a "<email>: <error>" string).
export function classifyBatchResult(group: any, { data, error }: any = {}) {
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
  const decided = group.map((r: any, i: number) => ({ r, ok: !!(res[i] && res[i].id), err: (res[i] && res[i].error) ? res[i].error : 'unknown' }));
  const failedRows = decided.filter((d: any) => !d.ok);
  return {
    sentIds: decided.filter((d: any) => d.ok).map((d: any) => d.r.id),
    failedIds: failedRows.map((d: any) => d.r.id),
    sent: decided.length - failedRows.length,
    failed: failedRows.length,
    errors: failedRows.map((d: any) => `${d.r.email_at_send}: ${d.err}`),
  };
}

// Pure suppression decision: given recipient rows and their guardians'
// email-preference rows, which rows are suppressed (guardian unsubscribed) vs
// still sendable. Mirrors the inline logic in index.ts; IO (the status flip +
// recipient reassignment) stays in the caller.
export function decideSuppression(recipients: any[], prefsRows: any[]) {
  const unsub = new Set((prefsRows ?? []).filter((p: any) => p.unsubscribed_at).map((p: any) => p.guardian_id));
  const suppressedIds = (recipients ?? []).filter((r: any) => r.guardian_id && unsub.has(r.guardian_id)).map((r: any) => r.id);
  const stillQueued = (recipients ?? []).filter((r: any) => !r.guardian_id || !unsub.has(r.guardian_id));
  return { suppressedIds, stillQueued, suppressed: suppressedIds.length };
}

// Pure pilot fail-closed gate: when pilot mode is on, any guardian_id-bearing
// recipient whose guardian is not is_pilot_family aborts the whole send. Admin
// BCC rows (no guardian) are not in `guardians`. pilotMode=false -> no gate.
export function decidePilotGate(guardians: any[], pilotMode: boolean) {
  if (!pilotMode) return { abort: false, nonPilotEmails: [], nonPilotCount: 0 };
  const nonPilot = (guardians ?? []).filter((g: any) => !g.is_pilot_family);
  return { abort: nonPilot.length > 0, nonPilotEmails: nonPilot.map((g: any) => g.email), nonPilotCount: nonPilot.length };
}
