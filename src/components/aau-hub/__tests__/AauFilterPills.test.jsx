// @vitest-environment jsdom
//
// AauFilterPills — the reusable Hub filter-pill row (R1·PR-A). Locks the
// interactive contract: renders one pressable pill per option with the active
// one aria-pressed, fires onChange with the option key, renders the optional
// count, and renders nothing for an empty option set.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import AauFilterPills from '../AauFilterPills';

afterEach(cleanup);

const OPTIONS = [
  { key: 'all', label: 'All', count: 3 },
  { key: 'live', label: 'Live', count: 1 },
];

describe('AauFilterPills', () => {
  it('renders a pill per option with the active one pressed + the count', () => {
    const { getByRole } = render(<AauFilterPills options={OPTIONS} value="live" onChange={() => {}} />);
    expect(getByRole('button', { name: /All · 3/ }).getAttribute('aria-pressed')).toBe('false');
    expect(getByRole('button', { name: /Live · 1/ }).getAttribute('aria-pressed')).toBe('true');
  });

  it('fires onChange with the option key when a pill is tapped', () => {
    const onChange = vi.fn();
    const { getByRole } = render(<AauFilterPills options={OPTIONS} value="all" onChange={onChange} />);
    fireEvent.click(getByRole('button', { name: /Live/ }));
    expect(onChange).toHaveBeenCalledWith('live');
  });

  it('omits the count separator when count is absent, and renders nothing for empty options', () => {
    const { getByRole } = render(<AauFilterPills options={[{ key: 'x', label: 'Just X' }]} value="x" onChange={() => {}} />);
    expect(getByRole('button').textContent).toBe('Just X');
    cleanup();
    const empty = render(<AauFilterPills options={[]} value={null} onChange={() => {}} />);
    expect(empty.container.firstChild).toBeNull();
  });
});
