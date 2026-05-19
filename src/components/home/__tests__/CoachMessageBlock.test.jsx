// @vitest-environment jsdom
//
// §4.C Sprint C CoachMessageBlock render contract.

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CoachMessageBlock from '../CoachMessageBlock';

afterEach(() => cleanup());

function withRouter(node) {
  return <MemoryRouter>{node}</MemoryRouter>;
}

const NOW = new Date('2026-05-23T18:00:00Z').getTime();

const M = (over = {}) => ({
  id: 'm-1',
  team_id: 't-1',
  sender_id: 'u-1',
  sender_name: 'Coach Kenny',
  body: 'Hey families, bring a water bottle tonight — no fountain in gym 3.',
  created_at: '2026-05-23T16:00:00Z',
  pinned: false,
  teams: { id: 't-1', name: '11U Girls', team_color: '#a78bfa' },
  ...over,
});

describe('CoachMessageBlock', () => {
  it('renders nothing when messages empty', () => {
    const { container } = render(withRouter(<CoachMessageBlock messages={[]} nowMs={NOW} />));
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when messages null', () => {
    const { container } = render(withRouter(<CoachMessageBlock messages={null} nowMs={NOW} />));
    expect(container.firstChild).toBeNull();
  });

  it('renders sender + team name in header', () => {
    render(withRouter(<CoachMessageBlock messages={[M()]} nowMs={NOW} />));
    expect(screen.getByText('Coach Kenny · 11U Girls')).toBeInTheDocument();
  });

  it('renders relative time (2h ago)', () => {
    render(withRouter(<CoachMessageBlock messages={[M()]} nowMs={NOW} />));
    expect(screen.getByText('2h ago')).toBeInTheDocument();
  });

  it('renders "just now" for sub-minute messages', () => {
    render(withRouter(<CoachMessageBlock messages={[M({ created_at: '2026-05-23T17:59:30Z' })]} nowMs={NOW} />));
    expect(screen.getByText(/just now/i)).toBeInTheDocument();
  });

  it('renders message body', () => {
    render(withRouter(<CoachMessageBlock messages={[M()]} nowMs={NOW} />));
    expect(screen.getByText(/bring a water bottle/)).toBeInTheDocument();
  });

  it('link target is /messages?team=<id>', () => {
    render(withRouter(<CoachMessageBlock messages={[M({ team_id: 'team-abc' })]} nowMs={NOW} />));
    expect(screen.getByRole('link').getAttribute('href')).toBe('/messages?team=team-abc');
  });

  it('falls back to "Coach" when sender_name missing', () => {
    render(withRouter(<CoachMessageBlock messages={[M({ sender_name: null })]} nowMs={NOW} />));
    expect(screen.getByText(/Coach · 11U Girls/)).toBeInTheDocument();
  });

  it('renders multiple cards (one per team)', () => {
    const items = [
      M({ id: 'm1', team_id: 't1', teams: { id: 't1', name: '11U Girls', team_color: '#a78bfa' } }),
      M({ id: 'm2', team_id: 't2', teams: { id: 't2', name: '8U Boys', team_color: '#f59e0b' }, sender_name: 'Coach Frank' }),
    ];
    render(withRouter(<CoachMessageBlock messages={items} nowMs={NOW} />));
    expect(screen.getByText(/11U Girls/)).toBeInTheDocument();
    expect(screen.getByText(/8U Boys/)).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });
});
