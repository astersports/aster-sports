// @vitest-environment jsdom
//
// TournamentCard — record-rendering invariant (Theme 7 from 2026-05-20
// cross-surface review). Frank flagged on Records: Rumble for the Ring
// CT showed 8U Boys "1-2" but 11U Girls (Finalists 3-2) and 10U Black
// (Champions 4-0) rendered without their W/L because the prior gate
// was `!final_place && hasRecord` — podium finishers were silently
// stripped. Confirmed via Supabase MCP that all three rows have real
// final_record_wins/losses.

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import TournamentCard from '../TournamentCard';

afterEach(cleanup);

const TEAM_GIRLS = { id: 't-11g', name: '11U Girls', team_color: '#a78bfa' };
const TEAM_BLACK = { id: 't-10b', name: '10U Black', team_color: '#4a8fd4' };
const TEAM_BOYS = { id: 't-8b', name: '8U Boys', team_color: '#f59e0b' };

const tournament = {
  id: 'tr-1', name: 'Rumble for the Ring CT',
  start_date: '2026-05-16', end_date: '2026-05-17',
  display_status: 'Complete',
  participants: [
    { team: TEAM_GIRLS, final_place: 'Finalists', final_record_wins: 3, final_record_losses: 2 },
    { team: TEAM_BLACK, final_place: 'Champions', final_record_wins: 4, final_record_losses: 0 },
    { team: TEAM_BOYS, final_place: null, final_record_wins: 1, final_record_losses: 2 },
  ],
};

describe('TournamentCard — record rendering invariant', () => {
  it('Champions / Finalists / null-place all render their W/L on Complete tournaments', () => {
    const { container } = render(<TournamentCard tournament={tournament} />);
    expect(container.textContent).toMatch(/3.{0,2}2/); // 11U Girls 3-2 (en-dash or hyphen)
    expect(container.textContent).toMatch(/4.{0,2}0/); // 10U Black 4-0
    expect(container.textContent).toMatch(/1.{0,2}2/); // 8U Boys 1-2
  });

  it('upcoming tournament suppresses records (control)', () => {
    const upcoming = { ...tournament, display_status: 'Upcoming' };
    const { container } = render(<TournamentCard tournament={upcoming} />);
    // No record text — participants render as chips only
    expect(container.textContent).not.toMatch(/3.{0,2}2/);
    expect(container.textContent).not.toMatch(/4.{0,2}0/);
  });

  it('completed tournament with all-zero records suppresses the W/L chip (no false data)', () => {
    const zeros = {
      ...tournament,
      participants: [{ team: TEAM_GIRLS, final_place: null, final_record_wins: 0, final_record_losses: 0 }],
    };
    const { container } = render(<TournamentCard tournament={zeros} />);
    expect(container.textContent).not.toMatch(/0.{0,2}0/);
  });
});
