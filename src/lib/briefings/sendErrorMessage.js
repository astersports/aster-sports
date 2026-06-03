// DEF-8b graceful-skip — the single send-boundary error → kindness translation
// point (CLAUDE.md §16.3). Shape (A) per the locked decision: a UI-boundary
// catch helper, NOT a send-helper contract change (which would ripple to every
// caller). This is the permanent home for raw send-error → user-facing
// microcopy; NoRecipientsError is the first case, and future raw-error classes
// (guard 403s, residual Postgres errors) translate here too.
//
// Returns null when there is no special translation, so each caller keeps its
// own existing fallback unchanged (minimal blast radius). Copy is tenant-
// agnostic — no org-specific literal (DEF-13).
import { NoRecipientsError } from '../engine/resolvers/registry';

export function friendlySendError(error) {
  if (error instanceof NoRecipientsError) {
    return 'No families to notify yet. Designate a pilot test family to test, or this sends at cutover.';
  }
  return null;
}
