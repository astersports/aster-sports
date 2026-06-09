// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppearanceForm from '../AppearanceForm';

const h = vi.hoisted(() => ({ mergePreferenceJson: vi.fn(async () => {}), state: { prefs: null } }));
vi.mock('../../../hooks/usePreferences', () => ({ usePreferences: () => ({ preferences: h.state.prefs, mergePreferenceJson: h.mergePreferenceJson }) }));
vi.mock('../../../context/useToast', () => ({ useToast: () => ({ showToast: vi.fn() }) }));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('AppearanceForm', () => {
  it('is density-only (theme segment hidden per DR-1) and 2-state', () => {
    h.state.prefs = { card_density: { default: 'maximum' } };
    render(<AppearanceForm open onClose={() => {}} />);
    expect(screen.getByRole('radio', { name: 'Maximum' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.queryByRole('radiogroup', { name: 'Theme' })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'Medium' })).not.toBeInTheDocument();
  });

  it('falls a stale "medium" default back to minimal (2-state hook contract)', () => {
    h.state.prefs = { card_density: { default: 'medium' } };
    render(<AppearanceForm open onClose={() => {}} />);
    expect(screen.getByRole('radio', { name: 'Minimal' })).toHaveAttribute('aria-checked', 'true');
  });

  it('saves density via merged card_density.default, then closes', async () => {
    h.state.prefs = { card_density: {} };
    const onClose = vi.fn();
    render(<AppearanceForm open onClose={onClose} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Maximum' }));
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(h.mergePreferenceJson).toHaveBeenCalledWith('card_density', { default: 'maximum' });
    expect(onClose).toHaveBeenCalled();
  });
});
