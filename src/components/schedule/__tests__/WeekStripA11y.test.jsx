// @vitest-environment jsdom
//
// SD-8 / R2 gate (RULINGS_SCHEDULE_L99 R2 + SCHEDULE_L99_BUILD_SPEC
// PR-F'): the strip's cells are plain FILTER buttons — aria-pressed,
// not tab roles (they don't switch panels; the tablist semantics were
// lying to screen readers). 44px floor per §7. Dots are props-driven
// from the FILTERED set (SchedulePage passes filtered-derived dates).

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import WeekStrip from '../WeekStrip';

vi.mock('../../../hooks/useNow', () => ({ useNow: () => Date.now() }));

afterEach(cleanup);

describe('WeekStrip — R2 a11y form', () => {
  it('renders 7 plain buttons with aria-pressed; no tab roles anywhere', () => {
    const { container } = render(<WeekStrip eventDates={[]} selectedDate={null} onSelect={() => {}} />);
    expect(container.querySelectorAll('[role="tablist"], [role="tab"]')).toHaveLength(0);
    const buttons = container.querySelectorAll('button[aria-pressed]');
    expect(buttons).toHaveLength(7);
    buttons.forEach((b) => expect(b.getAttribute('aria-pressed')).toBe('false'));
  });

  it('selected day reads aria-pressed=true; 44px tap floor holds', () => {
    const todayNY = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    const { container } = render(<WeekStrip eventDates={[todayNY]} selectedDate={todayNY} onSelect={() => {}} />);
    const pressed = container.querySelectorAll('button[aria-pressed="true"]');
    expect(pressed).toHaveLength(1);
    expect(pressed[0].getAttribute('aria-label')).toContain('has events');
    container.querySelectorAll('button').forEach((b) => {
      expect(b.style.minHeight).toBe('44px');
      expect(b.style.minWidth).toBe('44px');
    });
  });
});
