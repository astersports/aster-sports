// @vitest-environment jsdom
//
// §4.C Sprint B ACTION ZONE — render contract.
// Locks: hidden when empty (load complete OR loading), renders one
// link per item with kid name + event when present, link target is
// /events/<id>.

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ActionZone from '../ActionZone';

afterEach(() => cleanup());

function withRouter(node) {
  return <MemoryRouter>{node}</MemoryRouter>;
}

const ITEM = (over = {}) => ({
  kind: 'rsvp_pending',
  primary: 'Charlie: RSVP needed',
  event_id: 'e1',
  player_id: 'p1',
  kid_first_name: 'Charlie',
  start_at: '2026-05-23T15:30:00Z',
  event_title: '11U Girls Practice',
  team_name: '11U Girls',
  team_color: '#a78bfa',
  ...over,
});

describe('ActionZone', () => {
  it('renders nothing while loading (even with items)', () => {
    const { container } = render(withRouter(<ActionZone items={[ITEM()]} loading />));
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when items is empty (loading done)', () => {
    const { container } = render(withRouter(<ActionZone items={[]} loading={false} />));
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when items is null/undefined', () => {
    const { container } = render(withRouter(<ActionZone items={null} loading={false} />));
    expect(container.firstChild).toBeNull();
  });

  it('renders headline + 1 item for single item', () => {
    render(withRouter(<ActionZone items={[ITEM()]} loading={false} />));
    expect(screen.getByText(/1 THING TO HANDLE/i)).toBeInTheDocument();
    expect(screen.getByText(/Charlie: RSVP needed/)).toBeInTheDocument();
  });

  it('renders pluralized headline for multiple items', () => {
    const items = [
      ITEM({ event_id: 'e1', kid_first_name: 'Charlie' }),
      ITEM({ event_id: 'e2', kid_first_name: 'Milo', primary: 'Milo: RSVP needed' }),
    ];
    render(withRouter(<ActionZone items={items} loading={false} />));
    expect(screen.getByText(/2 THINGS TO HANDLE/i)).toBeInTheDocument();
  });

  it('mixes signals via item.primary (RSVP + Ride)', () => {
    const items = [
      ITEM({ event_id: 'e1', kind: 'rsvp_pending', primary: 'Charlie: RSVP needed' }),
      ITEM({ event_id: 'e2', kind: 'ride_needed',  primary: 'Milo: Ride needed', player_id: 'p2' }),
    ];
    render(withRouter(<ActionZone items={items} loading={false} />));
    expect(screen.getByText('Charlie: RSVP needed')).toBeInTheDocument();
    expect(screen.getByText('Milo: Ride needed')).toBeInTheDocument();
  });

  it('handles per-event signals with null player_id (volunteer slot)', () => {
    const items = [
      ITEM({ event_id: 'e1', kind: 'volunteer_slot', primary: '2 volunteer slots open', player_id: null }),
    ];
    render(withRouter(<ActionZone items={items} loading={false} />));
    expect(screen.getByText('2 volunteer slots open')).toBeInTheDocument();
    // Verify the link target still resolves (key handles null player_id)
    expect(screen.getByRole('link').getAttribute('href')).toBe('/events/e1');
  });

  it('each item links to /events/<event_id>', () => {
    const items = [
      ITEM({ event_id: 'e-123', kid_first_name: 'Charlie' }),
      ITEM({ event_id: 'e-456', kid_first_name: 'Milo' }),
    ];
    render(withRouter(<ActionZone items={items} loading={false} />));
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute('href')).toBe('/events/e-123');
    expect(links[1].getAttribute('href')).toBe('/events/e-456');
  });

  it('renders human-readable date in secondary line', () => {
    render(withRouter(<ActionZone items={[ITEM()]} loading={false} />));
    // 2026-05-23 in ET → "Sat, May 23"
    expect(screen.getByText(/Sat, May 23/)).toBeInTheDocument();
    expect(screen.getByText(/11U Girls Practice/)).toBeInTheDocument();
  });
});
