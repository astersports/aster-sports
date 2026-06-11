// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import RosterVisibilityField from '../RosterVisibilityField';

afterEach(cleanup);

describe('RosterVisibilityField (RV-5b 3-state)', () => {
  it('maps Inherit/Show/Hide to null/true/false', () => {
    const onChange = vi.fn();
    render(<RosterVisibilityField value={null} programType="camp" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /show/i }));
    expect(onChange).toHaveBeenLastCalledWith(true);
    fireEvent.click(screen.getByRole('button', { name: /hide/i }));
    expect(onChange).toHaveBeenLastCalledWith(false);
    fireEvent.click(screen.getByRole('button', { name: /inherit/i }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('Inherit shows the resolved program value by type', () => {
    const { rerender } = render(<RosterVisibilityField value={null} programType="season" onChange={vi.fn()} />);
    expect(screen.getByText('Visible')).toBeTruthy();
    rerender(<RosterVisibilityField value={null} programType="camp" onChange={vi.fn()} />);
    expect(screen.getByText('Hidden')).toBeTruthy();
  });

  it('reflects the current selection via aria-pressed', () => {
    render(<RosterVisibilityField value={false} programType="season" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /hide/i }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: /inherit/i }).getAttribute('aria-pressed')).toBe('false');
  });
});
