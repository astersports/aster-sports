// @vitest-environment jsdom
//
// Cross-role invariant test per CLAUDE.md anti-pattern #43 / Teams PR B.
//
// TeamDetailHero renders different chrome per active role:
//   - parent : "View calendar" CTA + coach contact line
//   - coach  : "Message" + "Briefing" CTAs + coach contact line
//                (UNLESS coach is viewing self — line hidden)
//   - admin  : "Message" + "Briefing" CTAs + coach contact line
//   - admin-view-as-parent: parent variant
//   - admin-view-as-coach : coach variant (still shows contact;
//                            admin is not the coach themselves)
//
// The PLATFORM ADDITION assertion: coach-viewing-self hides the contact
// line entirely. Lock so the diagnostic doesn't drift across roles.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const authRef = { current: { user: { id: 'admin-user-id' } } };
const coachRef = { current: { user_id: 'kenny-id', name: 'Kenny', phone: '555-1234', email: null } };

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => authRef.current,
}));
vi.mock('../../../hooks/useTeamHeadCoach', () => ({
  useTeamHeadCoach: () => ({ coach: coachRef.current, loading: false, error: null }),
}));
vi.mock('../../../hooks/useEventRsvpCounts', () => ({
  useEventRsvpCounts: () => ({ counts: {}, refetch: () => {} }),
}));
vi.mock('../../shared/ChildRsvp', () => ({ default: () => <div data-testid="child-rsvp" /> }));

const { default: TeamDetailHero } = await import('../TeamDetailHero');

const TEAM = { id: 't1', name: '10U Blue', age_group: '10U', circuit: 'league_play', team_color: '#4a8fd4', practice_day: 'Tue', practice_location: 'WCC' };
const NEXT_EVENT = { id: 'e1', event_type: 'game', start_at: '2026-06-01T22:00:00Z', team_id: 't1' };

function renderHero(role, overrides = {}) {
  return render(
    <MemoryRouter>
      <TeamDetailHero team={TEAM} role={role} summary={null} myChild={overrides.myChild ?? null}
        myChildPlayer={overrides.myChildPlayer ?? null} nextEvent={NEXT_EVENT} />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  authRef.current = { user: { id: 'admin-user-id' } };
  coachRef.current = { user_id: 'kenny-id', name: 'Kenny', phone: '555-1234', email: null };
});

describe('TeamDetailHero — per-role invariant (anti-pattern #43)', () => {
  it('parent: shows View calendar CTA + coach contact line; no Message/Briefing', () => {
    const { container } = renderHero('parent');
    expect(container.textContent).toMatch(/View calendar/);
    expect(container.textContent).toMatch(/Coach.*Kenny/);
    expect(container.textContent).not.toMatch(/Briefing/);
  });

  it('coach (not the head coach themselves): shows Message + Briefing + contact line', () => {
    authRef.current = { user: { id: 'some-other-coach-id' } };
    const { container } = renderHero('coach');
    expect(container.textContent).toMatch(/Message/);
    expect(container.textContent).toMatch(/Briefing/);
    expect(container.textContent).toMatch(/Coach.*Kenny/);
  });

  it('PLATFORM ADDITION — coach viewing self: contact line is HIDDEN', () => {
    authRef.current = { user: { id: 'kenny-id' } };
    const { container } = renderHero('coach');
    expect(container.textContent).toMatch(/Message/);
    expect(container.textContent).not.toMatch(/Coach.*Kenny/);
  });

  it('admin: shows Message + Briefing + contact line (admin is not coach)', () => {
    const { container } = renderHero('admin');
    expect(container.textContent).toMatch(/Message/);
    expect(container.textContent).toMatch(/Briefing/);
    expect(container.textContent).toMatch(/Coach.*Kenny/);
  });

  it('admin-view-as-parent: renders parent variant (View calendar, no Briefing)', () => {
    const { container } = renderHero('parent');
    expect(container.textContent).toMatch(/View calendar/);
    expect(container.textContent).not.toMatch(/Briefing/);
  });

  it('admin-view-as-coach: renders coach variant + contact line stays (admin != coach)', () => {
    const { container } = renderHero('coach');
    expect(container.textContent).toMatch(/Briefing/);
    expect(container.textContent).toMatch(/Coach.*Kenny/);
  });
});
