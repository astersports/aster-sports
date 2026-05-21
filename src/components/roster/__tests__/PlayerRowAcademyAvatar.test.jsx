// @vitest-environment jsdom
//
// PlayerRow — academy avatar visual treatment (Teams PR C / V6 / Q11(a)).
// Per CLAUDE.md anti-pattern #46: card/row visual changes ship with a
// cross-surface invariant test. Locks the dashed purple border on
// futures-academy rows so the treatment doesn't drift on non-academy
// rows (no border) or vanish under future refactors.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ role: 'admin' }),
}));
vi.mock('../InviteButton', () => ({ default: () => null }));

import PlayerRow from '../PlayerRow';

afterEach(() => { cleanup(); });

const BASE = { id: 'p1', first_name: 'Avery', last_name: 'Lee', jersey_number: 7, guardians: [] };
const ACADEMY = { ...BASE, member_type: 'futures_academy' };
const ROSTER = { ...BASE, member_type: 'roster' };

describe('PlayerRow — academy avatar treatment (anti-pattern #46)', () => {
  it('academy row: avatar carries dashed purple border', () => {
    const { container } = render(<PlayerRow player={ACADEMY} teamColor="#4a8fd4" isLast />);
    // The avatar is the first child div with border-radius:50% and a
    // single letter inside; find it by its inline style border value.
    const dashed = container.querySelector('[style*="dashed"]');
    expect(dashed).not.toBeNull();
    // The purple academy color (var name) appears in the style attribute
    expect(dashed.getAttribute('style')).toMatch(/em-academy/);
  });

  it('non-academy row: avatar has NO dashed border (noise floor stays clean)', () => {
    const { container } = render(<PlayerRow player={ROSTER} teamColor="#4a8fd4" isLast />);
    const dashed = container.querySelector('[style*="dashed"]');
    expect(dashed).toBeNull();
  });
});
