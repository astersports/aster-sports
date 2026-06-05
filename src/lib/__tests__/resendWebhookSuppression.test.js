// Unit coverage for the Resend webhook receiver's pure suppression decision
// (CLAUDE.md AP #43 — cross-surface invariant: a spam complaint or HARD bounce
// must suppress future sends). The logic lives in a dependency-free Deno module
// (supabase/functions/resend-webhook-receiver/_suppression.ts) so it imports
// cleanly under vitest; the receiver index.ts itself can't (Deno.serve + esm.sh
// at module load). Guards the Wave 3.A #19 P1 closure against regression.

import { describe, expect, it } from 'vitest';
import { shouldSuppress } from '../../../supabase/functions/resend-webhook-receiver/_suppression.ts';

describe('resend-webhook-receiver shouldSuppress (AP #43)', () => {
  it('always suppresses on a spam complaint', () => {
    expect(shouldSuppress('email.complained', {})).toBe(true);
    // bounce subfield is irrelevant for complaints
    expect(shouldSuppress('email.complained', { bounce: { type: 'Transient' } })).toBe(true);
  });

  it('suppresses on a permanent (hard) bounce, case-insensitively', () => {
    expect(shouldSuppress('email.bounced', { bounce: { type: 'Permanent' } })).toBe(true);
    expect(shouldSuppress('email.bounced', { bounce: { type: 'permanent' } })).toBe(true);
    expect(shouldSuppress('email.bounced', { bounce: { type: 'PERMANENT' } })).toBe(true);
  });

  it('does NOT suppress on transient / undetermined / missing bounce type (fail-safe)', () => {
    expect(shouldSuppress('email.bounced', { bounce: { type: 'Transient' } })).toBe(false);
    expect(shouldSuppress('email.bounced', { bounce: { type: 'Undetermined' } })).toBe(false);
    expect(shouldSuppress('email.bounced', { bounce: {} })).toBe(false);
    expect(shouldSuppress('email.bounced', {})).toBe(false);
  });

  it('does NOT suppress on non-terminal lifecycle events', () => {
    for (const evt of ['email.sent', 'email.delivered', 'email.opened', 'email.clicked', 'email.delivery_delayed', 'email.failed']) {
      expect(shouldSuppress(evt, {})).toBe(false);
    }
  });
});
