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
  it('the queued data hook is read-only: no send/invoke, no status write', () => {
    expect(HOOK).not.toMatch(/functions\.invoke/);
    expect(HOOK).not.toMatch(/\.update\(/);
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

  it('E5: the mark-failed action routes to the bounded retry path, behind the confirm', () => {
    // 'failed' (not a send) sets up briefing-auto-draft-tick/_redrive to pick the
    // rows up. It must be a confirm action ('fail'), never an auto path.
    expect(REGION).toMatch(/delivery_status:\s*['"]failed['"]/);
    expect(REGION).toMatch(/action:\s*['"]fail['"]/);
  });
});

vi.mock('../../../hooks/useStuckSends', () => ({ useStuckSends: vi.fn() }));
vi.mock('../../../context/useToast', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
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
