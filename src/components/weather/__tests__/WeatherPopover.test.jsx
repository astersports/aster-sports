// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import WeatherPopover from '../WeatherPopover';

vi.mock('../../../context/WeatherContext', () => ({
  useWeatherContext: () => ({ fetchDaily: () => Promise.resolve([]) }),
}));

const event = { id: 'e1', start_at: '2026-06-24T18:00:00Z', event_type: 'practice', title: 'Summer Select Practice', teams: { name: '6th Grade Girls' } };
const hour = { icon: '⛅', temp: 78, label: 'Partly cloudy' };

afterEach(cleanup);

describe('WeatherPopover', () => {
  it('renders nothing when there is no matched hour (never fabricate)', () => {
    const { container } = render(<WeatherPopover event={event} hour={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('exposes an accessible trigger carrying the forecast in its label', () => {
    render(<WeatherPopover event={event} hour={hour} />);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-haspopup')).toBe('dialog');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(btn.getAttribute('aria-label')).toContain('Partly cloudy, 78 degrees');
    expect(btn.textContent).toContain('78°');
  });

  it('opens the dialog on click and closes on Escape', () => {
    render(<WeatherPopover event={event} hour={hour} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByRole('dialog')).not.toBeNull();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes on an outside pointer-down', () => {
    render(<WeatherPopover event={event} hour={hour} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByRole('dialog')).not.toBeNull();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
