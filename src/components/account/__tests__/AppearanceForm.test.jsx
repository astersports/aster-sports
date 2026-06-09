// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppearanceForm from '../AppearanceForm';

const h = vi.hoisted(() => ({ updatePreference: vi.fn(async () => {}), mergePreferenceJson: vi.fn(async () => {}), state: { prefs: null } }));
vi.mock('../../../hooks/usePreferences', () => ({ usePreferences: () => ({ preferences: h.state.prefs, updatePreference: h.updatePreference, mergePreferenceJson: h.mergePreferenceJson }) }));
vi.mock('../../../context/useToast', () => ({ useToast: () => ({ showToast: vi.fn() }) }));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('AppearanceForm', () => {
  it('reflects stored theme + density and is density 2-state (no Medium)', () => {
    h.state.prefs = { theme: 'light', card_density: { default: 'maximum' } };
    render(<AppearanceForm open onClose={() => {}} />);
    expect(screen.getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Maximum' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.queryByRole('radio', { name: 'Medium' })).not.toBeInTheDocument();
  });

  it('falls a stale "medium" default back to minimal (2-state hook contract)', () => {
    h.state.prefs = { theme: 'system', card_density: { default: 'medium' } };
    render(<AppearanceForm open onClose={() => {}} />);
    expect(screen.getByRole('radio', { name: 'Minimal' })).toHaveAttribute('aria-checked', 'true');
  });

  it('saves theme + merges card_density.default, then closes', async () => {
    h.state.prefs = { theme: 'system', card_density: {} };
    const onClose = vi.fn();
    render(<AppearanceForm open onClose={onClose} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Maximum' }));
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(h.updatePreference).toHaveBeenCalledWith('theme', 'dark');
    expect(h.mergePreferenceJson).toHaveBeenCalledWith('card_density', { default: 'maximum' });
    expect(onClose).toHaveBeenCalled();
  });
});
