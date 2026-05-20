// @vitest-environment jsdom
//
// RsvpPlayerRow — inline Academy activation invariant (Theme 11 from
// 2026-05-20 cross-surface review). Frank workflow: academy players
// are invited to every practice but only called up for games when
// regular roster RSVP counts drop. The dedicated Academy Players
// panel was removed; activation toggle lives inline on the RSVP row
// for academy kids on games/tournaments.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ role: 'admin', myChildren: [] }),
}));

import RsvpPlayerRow from '../RsvpPlayerRow';

afterEach(cleanup);

const ACADEMY_PLAYER = {
  id: 'p-academy', first_name: 'Cooper', last_name: 'Richheimer',
  jersey_number: 10, member_type: 'futures_academy',
};
const ROSTER_PLAYER = {
  id: 'p-roster', first_name: 'Shane', last_name: 'Stein',
  jersey_number: 30, member_type: 'roster',
};

describe('RsvpPlayerRow — inline academy activation', () => {
  it('academy player + canActivateAcademy=true renders the Activate button', () => {
    const { getByLabelText } = render(
      <RsvpPlayerRow player={ACADEMY_PLAYER} response="going" teamColor="#4a8fd4"
        onSetRsvp={vi.fn()} onSaveNote={vi.fn()}
        canActivateAcademy isActivated={false} onToggleActivation={vi.fn()} />
    );
    expect(getByLabelText(/Activate Cooper Richheimer/i)).toBeInTheDocument();
  });

  it('academy player + isActivated=true renders the "Active" pressed state with deactivate aria', () => {
    const { getByLabelText, container } = render(
      <RsvpPlayerRow player={ACADEMY_PLAYER} response="going" teamColor="#4a8fd4"
        onSetRsvp={vi.fn()} onSaveNote={vi.fn()}
        canActivateAcademy isActivated onToggleActivation={vi.fn()} />
    );
    expect(getByLabelText(/Deactivate Cooper Richheimer/i)).toBeInTheDocument();
    expect(container.textContent).toMatch(/Active/);
  });

  it('tapping Activate calls onToggleActivation with the player id', () => {
    const onToggleActivation = vi.fn();
    const { getByLabelText } = render(
      <RsvpPlayerRow player={ACADEMY_PLAYER} response="going" teamColor="#4a8fd4"
        onSetRsvp={vi.fn()} onSaveNote={vi.fn()}
        canActivateAcademy isActivated={false} onToggleActivation={onToggleActivation} />
    );
    fireEvent.click(getByLabelText(/Activate Cooper Richheimer/i));
    expect(onToggleActivation).toHaveBeenCalledWith('p-academy');
  });

  it('rostered (non-academy) player never shows the Activate button (control)', () => {
    const { queryByLabelText } = render(
      <RsvpPlayerRow player={ROSTER_PLAYER} response="going" teamColor="#4a8fd4"
        onSetRsvp={vi.fn()} onSaveNote={vi.fn()}
        canActivateAcademy isActivated={false} onToggleActivation={vi.fn()} />
    );
    expect(queryByLabelText(/Activate Shane/i)).toBeNull();
  });

  it('academy player + canActivateAcademy=false (practice or parent view) suppresses the button', () => {
    const { queryByLabelText } = render(
      <RsvpPlayerRow player={ACADEMY_PLAYER} response="going" teamColor="#4a8fd4"
        onSetRsvp={vi.fn()} onSaveNote={vi.fn()}
        canActivateAcademy={false} isActivated={false} onToggleActivation={vi.fn()} />
    );
    expect(queryByLabelText(/Activate Cooper/i)).toBeNull();
  });
});
