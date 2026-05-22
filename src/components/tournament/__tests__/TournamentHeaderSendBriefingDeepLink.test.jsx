// @vitest-environment jsdom
//
// Cross-surface invariant test per CLAUDE.md anti-pattern #43 / §4.B
// TournamentHeader Send Briefing relocation.
//
// Invariant: surfaces that emit a "send briefing" deep-link for a
// tournament anchor MUST navigate to
// /admin/briefings/compose?anchor=tournament&id=<tournament.id>.
//
// Locks the URL shape against drift (cross-anchor symmetry with
// TeamDetailHero's `?anchor=team&id=<id>` and EventHeroActions'
// `?anchor=event&id=<id>`). Prevents the next refactor from
// re-introducing the legacy inline modal or a kind-presetting URL.

import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ orgId: 'org-1' }),
}));
vi.mock('../../../hooks/useAnchorDraftStatus', () => ({
  useAnchorDraftStatus: () => ({ hasDraft: false, hasSent: false }),
}));
// TournamentFormSheet pulls in the supabase client at import time which
// throws on missing env vars under vitest. Stub it — the form sheet is
// only mounted when editing=true, which this test never triggers.
vi.mock('../TournamentFormSheet', () => ({ default: () => null }));

const { default: TournamentHeader } = await import('../TournamentHeader');

const TOURNAMENT = {
  id: 't-1',
  name: 'ZG Rumble for the Ring',
  start_date: '2026-06-01',
  end_date: '2026-06-02',
  status: 'upcoming',
  circuit: 'AAU',
};

function renderHeader({ isStaff = true, tournament = TOURNAMENT } = {}) {
  return render(
    <MemoryRouter>
      <TournamentHeader tournament={tournament} isStaff={isStaff} onChange={() => {}} />
    </MemoryRouter>,
  );
}

describe('TournamentHeader — Send Briefing deep-link invariant (AP #43)', () => {
  it('staff: renders "Send briefing" link with /admin/briefings/compose?anchor=tournament&id=<id>', () => {
    const { container } = renderHeader();
    const link = container.querySelector('a[aria-label="Send briefing about this tournament"]');
    expect(link).not.toBeNull();
    expect(link.getAttribute('href')).toBe('/admin/briefings/compose?anchor=tournament&id=t-1');
  });

  it('staff: link is independent of ctaKind — renders for in-flight tournaments too', () => {
    const inFlight = { ...TOURNAMENT, start_date: '2026-04-01', end_date: '2099-12-31' };
    const { container } = renderHeader({ tournament: inFlight });
    const link = container.querySelector('a[aria-label="Send briefing about this tournament"]');
    expect(link).not.toBeNull();
    expect(link.getAttribute('href')).toBe('/admin/briefings/compose?anchor=tournament&id=t-1');
  });

  it('parent (non-staff): no Send Briefing link rendered', () => {
    const { container } = renderHeader({ isStaff: false });
    expect(container.querySelector('a[aria-label="Send briefing about this tournament"]')).toBeNull();
  });

  it('link does NOT preset a kind in the URL — admin lands at Kind step to pick', () => {
    const { container } = renderHeader();
    const link = container.querySelector('a[aria-label="Send briefing about this tournament"]');
    expect(link.getAttribute('href')).not.toMatch(/kind=/);
  });

  it('does NOT import the legacy SendBriefingButton (no in-place modal)', async () => {
    const headerSrc = await import('../TournamentHeader.jsx?raw');
    expect(headerSrc.default).not.toMatch(/SendBriefingButton/);
  });
});
