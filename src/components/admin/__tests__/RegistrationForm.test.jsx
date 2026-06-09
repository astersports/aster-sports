// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegistrationForm from '../RegistrationForm';

afterEach(() => cleanup());

function setup(overrides = {}) {
  const onSave = overrides.onSave ?? vi.fn(async () => ({ ok: true }));
  const onClose = overrides.onClose ?? vi.fn();
  render(<RegistrationForm open onClose={onClose} initial={overrides.initial ?? { registrationOpen: false }} onSave={onSave} saving={false} />);
  return { onSave, onClose };
}

describe('RegistrationForm', () => {
  it('reflects the initial registration state', () => {
    setup({ initial: { registrationOpen: true } });
    expect(screen.getByRole('switch', { name: /registration open/i })).toHaveAttribute('aria-checked', 'true');
  });

  it('toggles and saves the new value, then closes', async () => {
    const { onSave, onClose } = setup({ initial: { registrationOpen: false } });
    await userEvent.click(screen.getByRole('switch', { name: /registration open/i }));
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledWith({ registration_open: true });
    expect(onClose).toHaveBeenCalled();
  });
});
