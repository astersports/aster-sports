// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomDomainForm from '../CustomDomainForm';

afterEach(() => cleanup());

function setup(overrides = {}) {
  const onSave = overrides.onSave ?? vi.fn(async () => ({ ok: true }));
  const onClose = overrides.onClose ?? vi.fn();
  render(<CustomDomainForm open onClose={onClose} initial={overrides.initial ?? { customDomain: 'teams.lh.com' }} onSave={onSave} saving={false} />);
  return { onSave, onClose };
}

describe('CustomDomainForm', () => {
  it('reflects the initial domain', () => {
    setup();
    expect(screen.getByRole('textbox', { name: /custom domain/i })).toHaveValue('teams.lh.com');
  });

  it('saves the trimmed domain and closes', async () => {
    const { onSave, onClose } = setup({ initial: { customDomain: '' } });
    await userEvent.type(screen.getByRole('textbox', { name: /custom domain/i }), '  teams.lh.com  ');
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledWith({ custom_domain: 'teams.lh.com' });
    expect(onClose).toHaveBeenCalled();
  });

  it('blank domain saves as null', async () => {
    const { onSave } = setup({ initial: { customDomain: '' } });
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledWith({ custom_domain: null });
  });
});
