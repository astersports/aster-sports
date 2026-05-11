// @vitest-environment jsdom
//
// Wave 4.4-B Session 5b — KindTile component test. Verifies render
// shape, click behavior, disabled handling, and conditional usage line.
// Per-file env opt-in (jsdom); afterEach(cleanup) matches the
// DevicePreviewFrame.test.jsx pattern.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KindTile from '../KindTile';

afterEach(cleanup);

const META = {
  label: 'Weekly digest',
  description: 'Monday-morning week-ahead summary, per family interleaved',
  icon: 'CalendarDays',
};

function setup({ disabled = false, usage = null, onClick = vi.fn() } = {}) {
  const utils = render(
    <KindTile kind="weekly_digest" meta={META} usage={usage} disabled={disabled} onClick={onClick} />,
  );
  return { user: userEvent.setup(), onClick, ...utils };
}

describe('KindTile', () => {
  it('a. renders meta.label as visible text', () => {
    setup();
    expect(screen.getByText('Weekly digest')).toBeInTheDocument();
  });

  it('b. renders meta.description with 2-line clamp style applied', () => {
    setup();
    const desc = screen.getByText(/Monday-morning week-ahead summary/);
    // -webkit-line-clamp:2 + -webkit-box-orient:vertical compose the clamp.
    // React's style camelCase → DOM kebab-case via the style attribute.
    expect(desc.style.getPropertyValue('-webkit-line-clamp')).toBe('2');
    expect(desc.style.getPropertyValue('-webkit-box-orient')).toBe('vertical');
  });

  it('c. fires onClick(kind) when the tile is clicked', async () => {
    const { user, onClick } = setup();
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith('weekly_digest');
  });

  it('d. aria-disabled=true + no click fire when disabled', async () => {
    const { user, onClick } = setup({ disabled: true });
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    expect(btn).toBeDisabled();
    await user.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('e. renders "Last sent" line when usage.lastSentAt is set; omits when null', () => {
    const { rerender } = setup({ usage: { lastSentAt: Date.now() - 2 * 86400000, count: 3 } });
    expect(screen.getByTestId('usage-line')).toBeInTheDocument();
    expect(screen.getByTestId('usage-line').textContent).toMatch(/2d ago/);
    // omit case
    rerender(<KindTile kind="weekly_digest" meta={META} usage={{ lastSentAt: null, count: 0 }} disabled={false} onClick={() => {}} />);
    expect(screen.queryByTestId('usage-line')).not.toBeInTheDocument();
  });
});
