// @vitest-environment jsdom
//
// ProgramHealthCard — invariant test per AP #46 (Wave 2.B post-#570 fix).
// Locks the skeleton-vs-loaded rendering invariant introduced in
// fix(wave-2b): skeleton consistency on admin home.
//
// Origin: Frank's iPhone screenshots after PR #570 showed Program Health
// rendering literal zeros/dashes (`0%`, `—`, `0 teams`, `0 new this week`)
// as placeholders while useProgramHealthMetrics resolved — reading as
// "the org has no data" rather than "data is loading." Fix threaded
// `loading` through MetricRow + added MetricValueSkeleton (em-pulse
// shape-matched bar per --em-bg-tertiary + 6px radius).
//
// Invariant: during the load window, none of the 4 metric rows render
// their default-state placeholder strings; instead each renders a
// shape-matched skeleton span. Once data resolves, real values populate.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import ProgramHealthCard from '../ProgramHealthCard';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ orgId: 'org-test' }),
}));

const metricsMock = vi.fn();
vi.mock('../../../hooks/useProgramHealthMetrics', () => ({
  useProgramHealthMetrics: (...args) => metricsMock(...args),
}));

afterEach(() => {
  cleanup();
  metricsMock.mockReset();
});

const season = {
  id: 'season-spring-2026',
  name: 'Spring 2026',
  start_date: '2026-03-23',
  end_date: '2026-06-14',
};
// Mid-season: roughly week 7 of 12.
const nowMs = new Date('2026-05-01').getTime();

describe('ProgramHealthCard — skeleton/loaded invariant (AP #46)', () => {
  it('renders skeletons (not default-state placeholders) while loading', () => {
    metricsMock.mockReturnValue({
      paymentPct: 0,
      rsvpPct: null,
      activeTeamsCount: 0,
      newRegistrationsCount: 0,
      loading: true,
    });
    const { container } = render(<ProgramHealthCard season={season} nowMs={nowMs} />);

    // The 4 metric value placeholders that would lie mid-fetch MUST NOT appear.
    expect(container.textContent).not.toMatch(/0%/);
    expect(container.textContent).not.toMatch(/—/);
    expect(container.textContent).not.toMatch(/0 teams/);
    expect(container.textContent).not.toMatch(/0 new this week/);

    // Skeleton span: shape-matched per LoadingSkeleton.Bar (em-pulse class,
    // --em-bg-tertiary fill, 6px radius, aria-hidden). One per metric row.
    const skeletons = container.querySelectorAll('span.em-pulse[aria-hidden="true"]');
    expect(skeletons.length).toBe(4);

    // Section + season header still render (season name + week header is not
    // gated by metrics loading — that data comes from the season prop itself).
    expect(container.textContent).toMatch(/PROGRAM HEALTH/);
    expect(container.textContent).toMatch(/Spring 2026/);
  });

  it('renders real values (no skeletons) when loaded', () => {
    metricsMock.mockReturnValue({
      paymentPct: 87,
      rsvpPct: 92,
      activeTeamsCount: 5,
      newRegistrationsCount: 3,
      loading: false,
    });
    const { container } = render(<ProgramHealthCard season={season} nowMs={nowMs} />);

    expect(container.textContent).toMatch(/87%/);
    expect(container.textContent).toMatch(/92%/);
    expect(container.textContent).toMatch(/5 teams/);
    expect(container.textContent).toMatch(/3 new this week/);

    const skeletons = container.querySelectorAll('span.em-pulse[aria-hidden="true"]');
    expect(skeletons.length).toBe(0);
  });

  it('renders null when season is missing (no metrics fetch attempted)', () => {
    metricsMock.mockReturnValue({
      paymentPct: 0,
      rsvpPct: null,
      activeTeamsCount: 0,
      newRegistrationsCount: 0,
      loading: false,
    });
    const { container } = render(<ProgramHealthCard season={null} nowMs={nowMs} />);
    expect(container.firstChild).toBeNull();
  });
});
