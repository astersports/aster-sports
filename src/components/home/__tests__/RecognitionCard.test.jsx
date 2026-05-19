// @vitest-environment jsdom
//
// §4.C Sprint C RecognitionCard render contract.

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RecognitionCard from '../RecognitionCard';

afterEach(() => cleanup());

function withRouter(node) {
  return <MemoryRouter>{node}</MemoryRouter>;
}

const NOW = new Date('2026-05-23T18:00:00Z').getTime();

const A = (over = {}) => ({
  id: 'a-1',
  team_id: 't-1',
  achievement_type: 'win',
  custom_title: null,
  description: null,
  badge_emoji: '🏆',
  badge_color: null,
  opponent_team_name: 'NY Blaze',
  event_location: null,
  confirmed_at: '2026-05-23T17:00:00Z',
  earned_at: '2026-05-23T17:00:00Z',
  teams: { id: 't-1', name: '11U Girls', team_color: '#a78bfa' },
  ...over,
});

describe('RecognitionCard', () => {
  it('renders nothing when achievements empty', () => {
    const { container } = render(withRouter(<RecognitionCard achievements={[]} nowMs={NOW} />));
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when achievements null', () => {
    const { container } = render(withRouter(<RecognitionCard achievements={null} nowMs={NOW} />));
    expect(container.firstChild).toBeNull();
  });

  it('uses custom_title when present', () => {
    render(withRouter(<RecognitionCard achievements={[A({ custom_title: '11U Girls won Metro Showdown!' })]} nowMs={NOW} />));
    expect(screen.getByText('11U Girls won Metro Showdown!')).toBeInTheDocument();
  });

  it('falls back to type-aware composition when no custom_title', () => {
    render(withRouter(<RecognitionCard achievements={[A({ achievement_type: 'win', opponent_team_name: 'NY Blaze' })]} nowMs={NOW} />));
    expect(screen.getByText('11U Girls beat NY Blaze')).toBeInTheDocument();
  });

  it('renders championship type', () => {
    render(withRouter(<RecognitionCard achievements={[A({ achievement_type: 'championship', opponent_team_name: null })]} nowMs={NOW} />));
    expect(screen.getByText('11U Girls won the championship')).toBeInTheDocument();
  });

  it('renders relative time (1h ago)', () => {
    render(withRouter(<RecognitionCard achievements={[A()]} nowMs={NOW} />));
    expect(screen.getByText(/1h AGO/i)).toBeInTheDocument();
  });

  it('renders JUST NOW for sub-minute', () => {
    render(withRouter(<RecognitionCard achievements={[A({ confirmed_at: '2026-05-23T17:59:30Z' })]} nowMs={NOW} />));
    expect(screen.getByText(/JUST NOW/i)).toBeInTheDocument();
  });

  it('link target is /teams/<team_id>', () => {
    render(withRouter(<RecognitionCard achievements={[A({ team_id: 'team-abc' })]} nowMs={NOW} />));
    expect(screen.getByRole('link').getAttribute('href')).toBe('/teams/team-abc');
  });

  it('renders multiple cards', () => {
    const items = [
      A({ id: 'a1', custom_title: 'First win' }),
      A({ id: 'a2', custom_title: 'Second win' }),
    ];
    render(withRouter(<RecognitionCard achievements={items} nowMs={NOW} />));
    expect(screen.getByText('First win')).toBeInTheDocument();
    expect(screen.getByText('Second win')).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });
});
