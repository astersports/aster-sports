// @vitest-environment jsdom
//
// G5 PR 1a regression guard (architect requirement; mirrors the
// sendIdempotencyInvariant static-lock shape). The whole hold exists to prevent
// auto-re-driving ambiguous 'queued' rows (crash-after-dispatch double-send to
// 175 families). These lock that property at the surface:
//   1. the data hook (the AUTOMATIC layer) NEVER sends — it's read-only.
//   2. the Region's only send sits behind the human confirm, never an auto path.
//   3. the Region renders NOTHING when nothing is stuck (the live state).

import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import { cleanup, render } from '@testing-library/react';

const HOOK = readFileSync('src/hooks/useStuckSends.js', 'utf8');
const REGION = readFileSync('src/components/radar/StuckSendsRegion.jsx', 'utf8');

afterEach(cleanup);

describe('G5 queued surface — never auto-re-drives queued', () => {
  it('the queued data hook never SENDS (the H1 status reconcile is allowed)', () => {
    // RECOVER Option A (architect 2026-06-09): the hook runs the H1 reconcile —
    // a delivery_status UPDATE synced from provider webhook signals. That is a
    // STATUS write, never a send. The load-bearing invariant is UNCHANGED: the
    // automatic layer must never SEND, and its only write is a status reconcile
    // (no insert/delete, no invoke).
    expect(HOOK).not.toMatch(/functions\.invoke/);
    expect(HOOK).not.toMatch(/send-tournament-message/);
    expect(HOOK).toMatch(/\.update\(\{\s*delivery_status:/);
    expect(HOOK).not.toMatch(/\.insert\(|\.delete\(/);
  });

  it('the Region sends only behind the human confirm (no auto path)', () => {
    // The single dispatch invoke lives inside run(), reachable only from the
    // confirm button (confirm state set by a card action). If a future edit
    // moves a send out of that gate, this fails.
    expect(REGION).toMatch(/functions\.invoke\(['"]send-tournament-message['"]/);
    expect(REGION).toMatch(/setConfirm\(/);
    // and the resend is explicitly justified as safe (queued => non-finalized).
    expect(REGION).toMatch(/queued.*never finalized|never finalized|no 409/);
  });
});

vi.mock('../../../hooks/useStuckSends', () => ({ useStuckSends: vi.fn() }));
vi.mock('../../../context/useToast', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
// Mock the supabase client so importing StuckSendsRegion doesn't throw on missing
// VITE_SUPABASE_* env vars (AP#27); the clean-state renders never call it.
vi.mock('../../../lib/supabase', () => ({ supabase: {} }));
const { useStuckSends } = await import('../../../hooks/useStuckSends');
const StuckSendsRegion = (await import('../StuckSendsRegion')).default;

describe('StuckSendsRegion — clean state', () => {
  it('renders nothing when nothing is stuck (count 0)', () => {
    useStuckSends.mockReturnValue({ groups: [], count: 0, loading: false, refetch: vi.fn() });
    const { container } = render(<StuckSendsRegion orgId="org-1" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing while loading (no flash)', () => {
    useStuckSends.mockReturnValue({ groups: [], count: 0, loading: true, refetch: vi.fn() });
    const { container } = render(<StuckSendsRegion orgId="org-1" />);
    expect(container.firstChild).toBeNull();
  });
});
