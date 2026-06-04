// Phase 3 Meta + B5.1 — composer error microcopy translation.
//
// Maps specific Postgres / DB-layer error codes to kindness microcopy
// per §16.3 before the message reaches the admin toast / banner.
// Default behavior for unrecognized errors preserves the original
// message so we don't mask anything unexpected.
//
// Origin: docs/AUDIT_BRIEFINGS_2026-06-02.md §B5.1 — useBriefingDraft.flush()
// + composer onSend handlers were propagating raw Postgres `duplicate
// key value violates constraint comms_messages_weekly_digest_unique`
// and `value ... violates check constraint comms_messages_audience_type_check`
// strings verbatim to admins.
//
// After Phase 3 D-1(a) (#674) narrowed the index predicate and D-2(α)
// (#683) widened the CHECK, these errors are EDGE CASES (re-send of an
// already-sent digest, or a future audience_type drift). The
// translation is the kindness-microcopy gate at the boundary.
//
// Gate per redesign doc: lands after schema PRs so messages match the
// post-fix behavior.

/**
 * Translate an Error (Postgres or otherwise) into a kindness microcopy
 * string for the admin composer surface.
 *
 * @param {Error | { code?: string, message?: string } | unknown} err
 * @returns {string}
 */
export function translateBriefingError(err) {
  if (!err) return "Looks like that didn't go through. Try again?";
  const code = (typeof err === 'object' && err && 'code' in err) ? err.code : undefined;
  const message = (typeof err === 'object' && err && 'message' in err) ? String(err.message || '') : String(err);

  // Custom application-layer codes (from digestSend.js D-1(c), etc.)
  if (code === 'DIGEST_ALREADY_SENT') {
    return "A weekly digest for that period was already sent. Open it from the inbox to view or resend.";
  }

  // Postgres unique-violation. After D-1(a) narrowed the weekly_digest
  // index, this fires when a row is already in (scheduled, queued, sent)
  // for the same (org, period) — admin is racing or re-sending.
  if (code === '23505') {
    if (/comms_messages_weekly_digest_unique/.test(message)) {
      return "There's already a weekly digest scheduled or sent for this period. Open it from the inbox instead.";
    }
    return "There's already a briefing for this anchor — check your drafts or the inbox.";
  }

  // Postgres CHECK violation. After D-2(α) widened the audience_type
  // CHECK, this fires only when a new audience_type value is referenced
  // before the CHECK is updated — a code-vs-schema drift surface.
  if (code === '23514') {
    if (/audience_type_check/.test(message)) {
      return "That audience isn't allowed for this briefing kind. Try a different audience option.";
    }
    if (/kind_check/.test(message)) {
      return "That briefing kind isn't allowed by the current schema. Contact support if you expected it to work.";
    }
    return "That value doesn't match what the system expects. Try editing the briefing and saving again.";
  }

  // Other Postgres error classes — generic fallback that doesn't leak SQL text.
  if (typeof code === 'string' && /^2[0-9]{4}$/.test(code)) {
    return "Save failed. Try again, or contact support if this keeps happening.";
  }

  // Non-Postgres errors: preserve the message (network errors, etc.)
  // but fall back to the friendly default if the message is empty.
  return message || "Looks like that didn't go through. Try again?";
}
