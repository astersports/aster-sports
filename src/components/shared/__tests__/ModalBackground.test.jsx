// @vitest-environment jsdom
//
// ModalBackground unit tests — locks the canonical backdrop contract
// from CLAUDE.md §7 + anti-pattern #11: backdrop is rgba(0,0,0,0.3),
// onClick fires on backdrop tap, zIndex defaults to 1000, full-screen
// fixed inset per anti-pattern #18.

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import ModalBackground from '../ModalBackground';

describe('ModalBackground', () => {
  it('renders children inside the backdrop', () => {
    const { getByTestId } = render(
      <ModalBackground onClick={() => {}}>
        <div data-testid="child">hello</div>
      </ModalBackground>
    );
    expect(getByTestId('child').textContent).toBe('hello');
  });

  it('fires onClick when backdrop is tapped', () => {
    const onClick = vi.fn();
    const { container } = render(
      <ModalBackground onClick={onClick}>
        <div>content</div>
      </ModalBackground>
    );
    fireEvent.click(container.firstChild);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('defaults zIndex to 1000', () => {
    const { container } = render(
      <ModalBackground onClick={() => {}}>
        <div>content</div>
      </ModalBackground>
    );
    expect(container.firstChild.style.zIndex).toBe('1000');
  });

  it('honors custom zIndex prop', () => {
    const { container } = render(
      <ModalBackground onClick={() => {}} zIndex={9998}>
        <div>content</div>
      </ModalBackground>
    );
    expect(container.firstChild.style.zIndex).toBe('9998');
  });

  it('uses the canonical rgba(0,0,0,0.3) backdrop (anti-pattern #11)', () => {
    const { container } = render(
      <ModalBackground onClick={() => {}}>
        <div>content</div>
      </ModalBackground>
    );
    // jsdom normalises rgba(0,0,0,0.3) to rgba(0, 0, 0, 0.3)
    expect(container.firstChild.style.backgroundColor).toBe('rgba(0, 0, 0, 0.3)');
    expect(container.firstChild.style.position).toBe('fixed');
    expect(container.firstChild.style.inset).toBe('0px');
  });
});
