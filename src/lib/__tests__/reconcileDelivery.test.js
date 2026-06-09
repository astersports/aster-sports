import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { isPastGrace, STUCK_GRACE_MINUTES, terminalStatusFromSignals } from '../reconcileDelivery';

describe('terminalStatusFromSignals (H1)', () => {
  it('returns null when no provider signal is present (row stays queued = residue)', () => {
    expect(terminalStatusFromSignals({})).toBe(null);
    expect(terminalStatusFromSignals(null)).toBe(null);
  });
  it('maps each provider signal to its terminal status', () => {
    expect(terminalStatusFromSignals({ delivered_at: 't' })).toBe('delivered');
    expect(terminalStatusFromSignals({ opened_at: 't' })).toBe('opened');
    expect(terminalStatusFromSignals({ clicked_at: 't' })).toBe('clicked');
    expect(terminalStatusFromSignals({ bounced_at: 't' })).toBe('bounced');
    expect(terminalStatusFromSignals({ complained_at: 't' })).toBe('complained');
  });
  it('priority: complained > bounced > clicked > opened > delivered', () => {
    expect(terminalStatusFromSignals({ delivered_at: 't', opened_at: 't', clicked_at: 't' })).toBe('clicked');
    expect(terminalStatusFromSignals({ delivered_at: 't', bounced_at: 't' })).toBe('bounced');
    expect(terminalStatusFromSignals({ bounced_at: 't', complained_at: 't' })).toBe('complained');
  });
});

describe('isPastGrace (H2)', () => {
  const now = Date.now();
  it('false for a row newer than the grace window (webhook likely still in flight)', () => {
    expect(isPastGrace(new Date(now - 60000).toISOString(), now)).toBe(false);
  });
  it('true for a row older than the grace window', () => {
    expect(isPastGrace(new Date(now - (STUCK_GRACE_MINUTES + 1) * 60000).toISOString(), now)).toBe(true);
  });
  it('true when created_at is unknown (fail toward review)', () => {
    expect(isPastGrace(null, now)).toBe(true);
  });
});

describe('H1 invariant: the reconcile pass is status-sync only, never a send', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const hookSrc = readFileSync(resolve(here, '../../hooks/useStuckSends.js'), 'utf8');
  it('useStuckSends never invokes the send path', () => {
    expect(hookSrc).not.toMatch(/functions\.invoke/);
    expect(hookSrc).not.toMatch(/send-tournament-message/);
  });
  it('useStuckSends reconciles via a status-only delivery_status update', () => {
    expect(hookSrc).toMatch(/\.update\(\{\s*delivery_status:\s*status\s*\}\)/);
  });
});
