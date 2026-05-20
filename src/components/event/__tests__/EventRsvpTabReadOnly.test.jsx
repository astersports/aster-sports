// @vitest-environment jsdom
//
// EventRsvpTab — readOnly invariant test (Theme 1 from 2026-05-20
// cross-surface review). Frank flagged: past events kept the RSVP
// picker tappable for admins/coaches reviewing 3-day-old games.
//
// readOnly=true plumbs forceReadOnly into every RsvpPlayerRow, which
// renders the status label instead of the going/maybe/can't buttons.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import EventRsvpTab from '../EventRsvpTab';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ role: 'admin', myChildren: [] }),
}));

afterEach(cleanup);

const ROSTER = [
  { id: 'p1', first_name: 'Liam', last_name: 'Diller', jersey_number: 8 },
  { id: 'p2', first_name: 'Shane', last_name: 'Stein', jersey_number: 30 },
];

describe('EventRsvpTab readOnly invariant', () => {
  it('readOnly=true suppresses the going/maybe/not-going buttons (renders status labels)', () => {
    const onSetRsvp = vi.fn();
    const { container, queryByLabelText } = render(
      <EventRsvpTab
        roster={ROSTER}
        rsvps={[{ player_id: 'p1', response: 'going' }]}
        rsvpMap={{ p1: 'going' }}
        teamColor="#4a8fd4"
        onSetRsvp={onSetRsvp}
        onSaveNote={vi.fn()}
        loading={false}
        readOnly
      />
    );
    expect(queryByLabelText('Going')).toBeNull();
    expect(queryByLabelText('Maybe')).toBeNull();
    expect(queryByLabelText('Not going')).toBeNull();
    expect(container.textContent).toMatch(/Going/);
  });

  it('readOnly=false (default) still renders the picker (control)', () => {
    const { getAllByLabelText } = render(
      <EventRsvpTab
        roster={ROSTER}
        rsvps={[]}
        rsvpMap={{}}
        teamColor="#4a8fd4"
        onSetRsvp={vi.fn()}
        onSaveNote={vi.fn()}
        loading={false}
      />
    );
    expect(getAllByLabelText('Going').length).toBe(ROSTER.length);
  });
});
