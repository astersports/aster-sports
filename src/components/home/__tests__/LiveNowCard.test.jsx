// @vitest-environment jsdom
//
// §4.C Sprint C LIVE NOW card render contract.
// Verifies: hidden when empty, renders per (kid × event) item,
// link target is /events/<id>, countdown shape, multi-item case.

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LiveNowCard from '../LiveNowCard';

afterEach(() => cleanup());

function withRouter(node) {
  return <MemoryRouter>{node}</MemoryRouter>;
}

// Anchor "now" at a fixed point so countdown text is deterministic.
const NOW = new Date('2026-05-23T18:22:00-04:00').getTime();

const ITEM = (over = {}) => ({
  event_id: 'e1',
  kid_first_name: 'Charlie',
  event_title: '11U Girls Practice',
  start_at: '2026-05-23T18:00:00-04:00',
  end_at: '2026-05-23T19:00:00-04:00',
  team_color: '#a78bfa',
  team_name: '11U Girls',
  ...over,
});

describe('LiveNowCard', () => {
  it('renders nothing when items is empty', () => {
    const { container } = render(withRouter(<LiveNowCard items={[]} nowMs={NOW} />));
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when items is null', () => {
    const { container } = render(withRouter(<LiveNowCard items={null} nowMs={NOW} />));
    expect(container.firstChild).toBeNull();
  });

  it('renders one card per item with kid + event title', () => {
    render(withRouter(<LiveNowCard items={[ITEM()]} nowMs={NOW} />));
    expect(screen.getByText('Charlie at 11U Girls Practice')).toBeInTheDocument();
    expect(screen.getByText(/Happening now/i)).toBeInTheDocument();
  });

  it('renders countdown subline with end time + remaining', () => {
    render(withRouter(<LiveNowCard items={[ITEM()]} nowMs={NOW} />));
    // 38 min remaining (ends at 19:00, now is 18:22 ET)
    expect(screen.getByText(/Ends 7:00 PM/)).toBeInTheDocument();
    expect(screen.getByText(/in 38 min/)).toBeInTheDocument();
  });

  it('link target is /events/<event_id>', () => {
    render(withRouter(<LiveNowCard items={[ITEM({ event_id: 'evt-abc' })]} nowMs={NOW} />));
    expect(screen.getByRole('link').getAttribute('href')).toBe('/events/evt-abc');
  });

  it('handles hours+minutes countdown for >1h remaining', () => {
    const item = ITEM({
      start_at: '2026-05-23T18:00:00-04:00',
      end_at: '2026-05-23T20:30:00-04:00',
    });
    // Now=18:22; end=20:30 → 128 min = 2h 8m
    render(withRouter(<LiveNowCard items={[item]} nowMs={NOW} />));
    expect(screen.getByText(/in 2h 8m/)).toBeInTheDocument();
  });

  it('renders multiple cards for multi-kid case', () => {
    const items = [
      ITEM({ event_id: 'e1', kid_first_name: 'Charlie' }),
      ITEM({ event_id: 'e2', kid_first_name: 'Milo', event_title: '8U Boys Game' }),
    ];
    render(withRouter(<LiveNowCard items={items} nowMs={NOW} />));
    expect(screen.getByText('Charlie at 11U Girls Practice')).toBeInTheDocument();
    expect(screen.getByText('Milo at 8U Boys Game')).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });
});
