// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import RainAlertBanner from '../RainAlertBanner';

// Stable fetchDaily reference (the real one is useMemo-stable) so the effect
// doesn't loop; tests mutate mock.state.rows.
const mock = vi.hoisted(() => {
  const state = { rows: [] };
  return { state, fetchDaily: () => Promise.resolve(state.rows) };
});
vi.mock('../../../context/WeatherContext', () => ({
  useWeatherContext: () => ({ fetchDaily: mock.fetchDaily }),
}));

const soon = new Date(Date.now() + 2 * 86400000).toISOString(); // inside 10-day window
const event = { id: 'e1', start_at: soon };

afterEach(() => { cleanup(); sessionStorage.clear(); mock.state.rows = []; });

describe('RainAlertBanner', () => {
  it('renders nothing when there is no next event', () => {
    const { container } = render(<RainAlertBanner event={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when precip is under threshold', async () => {
    mock.state.rows = [{ rn: '20% rain' }];
    render(<RainAlertBanner event={event} />);
    await act(async () => { await Promise.resolve(); });
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('shows a SNOW heads-up over threshold with snow-specific copy', async () => {
    mock.state.rows = [{ rn: '80% snow' }];
    render(<RainAlertBanner event={event} />);
    const el = await screen.findByRole('status');
    expect(el.textContent).toMatch(/Looks like snow/);
  });

  it('dismiss persists in sessionStorage', async () => {
    mock.state.rows = [{ rn: '70% rain' }];
    render(<RainAlertBanner event={event} />);
    await screen.findByRole('status');
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(screen.queryByRole('status')).toBeNull();
    expect(sessionStorage.getItem('rainbanner:dismissed:e1')).toBe('1');
  });
});
