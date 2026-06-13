// @vitest-environment jsdom
//
// EventRsvpTab — D4 eligibility gate on the detail RSVP tab (operator-
// caught 2026-06-13, post-wave-2 device grade): the tab accepted an RSVP
// for an UNACTIVATED academy kid on a tournament while the card, hero,
// and Home all (correctly) suppressed the control. Rows stay rendered
// for the full roster (activation management lives here); the CONTROL is
// what eligibility gates. Cross-surface invariant per AP#43.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import EventRsvpTab from '../EventRsvpTab';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ role: 'admin', myChildren: [] }),
}));

afterEach(cleanup);

const ROSTER = [
  { id: 'p-rostered', first_name: 'Blake', last_name: 'Covrigaru', jersey_number: 2 },
  { id: 'p-academy', first_name: 'Milo', last_name: 'Samaritano', jersey_number: 14, member_type: 'futures_academy' },
];
const tab = (props) => render(
  <EventRsvpTab roster={ROSTER} rsvps={[]} rsvpMap={{}} teamColor="#4a8fd4"
    onSetRsvp={vi.fn()} onSaveNote={vi.fn()} loading={false}
    canActivateAcademy activatedSet={new Set()} onToggleActivation={vi.fn()} {...props} />
);

describe('EventRsvpTab — D4 eligibility gate (game types)', () => {
  it('tournament + unactivated academy: NO control for the kid, "Not activated" + Activate instead', () => {
    const { getAllByLabelText, container, queryByLabelText } = tab({ eventType: 'tournament' });
    expect(getAllByLabelText('Going').length).toBe(1); // rostered kid only
    expect(container.textContent).toContain('Not activated');
    expect(queryByLabelText('Activate Milo Samaritano')).not.toBeNull();
  });

  it('tournament + ACTIVATED academy: full control like anyone else', () => {
    const { getAllByLabelText, container } = tab({ eventType: 'tournament', activatedSet: new Set(['p-academy']) });
    expect(getAllByLabelText('Going').length).toBe(2);
    expect(container.textContent).not.toContain('Not activated');
  });

  it('practice: academy kid keeps the control without activation (practices ARE the program)', () => {
    const { getAllByLabelText } = tab({ eventType: 'practice' });
    expect(getAllByLabelText('Going').length).toBe(2);
  });
});
