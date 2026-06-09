// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PilotModeForm from '../PilotModeForm';

vi.mock('../../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'admin-1' }, orgId: 'org-1' }) }));

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

  it('the go-live cutover is LOCKED while pilot mode is mandatory (no app path)', () => {
    setup(); // a redirect address is set, but the cutover is disabled in code
    // CUTOVER_ENABLED=false: no go-live control, no SEND-LIVE confirm reachable.
    expect(screen.queryByRole('button', { name: /go live to families/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^send live$/i })).not.toBeInTheDocument();
    expect(screen.getByText(/pilot mode is required/i)).toBeInTheDocument();
  });

  it('no Go-live control when there is no test address to clear', () => {
    setup({ initial: { pilotEnabled: false, testRecipientEmail: '' } });
    expect(screen.queryByRole('button', { name: /go live to families/i })).not.toBeInTheDocument();
  });
});
