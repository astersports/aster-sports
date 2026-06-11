// @vitest-environment jsdom
//
// B3 funnel select step. Locks: eligible kids select + Continue returns picks
// carrying player_id (the dedupe fix); an ineligible kid (RG-3) and an
// already-registered kid (RG-4) are disabled/non-selectable; "Add a child who
// isn't listed" routes to manual entry.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import StepSelectChildren from '../StepSelectChildren';

afterEach(cleanup);

const kids = [
  { player_id: 'p1', first_name: 'Charlie', grade: 5, gender: 'female', alreadyRegistered: false },
  { player_id: 'p2', first_name: 'Milo', grade: 2, gender: 'male', alreadyRegistered: false },
  { player_id: 'p3', first_name: 'Registered', grade: 5, gender: 'female', alreadyRegistered: true },
];
const division = { grade_min: 4, grade_max: 6, gender: 'coed' }; // Milo (gr2) below band

describe('StepSelectChildren', () => {
  it('selecting eligible kids → Continue returns picks with player_id', () => {
    const onContinue = vi.fn();
    render(<StepSelectChildren kids={kids} division={division} onContinue={onContinue} onAddNew={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /^Charlie/ }));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onContinue).toHaveBeenCalledTimes(1);
    const picks = onContinue.mock.calls[0][0];
    expect(picks).toHaveLength(1);
    expect(picks[0].player_id).toBe('p1');
  });

  it('an ineligible kid (RG-3) is disabled and shows the reason', () => {
    render(<StepSelectChildren kids={kids} division={division} onContinue={vi.fn()} onAddNew={vi.fn()} />);
    const milo = screen.getByRole('button', { name: /^Milo/ });
    expect(milo).toBeDisabled();
    expect(milo.getAttribute('aria-label')).toMatch(/below this group/);
  });

  it('an already-registered kid (RG-4) is disabled with the badge', () => {
    render(<StepSelectChildren kids={kids} division={division} onContinue={vi.fn()} onAddNew={vi.fn()} />);
    const reg = screen.getByRole('button', { name: /^Registered/ });
    expect(reg).toBeDisabled();
    expect(reg.getAttribute('aria-label')).toMatch(/Already registered/);
  });

  it('Continue is disabled until at least one child is selected', () => {
    render(<StepSelectChildren kids={kids} division={division} onContinue={vi.fn()} onAddNew={vi.fn()} />);
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });

  it('"Add a child who isn\'t listed" routes to manual entry', () => {
    const onAddNew = vi.fn();
    render(<StepSelectChildren kids={kids} division={division} onContinue={vi.fn()} onAddNew={onAddNew} />);
    fireEvent.click(screen.getByRole('button', { name: /add a child who isn/i }));
    expect(onAddNew).toHaveBeenCalledTimes(1);
  });
});
