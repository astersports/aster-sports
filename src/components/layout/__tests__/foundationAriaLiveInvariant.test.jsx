// @vitest-environment jsdom
//
// Cross-surface invariant test per CLAUDE.md anti-pattern #43.
//
// Foundation state-changing surfaces (toast announcements, offline
// banner, unread-badge nav item) MUST carry aria-live regions and
// dynamic aria-labels per §16.4 (Accessibility is table stakes).
//
// L99 Foundation audit origin (Batch 1: P2.1, P2.2, P3.4):
// - ToastProvider rendered a fixed-position toast div without
//   role=status / aria-live=polite. Screen readers got no
//   announcement when a toast fired.
// - AppShell offline banner rendered without role=status / aria-live.
//   Going-offline state change was silent for SR users.
// - BottomNav Messages NavLink carried a static aria-label="Messages"
//   regardless of unread state. SR users got no signal that the red
//   badge dot meant unread messages.
//
// This test locks the discipline. Any future PR that drops aria-live
// from a state-changing foundation surface, or static-aria-labels a
// dynamic state, fails this test.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useContext } from 'react';
import { ToastProvider } from '../../../context/ToastProvider';
import { ToastContext } from '../../../context/ToastContext';

vi.mock('../../../hooks/useOnlineStatus', () => ({
  useOnlineStatus: vi.fn(),
}));
vi.mock('../../../hooks/useHasUnread', () => ({
  useHasUnread: vi.fn(),
}));
vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ role: 'admin' }),
}));
vi.mock('../Header', () => ({
  default: () => null,
}));

const { useOnlineStatus } = await import('../../../hooks/useOnlineStatus');
const { useHasUnread } = await import('../../../hooks/useHasUnread');
const { default: AppShell } = await import('../AppShell');
const { default: BottomNav } = await import('../BottomNav');

afterEach(cleanup);

function ToastTrigger({ message, variant }) {
  const { showToast } = useContext(ToastContext);
  return (
    <button type="button" onClick={() => showToast(message, variant)}>fire</button>
  );
}

describe('Foundation aria-live invariant (anti-pattern #43 + §16.4)', () => {
  it('ToastProvider success toast carries role=status + aria-live=polite', () => {
    const { container, getByText } = render(
      <ToastProvider>
        <ToastTrigger message="Saved" variant="success" />
      </ToastProvider>,
    );
    act(() => { getByText('fire').click(); });
    const live = container.querySelector('[aria-live]');
    expect(live).not.toBeNull();
    expect(live.getAttribute('role')).toBe('status');
    expect(live.getAttribute('aria-live')).toBe('polite');
  });

  it('ToastProvider error toast escalates to role=alert + aria-live=assertive', () => {
    const { container, getByText } = render(
      <ToastProvider>
        <ToastTrigger message="Boom" variant="error" />
      </ToastProvider>,
    );
    act(() => { getByText('fire').click(); });
    const live = container.querySelector('[aria-live]');
    expect(live).not.toBeNull();
    expect(live.getAttribute('role')).toBe('alert');
    expect(live.getAttribute('aria-live')).toBe('assertive');
  });

  it('AppShell offline banner carries role=status + aria-live=polite when offline', () => {
    useOnlineStatus.mockReturnValue(false);
    const { container } = render(
      <MemoryRouter>
        <AppShell><div>child</div></AppShell>
      </MemoryRouter>,
    );
    const banner = container.querySelector('[role="status"][aria-live="polite"]');
    expect(banner).not.toBeNull();
    expect(banner.textContent).toMatch(/offline/i);
  });

  it('AppShell renders no offline banner when online', () => {
    useOnlineStatus.mockReturnValue(true);
    const { container } = render(
      <MemoryRouter>
        <AppShell><div>child</div></AppShell>
      </MemoryRouter>,
    );
    // The only role=status live regions should come from descendants
    // (none here since Header is mocked + no toast). The offline copy
    // must be absent.
    expect(container.textContent).not.toMatch(/offline/i);
  });

  it('BottomNav Messages NavLink uses static "Messages" aria-label when no unread', () => {
    useHasUnread.mockReturnValue(false);
    const { container } = render(
      <MemoryRouter><BottomNav /></MemoryRouter>,
    );
    const messagesLink = container.querySelector('a[href="/messages"]');
    expect(messagesLink).not.toBeNull();
    expect(messagesLink.getAttribute('aria-label')).toBe('Messages');
  });

  it('BottomNav Messages NavLink switches to "Messages (has unread)" when unread present', () => {
    useHasUnread.mockReturnValue(true);
    const { container } = render(
      <MemoryRouter><BottomNav /></MemoryRouter>,
    );
    const messagesLink = container.querySelector('a[href="/messages"]');
    expect(messagesLink).not.toBeNull();
    expect(messagesLink.getAttribute('aria-label')).toBe('Messages (has unread)');
  });
});
