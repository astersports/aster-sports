// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SegmentedControl from '../SegmentedControl';

afterEach(cleanup);
const OPTS = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }];

describe('SegmentedControl', () => {
  it('renders a radiogroup with the selected option checked', () => {
    render(<SegmentedControl label="Test" value="b" onChange={() => {}} options={OPTS} />);
    expect(screen.getByRole('radiogroup', { name: 'Test' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Beta' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Alpha' })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange with the option value', async () => {
    const onChange = vi.fn();
    render(<SegmentedControl label="Test" value="a" onChange={onChange} options={OPTS} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Beta' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
