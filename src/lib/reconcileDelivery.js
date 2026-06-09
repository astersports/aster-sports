// H1 RECONCILE-FROM-PROVIDER (architect RECOVER ruling, Option A hardening).
// Pure logic for the recovery "reconcile pass": derive a terminal
// delivery_status from a recipient's Resend webhook signals. This is STATUS
// SYNC ONLY — the caller does a status-only UPDATE and NEVER a send. It clears
// the crash-window "sent-but-not-written-back" rows (a delivered/opened/clicked
// webhook landed, but the original dispatch writeback was lost) out of the
// human-review queue, with zero double-send risk.

// Priority: a "sent and then some" signal wins over a plain delivery, and the
// deliverability-failure signals (bounced/complained) are terminal "it sent"
// states per the architect's H3 rule. Returns null when NO signal is present —
// that row stays 'queued' (the no-signal residue routed to human review).
export function terminalStatusFromSignals(row) {
  if (!row) return null;
  if (row.complained_at) return 'complained';
  if (row.bounced_at) return 'bounced';
  if (row.clicked_at) return 'clicked';
  if (row.opened_at) return 'opened';
  if (row.delivered_at) return 'delivered';
  return null;
}

// H2 GRACE WINDOW. A no-signal 'queued' row is only "stuck" (human-review) once
// it is older than this window — a newer row is most likely just-dispatched with
// its delivery webhook still in flight, and will self-reconcile (H1) when the
// signal lands. created_at is the age proxy per the architect ruling (no
// dispatched_at column added).
export const STUCK_GRACE_MINUTES = 15;

export function isPastGrace(createdAt, now = Date.now()) {
  if (!createdAt) return true; // unknown age → surface (fail toward review)
  return now - new Date(createdAt).getTime() >= STUCK_GRACE_MINUTES * 60000;
}
