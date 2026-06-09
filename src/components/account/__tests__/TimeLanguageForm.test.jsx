// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimeLanguageForm from '../TimeLanguageForm';

const h = vi.hoisted(() => ({ updatePreference: vi.fn(async () => {}), state: { prefs: null } }));
vi.mock('../../../hooks/usePreferences', () => ({ usePreferences: () => ({ preferences: h.state.prefs, updatePreference: h.updatePreference }) }));
vi.mock('../../../context/useToast', () => ({ useToast: () => ({ showToast: vi.fn() }) }));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('TimeLanguageForm', () => {
  it('reflects stored timezone + locale', () => {
    h.state.prefs = { timezone: 'America/Chicago', locale: 'es-US' };
    render(<TimeLanguageForm open onClose={() => {}} />);
    expect(screen.getByRole('combobox', { name: /time zone/i })).toHaveValue('America/Chicago');
    expect(screen.getByRole('combobox', { name: /language/i })).toHaveValue('es-US');
  });

  it('saves timezone + locale and closes', async () => {
    h.state.prefs = { timezone: 'America/New_York', locale: 'en-US' };
    const onClose = vi.fn();
    render(<TimeLanguageForm open onClose={onClose} />);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /time zone/i }), 'America/Los_Angeles');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /language/i }), 'es-US');
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(h.updatePreference).toHaveBeenCalledWith('timezone', 'America/Los_Angeles');
    expect(h.updatePreference).toHaveBeenCalledWith('locale', 'es-US');
    expect(onClose).toHaveBeenCalled();
  });
});
