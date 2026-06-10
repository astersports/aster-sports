// @vitest-environment jsdom
//
// B3 — StepPlayer hard grade-band block (architect ruling: no soft-warn-then-
// server-reject). Out-of-band grade ⇒ Next disabled + a role=alert that names the
// band and the player's grade. In-band ⇒ Next enabled, no alert.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import StepPlayer from '../StepPlayer';

afterEach(cleanup);

const DIV = { name: '9U Boys', grade_min: 3, grade_max: 4 };
const player = (grade) => ({ first_name: 'Milo', last_name: 'D', dob: '2018-01-01', grade });

describe('StepPlayer grade-band hard block (B3)', () => {
  it('blocks Next + shows a role=alert when the grade is below the band', () => {
    const onNext = vi.fn();
    render(<StepPlayer player={player('2')} division={DIV} onField={() => {}} onNext={onNext} />);
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toMatch(/grades 3–4/);
    expect(alert.textContent).toMatch(/grade 2/);
    const next = screen.getByRole('button', { name: /next/i });
    expect(next).toBeDisabled();
    fireEvent.click(next);
    expect(onNext).not.toHaveBeenCalled();
  });

  it('blocks Next when the grade is above the band', () => {
    render(<StepPlayer player={player('6')} division={DIV} onField={() => {}} onNext={() => {}} />);
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  it('enables Next with no alert when the grade fits the band', () => {
    render(<StepPlayer player={player('3')} division={DIV} onField={() => {}} onNext={() => {}} />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();
  });
});
