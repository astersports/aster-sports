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

// R2 — gender capture + hard mismatch block. Shown only for a gendered division.
const GDIV = { name: '11U Girls', gender: 'female' };
const COED = { name: 'Fall Tryouts', gender: 'coed' };
const p = (extra) => ({ first_name: 'Ava', last_name: 'R', dob: '2016-01-01', grade: '5', ...extra });

describe('StepPlayer gender capture + mismatch block (R2)', () => {
  it('gendered division: no group picked → Next disabled, no alert yet', () => {
    render(<StepPlayer player={p({ gender: '' })} division={GDIV} onField={() => {}} onNext={() => {}} />);
    expect(screen.getByRole('group', { name: /division group/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('gendered division: matching group → Next enabled, no alert', () => {
    render(<StepPlayer player={p({ gender: 'female' })} division={GDIV} onField={() => {}} onNext={() => {}} />);
    expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('gendered division: mismatched group → Next disabled + role=alert', () => {
    render(<StepPlayer player={p({ gender: 'male' })} division={GDIV} onField={() => {}} onNext={() => {}} />);
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toMatch(/for girls/i);
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  it('picking a group calls onField(gender, ...)', () => {
    const onField = vi.fn();
    render(<StepPlayer player={p({ gender: '' })} division={GDIV} onField={onField} onNext={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Girls' }));
    expect(onField).toHaveBeenCalledWith('gender', 'female');
  });

  it('coed division: no group control, Next enabled without a gender', () => {
    render(<StepPlayer player={p({ gender: '' })} division={COED} onField={() => {}} onNext={() => {}} />);
    expect(screen.queryByRole('group', { name: /division group/i })).toBeNull();
    expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();
  });
});
