// @vitest-environment jsdom
//
// PR-B inline kind chips: only the 5 manual kinds (the 6 auto kinds live in
// Radar), selected-state, and pick dispatch (kind + meta).

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import InlineKindChips from '../InlineKindChips';
import { MANUAL_KINDS } from '../../../lib/briefings/composeKinds';

afterEach(cleanup);

describe('InlineKindChips', () => {
  it('exposes exactly the 5 manual kinds and renders one chip each', () => {
    expect(MANUAL_KINDS).toEqual(['announcement', 'custom_message', 'games_recap', 'coach_roundup', 'family_guide']);
    render(<InlineKindChips selected={null} onPick={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  it('marks the selected chip pressed and dispatches kind + meta on pick', () => {
    const onPick = vi.fn();
    render(<InlineKindChips selected="games_recap" onPick={onPick} />);
    const btns = screen.getAllByRole('button');
    expect(btns.filter((b) => b.getAttribute('aria-pressed') === 'true')).toHaveLength(1);
    fireEvent.click(btns[0]); // first chip = announcement
    expect(onPick).toHaveBeenCalledWith('announcement', expect.objectContaining({ label: expect.any(String) }));
  });
});
