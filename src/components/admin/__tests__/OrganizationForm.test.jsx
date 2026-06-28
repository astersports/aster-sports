// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrganizationForm from '../OrganizationForm';

afterEach(() => cleanup());

const baseInitial = {
  name: 'Aster AAU LLC',
  mailingAddress: '4 Byram Brook Place, Armonk, NY 10504',
  seasonLabel: 'Spring 2026',
  timezone: 'America/New_York',
};

function setup(overrides = {}) {
  const onSave = overrides.onSave ?? vi.fn(async () => ({ ok: true }));
  const onClose = overrides.onClose ?? vi.fn();
  render(
    <OrganizationForm open onClose={onClose} initial={overrides.initial ?? baseInitial} onSave={onSave} saving={overrides.saving ?? false} />,
  );
  return { onSave, onClose };
}

describe('OrganizationForm', () => {
  it('shows name + mailing address as read-only (not editable inputs)', () => {
    setup();
    expect(screen.getByText('Aster AAU LLC')).toBeInTheDocument();
    expect(screen.getByText('4 Byram Brook Place, Armonk, NY 10504')).toBeInTheDocument();
    expect(screen.getAllByText(/read-only/i)).toHaveLength(2);
    // no text input carries the org name (it's a static row)
    expect(screen.queryByDisplayValue('Aster AAU LLC')).not.toBeInTheDocument();
  });

  it('reflects the editable season label + timezone', () => {
    setup();
    expect(screen.getByLabelText(/season label/i)).toHaveValue('Spring 2026');
    expect(screen.getByLabelText(/time zone/i)).toHaveValue('America/New_York');
  });

  it('Save sends season_label + timezone and closes on success', async () => {
    const { onSave, onClose } = setup();
    await userEvent.selectOptions(screen.getByLabelText(/time zone/i), 'America/Chicago');
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledWith({ season_label: 'Spring 2026', timezone: 'America/Chicago' });
    expect(onClose).toHaveBeenCalled();
  });

  it('blank season label is sent as null', async () => {
    const { onSave } = setup({ initial: { ...baseInitial, seasonLabel: '' } });
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledWith({ season_label: null, timezone: 'America/New_York' });
  });

  it('does not close when the save fails', async () => {
    const onSave = vi.fn(async () => ({ ok: false }));
    const onClose = vi.fn();
    setup({ onSave, onClose });
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onClose).not.toHaveBeenCalled();
  });
});
