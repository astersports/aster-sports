// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FeaturesForm from '../FeaturesForm';

afterEach(() => cleanup());

function setup(overrides = {}) {
  const onSave = overrides.onSave ?? vi.fn(async () => ({ ok: true }));
  const onClose = overrides.onClose ?? vi.fn();
  render(<FeaturesForm open onClose={onClose} initial={overrides.initial ?? { futuresEnabled: true, carpoolEnabled: true }} onSave={onSave} saving={false} />);
  return { onSave, onClose };
}

describe('FeaturesForm', () => {
  it('reflects both feature toggles', () => {
    setup({ initial: { futuresEnabled: true, carpoolEnabled: false } });
    expect(screen.getByRole('switch', { name: /futures academy/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch', { name: /carpool/i })).toHaveAttribute('aria-checked', 'false');
  });

  it('saves both flags and closes', async () => {
    const { onSave, onClose } = setup({ initial: { futuresEnabled: true, carpoolEnabled: true } });
    await userEvent.click(screen.getByRole('switch', { name: /carpool/i })); // → false
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledWith({ futures_academy_enabled: true, carpool_enabled: false });
    expect(onClose).toHaveBeenCalled();
  });
});
