// @vitest-environment jsdom
//
// R2-2 facts-line contract (visual pass round 2, PR-V2 — replaces the
// retired chip-row test): ONE line, gray when fine, amber 600 only when
// something needs you; violet academy notes; Hidden-roster suppression
// survives from §10.1(2). Cross-surface invariant per AP #43.

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import EventCardFacts from '../EventCardFacts';

afterEach(cleanup);

const count = { going: 9, denominator: 11 };

describe('EventCardFacts — R2-2 one-line contract', () => {
  it('fine state: gray line with count + rides covered', () => {
    const { container } = render(<EventCardFacts count={count} rideCount={{ requests: 0, offers: 3 }} />);
    expect(container.textContent).toContain('9 of 11 going · rides covered');
  });

  it('needs state: ONE amber line aggregating count + rides + volunteers', () => {
    const { container } = render(
      <EventCardFacts count={{ going: 0, denominator: 10 }} rideCount={{ requests: 2, offers: 0 }} dutyCount={{ total: 3, claimed: 1 }} />
    );
    expect(container.textContent).toContain('0 of 10 going · 2 rides needed · 2 volunteers needed');
  });

  it('Hidden roster suppresses the count for parents; staff never suppressed', () => {
    const a = render(<EventCardFacts suppressCount count={count} />);
    expect(a.container.textContent).toContain('Counts hidden for evaluations');
    expect(a.container.textContent).not.toContain('9 of 11');
    cleanup();
    const b = render(<EventCardFacts suppressCount isStaffView count={count} />);
    expect(b.container.textContent).toContain('9 of 11 going');
  });

  it('academy note: violet sentence at comfortable, terse at compact', () => {
    const a = render(<EventCardFacts count={count} academyNames={['Milo']} />);
    expect(a.container.textContent).toContain("Milo isn't activated for this game");
    cleanup();
    const b = render(<EventCardFacts count={count} academyNames={['Milo']} compact />);
    expect(b.container.textContent).toContain('Milo not activated');
  });

  it('commitment: accent note at comfortable, folded into the fine line at compact', () => {
    const a = render(<EventCardFacts count={count} commitment="You're bringing snacks" />);
    expect(a.container.textContent).toContain("You're bringing snacks");
    cleanup();
    const b = render(<EventCardFacts count={count} commitment="snacks: you" compact />);
    expect(b.container.textContent).toContain('9 of 11 going · snacks: you');
  });

  it('renders nothing when there is nothing to say', () => {
    const { container } = render(<EventCardFacts />);
    expect(container.textContent).toBe('');
  });

  it('V2.1: the checkmark EARNS its place — absent at 0 going, present above 0', () => {
    const zero = render(<EventCardFacts count={{ going: 0, denominator: 10 }} />);
    expect(zero.container.textContent).toContain('0 of 10 going');
    expect(zero.container.querySelector('svg')).toBeNull();
    cleanup();
    const some = render(<EventCardFacts count={{ going: 3, denominator: 10 }} />);
    expect(some.container.querySelector('svg')).not.toBeNull();
  });

  it('V2.1: compact academy note folds INTO the one facts line (no second line)', () => {
    const { container } = render(
      <EventCardFacts count={{ going: 0, denominator: 10 }} academyNames={['Milo']} compact />
    );
    const lines = container.querySelectorAll(':scope > div');
    expect(lines).toHaveLength(1);
    expect(lines[0].textContent).toContain('0 of 10 going');
    expect(lines[0].textContent).toContain('Milo not activated');
  });
});
