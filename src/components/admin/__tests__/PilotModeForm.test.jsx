// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PilotModeForm from '../PilotModeForm';

vi.mock('../../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'admin-1' }, orgId: 'org-1' }) }));
vi.mock('../../../lib/reportError', () => ({ reportAudit: vi.fn() }));
import { reportAudit } from '../../../lib/reportError';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

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

  it('normal Save persists the toggle + address and closes (no cutover)', async () => {
    const { onSave, onClose } = setup();
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledWith({ pilot_mode_enabled: true, pilot_test_recipient_email: 'redirect@test.com' });
    expect(onClose).toHaveBeenCalled();
  });

  it('normal Save is disabled when the address is cleared (clearing is NOT a normal save)', async () => {
    setup();
    await userEvent.clear(screen.getByRole('textbox', { name: /test recipient email/i }));
    expect(screen.getByRole('button', { name: /^save$/i })).toBeDisabled();
  });

  it('the cutover lives behind a focused SEND-LIVE confirm, not an inline button', async () => {
    const { onSave, onClose } = setup();
    // no confirm action present until the Go-live button is tapped
    expect(screen.queryByRole('button', { name: /^send live$/i })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /go live to families/i }));

    // focused confirm appears; Send live disabled until the exact phrase is typed
    const sendBtn = screen.getByRole('button', { name: /^send live$/i });
    expect(sendBtn).toBeDisabled();
    const confirm = screen.getByRole('textbox', { name: /to confirm/i });
    await userEvent.type(confirm, 'send live'); // wrong case
    expect(sendBtn).toBeDisabled();
    await userEvent.clear(confirm);
    await userEvent.type(confirm, 'SEND LIVE');
    expect(sendBtn).toBeEnabled();
    await userEvent.click(sendBtn);
    expect(onSave).toHaveBeenCalledWith({ pilot_mode_enabled: true, pilot_test_recipient_email: null });
    expect(onClose).toHaveBeenCalled();
    // E6: the cutover is audited with actor + cleared address.
    expect(reportAudit).toHaveBeenCalledWith('pilot_cutover', expect.objectContaining({
      actorId: 'admin-1', orgId: 'org-1', clearedAddress: 'redirect@test.com',
    }));
  });

  it('no Go-live control when there is no test address to clear', () => {
    setup({ initial: { pilotEnabled: false, testRecipientEmail: '' } });
    expect(screen.queryByRole('button', { name: /go live to families/i })).not.toBeInTheDocument();
  });
});
