// @vitest-environment jsdom
//
// ScoreEntrySheet — opponent-required gate (Theme 4 from 2026-05-20
// cross-surface review). Frank flagged on Records: "10U Black W 37-30
// TBD May 17" — a game was scored and published with a blank opponent.
//
// 2026-05-24 (§5-A follow-up): the dead-end warning ("leave and edit the
// event") was replaced with an inline opponent setter so a new user can
// set the opponent without leaving the sheet. The PUBLISH GATE invariant
// is unchanged — Publish stays disabled until an opponent is set. This
// test now locks: (a) inline setter renders when opponent is missing,
// (b) Publish disabled when missing, (c) Publish enabled with a real
// opponent and no inline setter shown.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';

const stubDraft = {
  result: { our_score: 30, opponent_score: 20, quarter_scores: null, player_of_game_id: null, coach_highlight: null, result: 'W', point_differential: 10, published_at: null },
  state: 'idle', lastSaved: null, error: null, isPublished: false,
  updateField: vi.fn(), updateFields: vi.fn(),
  publish: vi.fn(), unpublish: vi.fn(), retry: vi.fn(),
};
vi.mock('../../../hooks/useScoreDraft', () => ({ default: () => stubDraft }));
vi.mock('../../../hooks/useFocusTrap', () => ({ useFocusTrap: () => ({ current: null }) }));
vi.mock('../QuarterScoreInput', () => ({ default: () => null }));
vi.mock('../PlayerOfGamePicker', () => ({ default: () => null }));
// OpponentInlineField pulls useOpponents → AuthContext → supabase; stub
// the data layer so the real component renders in jsdom without env vars.
vi.mock('../../../lib/supabase', () => ({ supabase: { from: () => ({ update: () => ({ eq: () => Promise.resolve({ error: null }) }) }) } }));
vi.mock('../../../hooks/useOpponents', () => ({ useOpponents: () => ({ opponents: [], loading: false, error: null, refetch: vi.fn() }) }));

import ScoreEntrySheet from '../ScoreEntrySheet';

afterEach(cleanup);

const baseEvent = { id: 'e1', team_id: 't1', start_at: '2026-05-17T18:00:00Z' };
const TEAM = { team_color: '#4a8fd4' };

describe('ScoreEntrySheet — opponent-required gate', () => {
  it('null opponent: inline setter renders + Publish disabled', () => {
    const { getByRole, getByLabelText } = render(<ScoreEntrySheet event={{ ...baseEvent, opponent: null }} team={TEAM} onClose={vi.fn()} />);
    expect(getByLabelText('Set opponent')).toBeInTheDocument();
    expect(getByRole('button', { name: /publish/i })).toBeDisabled();
  });

  it('whitespace opponent: same gate as null (treats blank string as missing)', () => {
    const { getByRole, getByLabelText } = render(<ScoreEntrySheet event={{ ...baseEvent, opponent: '   ' }} team={TEAM} onClose={vi.fn()} />);
    expect(getByLabelText('Set opponent')).toBeInTheDocument();
    expect(getByRole('button', { name: /publish/i })).toBeDisabled();
  });

  it('real opponent: Publish enabled + no inline setter (control)', () => {
    const { getByRole, queryByLabelText } = render(<ScoreEntrySheet event={{ ...baseEvent, opponent: 'PHD - McCurdy' }} team={TEAM} onClose={vi.fn()} />);
    expect(queryByLabelText('Set opponent')).toBeNull();
    expect(getByRole('button', { name: /publish/i })).not.toBeDisabled();
  });
});
