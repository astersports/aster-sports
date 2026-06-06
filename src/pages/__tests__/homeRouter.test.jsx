// @vitest-environment jsdom
//
// Home role-router test (hardening batch item 2 — cross-role, anti-pattern #43).
// Locks that HomePage routes each active role to ITS OWN home and falls back
// safely. The redesign moved all three homes onto the shell; this guards the
// role→home mapping (and the "view as" preview path that reads useHomeRole,
// not useAuth().role) against a future refactor wiring the wrong home.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

let mockRole = { activeRole: 'parent', loading: false };
vi.mock('../../hooks/useHomeRole', () => ({ useHomeRole: () => mockRole }));
vi.mock('../ParentHomePage', () => ({ default: () => <div>PARENT_HOME</div> }));
vi.mock('../AdminHomePage', () => ({ default: () => <div>ADMIN_HOME</div> }));
vi.mock('../CoachHomePage', () => ({ default: () => <div>COACH_HOME</div> }));
vi.mock('../PlaceholderPage', () => ({ default: () => <div>PLACEHOLDER</div> }));

const { default: HomePage } = await import('../HomePage');

afterEach(cleanup);

describe('HomePage role router', () => {
  it.each([
    ['parent', 'PARENT_HOME'],
    ['coach', 'COACH_HOME'],
    ['admin', 'ADMIN_HOME'],
  ])('routes the %s role to its own home', async (role, sentinel) => {
    mockRole = { activeRole: role, loading: false };
    render(<HomePage />);
    expect(await screen.findByText(sentinel)).toBeTruthy();
  });

  it('renders the loading fallback (no role home) while the role resolves', () => {
    mockRole = { activeRole: null, loading: true };
    const { container } = render(<HomePage />);
    expect(container.textContent).not.toMatch(/PARENT_HOME|COACH_HOME|ADMIN_HOME/);
  });

  it('falls back to the placeholder for an unknown role', async () => {
    mockRole = { activeRole: 'ghost', loading: false };
    render(<HomePage />);
    await waitFor(() => expect(screen.getByText('PLACEHOLDER')).toBeTruthy());
  });
});
