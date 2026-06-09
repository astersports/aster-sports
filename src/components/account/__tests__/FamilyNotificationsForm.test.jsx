// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FamilyNotificationsForm from '../FamilyNotificationsForm';

afterEach(cleanup);

function setup(overrides = {}) {
  const onSave = overrides.onSave ?? vi.fn(async () => ({ ok: true }));
  const onClose = overrides.onClose ?? vi.fn();
  render(<FamilyNotificationsForm open onClose={onClose} initial={overrides.initial ?? {}} players={overrides.players ?? 'Milo, Charlie'} onSave={onSave} saving={false} />);
  return { onSave, onClose };
}

describe('FamilyNotificationsForm', () => {
  it('shows 4 toggles (all on by default) + the players context line', () => {
    setup();
    expect(screen.getByText(/applies to all your players: milo, charlie/i)).toBeInTheDocument();
    expect(screen.getAllByRole('switch')).toHaveLength(4);
    expect(screen.getByRole('switch', { name: /weekly digest/i })).toHaveAttribute('aria-checked', 'true');
  });

  it('reflects stored off values', () => {
    setup({ initial: { receive_weekly_digest: false, receive_game_recaps: false } });
    expect(screen.getByRole('switch', { name: /weekly digest/i })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('switch', { name: /tournament briefings/i })).toHaveAttribute('aria-checked', 'true');
  });

  it('Save sends all four fields and closes', async () => {
    const { onSave, onClose } = setup({ initial: {} });
    await userEvent.click(screen.getByRole('switch', { name: /game recaps/i })); // → false
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledWith({
      receive_weekly_digest: true, receive_tournament_briefings: true, receive_game_recaps: false, receive_org_announcements: true,
    });
    expect(onClose).toHaveBeenCalled();
  });
});
