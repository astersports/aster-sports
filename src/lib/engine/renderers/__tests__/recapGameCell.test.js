// recap_game_cell renderer — per-game framed cell. AP#46 guard: cells keep a
// consistent rhythm whether the matchup wraps to one or two lines (Frank-
// reported 2026-06-08: the one-line "2nd box" rendered noticeably shorter).

import { describe, expect, it } from 'vitest';
import render from '../recapGameCell';

const ONE_LINE = { kind: 'recap_game_cell', team_color: '#06b6d4', date_label: 'Sat · May 2', matchup: '9U Boys vs St Barnabas 3AB', context: 'CYO Spellman', our_score: 8, opponent_score: 30, result: 'L' };
const TWO_LINE = { kind: 'recap_game_cell', team_color: '#94a3b8', date_label: 'Sat · May 2', matchup: '10U Blue vs Resurrection White 4AB', context: 'CYO Spellman', our_score: 2, opponent_score: 0, result: 'W' };

describe('renderRecapGameCell', () => {
  it('content cell reserves a min-height so 1-line and 2-line matchups keep rhythm (AP#46)', () => {
    expect(render(ONE_LINE).html).toContain('min-height:80px');
    expect(render(TWO_LINE).html).toContain('min-height:80px');
  });

  it('renders the per-cell team_color rail, score, and result pill', () => {
    const { html } = render(ONE_LINE);
    expect(html).toContain('#06b6d4');
    expect(html).toContain('LOSS');
    expect(html).toContain('8');
    expect(html).toContain('30');
  });
});
