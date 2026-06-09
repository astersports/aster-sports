// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PilotModeForm from '../PilotModeForm';

afterEach(() => cleanup());

function setup(overrides = {}) {
  const onSave = overrides.onSave ?? vi.fn(async () => ({ ok: true }));
  const onClose = overrides.onClose ?? vi.fn();
  render(<PilotModeForm open onClose={onClose} initial={overrides.initial ?? { pilotEnabled: true, testRecipientEmail: 'redirect@test.com' }} onSave={onSave} saving={false} />);
  return { onSave, onClose };
}

describe('PilotModeForm', () => {
  it('reflects the pilot toggle + test address', () => {
    setup();
    expect(screen.getByRole('switch', { name: /pilot mode/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('textbox', { name: /test recipient email/i })).toHaveValue('redirect@test.com');
  });

  it('saves normally when the test address is unchanged (no guard)', async () => {
    const { onSave, onClose } = setup();
    expect(screen.queryByText(/go-live cutover/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledWith({ pilot_mode_enabled: true, pilot_test_recipient_email: 'redirect@test.com' });
    expect(onClose).toHaveBeenCalled();
  });

  it('GUARD: clearing a set test address requires typing SEND LIVE before it can go live', async () => {
    const { onSave, onClose } = setup();
    await userEvent.clear(screen.getByRole('textbox', { name: /test recipient email/i }));

    // caution surfaces; the action becomes "Send live" and is disabled
    expect(screen.getByText(/go-live cutover/i)).toBeInTheDocument();
    const sendBtn = screen.getByRole('button', { name: /send live/i });
    expect(sendBtn).toBeDisabled();

    // wrong phrase keeps it disabled
    const confirm = screen.getByRole('textbox', { name: /to confirm/i });
    await userEvent.type(confirm, 'send live');
    expect(sendBtn).toBeDisabled();

    // exact phrase unlocks the cutover
    await userEvent.clear(confirm);
    await userEvent.type(confirm, 'SEND LIVE');
    expect(sendBtn).toBeEnabled();
    await userEvent.click(sendBtn);
    expect(onSave).toHaveBeenCalledWith({ pilot_mode_enabled: true, pilot_test_recipient_email: null });
    expect(onClose).toHaveBeenCalled();
  });

  it('no guard when there was no test address to clear', async () => {
    const { onSave } = setup({ initial: { pilotEnabled: false, testRecipientEmail: '' } });
    expect(screen.queryByText(/go-live cutover/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledWith({ pilot_mode_enabled: false, pilot_test_recipient_email: null });
  });
});
