// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AutoNotificationSettingsForm from '../AutoNotificationSettingsForm';

afterEach(() => cleanup());

const baseInitial = { remindersOn: true, nudgesOn: false, minGoing: 5 };

function setup(overrides = {}) {
  const onSave = overrides.onSave ?? vi.fn(async () => ({ ok: true }));
  const onClose = overrides.onClose ?? vi.fn();
  render(
    <AutoNotificationSettingsForm
      open
      onClose={onClose}
      initial={overrides.initial ?? baseInitial}
      onSave={onSave}
      saving={overrides.saving ?? false}
    />,
  );
  return { onSave, onClose };
}

describe('AutoNotificationSettingsForm', () => {
  it('renders the three controls (two toggles + the going stepper)', () => {
    setup();
    expect(screen.getByRole('switch', { name: /send event reminders/i })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /draft short-roster nudges/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/increase minimum confirmed going/i)).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('reflects the initial config on each control', () => {
    setup({ initial: { remindersOn: false, nudgesOn: true, minGoing: 8 } });
    expect(screen.getByRole('switch', { name: /send event reminders/i })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('switch', { name: /draft short-roster nudges/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('disables (not hides) the stepper when nudges are off', () => {
    setup({ initial: { remindersOn: true, nudgesOn: false, minGoing: 5 } });
    expect(screen.getByLabelText(/increase minimum confirmed going/i)).toBeDisabled();
    expect(screen.getByLabelText(/decrease minimum confirmed going/i)).toBeDisabled();
  });

  it('Save sends the merged patch of all three keys and closes on success', async () => {
    const { onSave, onClose } = setup();
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledWith({
      reminders_enabled: true,
      rsvp_nudges_enabled: false,
      rsvp_min_going: 5,
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('enabling nudges activates the stepper; the new floor lands in the patch', async () => {
    const { onSave } = setup();
    await userEvent.click(screen.getByRole('switch', { name: /draft short-roster nudges/i }));
    const inc = screen.getByLabelText(/increase minimum confirmed going/i);
    expect(inc).toBeEnabled();
    await userEvent.click(inc); // 5 → 6
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledWith({
      reminders_enabled: true,
      rsvp_nudges_enabled: true,
      rsvp_min_going: 6,
    });
  });

  it('does not close when the save fails', async () => {
    const onSave = vi.fn(async () => ({ ok: false }));
    const onClose = vi.fn();
    setup({ onSave, onClose });
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onSave).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
