// @vitest-environment jsdom
//
// Tier 3 v1 PR 4 — ActiveRoleContext tests.
//
// Covers: default activeRole = primaryRole; switchRole mutates state;
// isSwitched flag; reset on primaryRole change (login → other user).

import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ActiveRoleProvider, useActiveRole } from '../ActiveRoleContext';

// Hoisted mock: useAuth returns whatever we set the module variable to
// at test time. ActiveRoleProvider reads role + user.id from useAuth.
let mockAuth = { role: 'admin', user: { id: 'u1' } };
vi.mock('../AuthContext', () => ({ useAuth: () => mockAuth }));

function Probe({ onState }) {
  const state = useActiveRole();
  onState(state);
  return null;
}

function renderWithProvider(onState) {
  return render(<ActiveRoleProvider><Probe onState={onState} /></ActiveRoleProvider>);
}

describe('ActiveRoleProvider', () => {
  it('defaults activeRole to primaryRole from auth', () => {
    mockAuth = { role: 'coach', user: { id: 'u1' } };
    let state;
    renderWithProvider((s) => { state = s; });
    expect(state.activeRole).toBe('coach');
    expect(state.primaryRole).toBe('coach');
    expect(state.isSwitched).toBe(false);
  });

  it('switchRole updates activeRole + sets isSwitched', () => {
    mockAuth = { role: 'admin', user: { id: 'u1' } };
    let state;
    renderWithProvider((s) => { state = s; });
    act(() => { state.switchRole('parent'); });
    expect(state.activeRole).toBe('parent');
    expect(state.primaryRole).toBe('admin');
    expect(state.isSwitched).toBe(true);
  });

  it('switchRole rejects invalid role values', () => {
    mockAuth = { role: 'admin', user: { id: 'u1' } };
    let state;
    renderWithProvider((s) => { state = s; });
    act(() => { state.switchRole('superuser'); });
    expect(state.activeRole).toBe('admin'); // unchanged
  });

  it('isSwitched is false when primaryRole is null (logged out)', () => {
    mockAuth = { role: null, user: null };
    let state;
    renderWithProvider((s) => { state = s; });
    expect(state.activeRole).toBe(null);
    expect(state.isSwitched).toBe(false);
  });

  it('useActiveRole throws outside ActiveRoleProvider', () => {
    const Bare = () => { useActiveRole(); return null; };
    const restore = console.error; console.error = () => {};
    expect(() => render(<Bare />)).toThrow(/must be used within ActiveRoleProvider/);
    console.error = restore;
  });
});
