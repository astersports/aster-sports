// @vitest-environment jsdom
//
// PlayerRow — guardian-diagnostic-copy privacy gate (Theme 8 from the
// 2026-05-20 cross-surface review). Frank flagged on 11U Girls roster
// parent view: Bianca's row showed "No guardians linked" — a diagnostic
// flag visible to peer parents who can't act on it. Admin-only now.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';

const mockRole = { value: 'parent' };
vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ role: mockRole.value }),
}));
vi.mock('../InviteButton', () => ({ default: () => null }));

import PlayerRow from '../PlayerRow';

afterEach(() => {
  cleanup();
  mockRole.value = 'parent';
});

const PLAYER_WITH_GUARDIANS = {
  id: 'p1', first_name: 'Ayana', last_name: 'Hatano', jersey_number: 3,
  guardians: [{ id: 'g1', firstName: 'A', lastName: 'Hatano', email: 'a@h.com', phone: null }],
};

const PLAYER_NO_GUARDIANS = {
  id: 'p2', first_name: 'Bianca', last_name: 'Zanki', jersey_number: 15,
  guardians: [],
};

describe('PlayerRow — guardian diagnostic privacy gate', () => {
  it('parent view: row with no guardians DOES NOT render "No guardians linked"', () => {
    mockRole.value = 'parent';
    const { queryByText } = render(<PlayerRow player={PLAYER_NO_GUARDIANS} teamColor="#a78bfa" isLast isMyChild />);
    expect(queryByText(/No guardians linked/i)).toBeNull();
  });

  it('coach view: same suppression as parent (only admins see the diagnostic)', () => {
    mockRole.value = 'coach';
    const { queryByText } = render(<PlayerRow player={PLAYER_NO_GUARDIANS} teamColor="#a78bfa" isLast isMyChild />);
    expect(queryByText(/No guardians linked/i)).toBeNull();
  });

  it('admin view: still sees the diagnostic (actionable signal — invite needed)', () => {
    mockRole.value = 'admin';
    const { queryByText } = render(<PlayerRow player={PLAYER_NO_GUARDIANS} teamColor="#a78bfa" isLast isMyChild />);
    expect(queryByText(/No guardians linked/i)).not.toBeNull();
  });

  it('parent view: row WITH guardians still expands and shows them (control)', () => {
    mockRole.value = 'parent';
    const { container } = render(<PlayerRow player={PLAYER_WITH_GUARDIANS} teamColor="#a78bfa" isLast isMyChild />);
    expect(container.textContent).toMatch(/Hatano/);
  });
});
