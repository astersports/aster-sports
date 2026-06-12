// @vitest-environment jsdom
//
// CP-5 gate (SCHEDULE_L99_BUILD_SPEC §1.3 + §8): countdown is the
// upcoming treatment at EVERY density — the legacy minimal-density
// branch silently dropped it, so the density most parents live in never
// showed the chip. NOW slot shows countdown always; cross-surface
// invariant per CLAUDE.md anti-pattern #43.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EventCard from '../EventCard';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ role: 'parent', myChildren: [] }),
}));
vi.mock('../../../hooks/useNow', () => ({ useNow: () => Date.now() }));
vi.mock('../../../hooks/useMapsUrl', () => ({ useMapsUrl: () => null }));
// ChildRsvp imports lib/supabase (throws at import without env vars in
// vitest — AP #27 class); not under test here.
vi.mock('../../shared/ChildRsvp', () => ({ default: () => null }));

afterEach(cleanup);

const TEAM = { id: 't-1', name: '10U Blue', team_color: '#4a8fd4' };
const event = () => ({
  id: 'e-1', team_id: 't-1', event_type: 'practice', status: 'scheduled',
  start_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
  end_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
  teams: TEAM, location_name: 'Test Gym',
});

describe('EventCard — countdown renders at every density (CP-5)', () => {
  it.each(['minimal', 'maximum'])('NOW-slot card shows countdown at density=%s', (density) => {
    const { container } = render(
      <MemoryRouter><EventCard event={event()} isNext density={density} /></MemoryRouter>
    );
    expect(container.textContent).toMatch(/in \d+h|in \d+m/);
  });

  it('non-next upcoming card inside 24h also shows countdown at minimal density', () => {
    const { container } = render(
      <MemoryRouter><EventCard event={event()} isNext={false} density="minimal" /></MemoryRouter>
    );
    expect(container.textContent).toMatch(/in \d+h|in \d+m/);
  });

  it('happening_now card shows the Live treatment instead of a countdown', () => {
    const liveEvent = { ...event(), start_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), end_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() };
    const { container } = render(
      <MemoryRouter><EventCard event={liveEvent} density="minimal" /></MemoryRouter>
    );
    expect(container.textContent).toMatch(/Happening now/);
    expect(container.textContent).not.toMatch(/in \d+m/);
  });
});
