// @vitest-environment jsdom
//
// Cross-role invariant test per CLAUDE.md anti-pattern #43 / L99 Foundation
// audit P2.5.
//
// Header renders different chrome per role + view-as state:
//   - parent  : no Eye (view-as) icon, no warning stripe
//   - coach   : no Eye icon, no warning stripe
//   - admin   : Eye icon present, no warning stripe (not viewing-as)
//   - admin viewing-as: Eye icon + orange warning stripe + "Viewing as <role>"
//                       label
//
// Static gate prevents Header child components from branching on
// activeRole for permissions (the Eye icon gates on canSwitchRoles
// which only resolves true for admin). Reference shape mirrors
// TeamDetailHeroPerRoleInvariant.test.jsx (Teams PR B).

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const authRef = { current: { role: 'parent', org: null, orgName: null } };
const homeRoleRef = {
  current: {
    activeRole: 'parent',
    isViewingAs: false,
    canSwitchRoles: false,
  },
};

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => authRef.current,
}));
vi.mock('../../../hooks/useHomeRole', () => ({
  useHomeRole: () => homeRoleRef.current,
}));
vi.mock('../../RoleSwitcherSheet', () => ({
  default: () => <div data-testid="role-switcher-sheet" />,
}));

const { default: Header } = await import('../Header');

function renderHeader() {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  authRef.current = { role: 'parent', org: null, orgName: null };
  homeRoleRef.current = {
    activeRole: 'parent',
    isViewingAs: false,
    canSwitchRoles: false,
  };
});

describe('Header — per-role invariant (anti-pattern #43)', () => {
  it('parent: NO Eye (view-as) icon rendered', () => {
    authRef.current = { role: 'parent', org: null, orgName: null };
    homeRoleRef.current = {
      activeRole: 'parent',
      isViewingAs: false,
      canSwitchRoles: false,
    };
    const { container } = renderHeader();
    expect(container.querySelector('[aria-label="Switch role view"]')).toBeNull();
  });

  it('coach: NO Eye icon rendered', () => {
    authRef.current = { role: 'coach', org: null, orgName: null };
    homeRoleRef.current = {
      activeRole: 'coach',
      isViewingAs: false,
      canSwitchRoles: false,
    };
    const { container } = renderHeader();
    expect(container.querySelector('[aria-label="Switch role view"]')).toBeNull();
  });

  it('admin: Eye icon IS rendered (canSwitchRoles=true)', () => {
    authRef.current = { role: 'admin', org: null, orgName: null };
    homeRoleRef.current = {
      activeRole: 'admin',
      isViewingAs: false,
      canSwitchRoles: true,
    };
    const { container } = renderHeader();
    expect(container.querySelector('[aria-label="Switch role view"]')).not.toBeNull();
  });

  it('admin in view-as mode: orange warning stripe + viewed-as role label', () => {
    authRef.current = { role: 'admin', org: null, orgName: null };
    homeRoleRef.current = {
      activeRole: 'parent',
      isViewingAs: true,
      canSwitchRoles: true,
    };
    const { container } = renderHeader();
    // Warning stripe: top fixed bar at z-50 with em-warning background
    const stripe = Array.from(container.querySelectorAll('div')).find((el) =>
      el.style.background === 'var(--em-warning)',
    );
    expect(stripe).toBeTruthy();
    expect(container.textContent).toMatch(/Viewing as parent/);
    // Eye icon still present in view-as state
    expect(container.querySelector('[aria-label="Switch role view"]')).not.toBeNull();
  });

  it('Bell button REMOVED (Q2 routing fix): no Notifications aria-label', () => {
    authRef.current = { role: 'admin', org: null, orgName: null };
    homeRoleRef.current = {
      activeRole: 'admin',
      isViewingAs: false,
      canSwitchRoles: true,
    };
    const { container } = renderHeader();
    expect(container.querySelector('[aria-label="Notifications"]')).toBeNull();
  });
});
