// @vitest-environment jsdom
//
// §16.4: selectable buttons must announce their state. The wizard's Type /
// Team / chip selections were visual-only (accent border, no aria-pressed) —
// a screen reader couldn't tell which was chosen (events-wizard L99 audit
// 2026-06-13 A7/A9). StepType is the pure representative; the same prop is
// applied across Team + duration/arrival/repeat/home-away chips.

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import StepType from '../StepType';

afterEach(cleanup);

describe('wizard a11y — aria-pressed on selection', () => {
  it('StepType marks the selected type pressed and others not', () => {
    const { getByRole } = render(<StepType value="game" onSelect={() => {}} />);
    expect(getByRole('button', { name: 'Game', pressed: true })).toBeTruthy();
    expect(getByRole('button', { name: 'Practice', pressed: false })).toBeTruthy();
  });
});
