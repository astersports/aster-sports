// @vitest-environment jsdom
//
// RideIndicator unit tests — locks the count pluralisation, kind-based
// color/label switch, urgent escalation, and compact size deltas.
// Visual rhythm guard per CLAUDE.md anti-pattern #46.

import { describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import RideIndicator from '../RideIndicator';

describe('RideIndicator', () => {
  it('renders nothing for zero/missing count', () => {
    const { container } = render(<RideIndicator count={0} />);
    expect(container.firstChild).toBeNull();
    cleanup();
    const empty = render(<RideIndicator />);
    expect(empty.container.firstChild).toBeNull();
  });

  it('pluralises requests label correctly', () => {
    const a = render(<RideIndicator count={1} kind="requests" />);
    expect(a.container.textContent).toBe('1 ride needed');
    cleanup();
    const b = render(<RideIndicator count={3} kind="requests" />);
    expect(b.container.textContent).toBe('3 rides needed');
  });

  it('pluralises offers label correctly', () => {
    const a = render(<RideIndicator count={1} kind="offers" />);
    expect(a.container.textContent).toBe('1 seat');
    cleanup();
    const b = render(<RideIndicator count={4} kind="offers" />);
    expect(b.container.textContent).toBe('4 seats');
  });

  it('escalates color to danger when urgent', () => {
    const { container } = render(<RideIndicator count={2} kind="requests" urgent />);
    const label = container.querySelector('span > span');
    expect(label.style.color).toContain('em-danger');
  });

  it('compact mode shrinks fontSize from 13 to 12', () => {
    const full = render(<RideIndicator count={2} kind="requests" />);
    expect(full.container.firstChild.style.fontSize).toBe('13px');
    cleanup();
    const compact = render(<RideIndicator count={2} kind="requests" compact />);
    expect(compact.container.firstChild.style.fontSize).toBe('12px');
  });

  it('offers kind uses neutral secondary color even when urgent flag is set', () => {
    // urgent only affects requests — offers stay secondary.
    const { container } = render(<RideIndicator count={2} kind="offers" urgent />);
    const label = container.querySelector('span > span');
    expect(label.style.color).toContain('em-text-secondary');
  });
});
