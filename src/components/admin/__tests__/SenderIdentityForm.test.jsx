// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SenderIdentityForm from '../SenderIdentityForm';

afterEach(() => cleanup());

const baseInitial = { fromName: 'Aster AAU', fromEmail: 'admin@lh.org', replyTo: 'reply@lh.org' };

function setup(overrides = {}) {
  const onSave = overrides.onSave ?? vi.fn(async () => ({ ok: true }));
  const onClose = overrides.onClose ?? vi.fn();
  render(
    <SenderIdentityForm
      open
      onClose={onClose}
      initial={overrides.initial ?? baseInitial}
      onSave={onSave}
      saving={overrides.saving ?? false}
    />,
  );
  return { onSave, onClose };
}

describe('SenderIdentityForm', () => {
  it('renders the three fields reflecting the initial values', () => {
    setup();
    expect(screen.getByLabelText(/from name/i)).toHaveValue('Aster AAU');
    expect(screen.getByLabelText(/from email/i)).toHaveValue('admin@lh.org');
    expect(screen.getByLabelText(/reply-to email/i)).toHaveValue('reply@lh.org');
  });

  it('Save sends the trimmed patch and closes on success', async () => {
    const { onSave, onClose } = setup();
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledWith({
      from_name: 'Aster AAU',
      from_email: 'admin@lh.org',
      reply_to_email: 'reply@lh.org',
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('empty reply-to is sent as null', async () => {
    const { onSave } = setup({ initial: { fromName: 'LH', fromEmail: 'a@lh.org', replyTo: '' } });
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledWith({ from_name: 'LH', from_email: 'a@lh.org', reply_to_email: null });
  });

  it('Save is disabled until from name + from email are both present', async () => {
    const onSave = vi.fn(async () => ({ ok: true }));
    setup({ onSave, initial: { fromName: '', fromEmail: '', replyTo: '' } });
    const saveBtn = screen.getByRole('button', { name: /^save$/i });
    expect(saveBtn).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/from name/i), 'LH');
    await userEvent.type(screen.getByLabelText(/from email/i), 'a@lh.org');
    expect(saveBtn).toBeEnabled();
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
