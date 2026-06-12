// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import SettingsSheets from '../SettingsSheets';

// PilotModeForm (one of the mounted sheets) reads useAuth for the E6 cutover
// audit; provide it so the 'pilot' render doesn't throw outside an AuthProvider.
vi.mock('../../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'admin-1' }, orgId: 'org-1' }) }));

afterEach(() => cleanup());

const an = { remindersOn: true, nudgesOn: false, minGoing: 5, save: vi.fn(), saving: false };
const os = {
  settings: {
    season_label: 'Spring 2026', timezone: 'America/New_York',
    registration_open: false, futures_academy_enabled: true, carpool_enabled: true,
    custom_domain: null, from_name: 'Legacy Hoopers', from_email: 'admin@lh.org',
    reply_to_email: 'reply@lh.org', pilot_mode_enabled: true, pilot_test_recipient_email: 'r@test.com',
    notification_channels: { defaults: { push: true, email: true, sms: false }, per_category: {}, emergency_override_bypasses_quiet_hours: true },
  },
  save: vi.fn(), saving: false,
};
const al = {
  configs: [
    { id: 'a1', type_key: 'rsvp_shortfall', instance_key: 'friday_noon', enabled: true, threshold_config: { severity: 'warning' }, default_severity: 'warning' },
    { id: 'a2', type_key: 'payment_overdue', instance_key: null, enabled: true, threshold_config: { severity: 'warning' }, default_severity: 'warning' },
  ],
  save: vi.fn(), saving: false,
};
const fs = { ridesOn: true, dutiesOn: true, save: vi.fn(), saving: false };
const org = { name: 'Legacy Hoopers LLC', mailing_address: '4 Byram Brook Place' };

function renderSheets(openForm) {
  return render(<SettingsSheets openForm={openForm} setOpenForm={() => {}} an={an} os={os} al={al} fs={fs} org={org} />);
}

describe('SettingsSheets — openForm routing', () => {
  it('renders no dialog when nothing is open', () => {
    renderSheets(null);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it.each([
    ['org', /organization/i],
    ['autonotif', /automatic messages/i],
    ['features', /event features/i],
    ['channels', /channels/i],
    ['alerts', /alerts/i],
    ['sender', /sender identity/i],
    ['pilot', /pilot mode/i],
  ])('opens exactly the %s form', (key, name) => {
    renderSheets(key);
    const dialogs = screen.getAllByRole('dialog');
    expect(dialogs).toHaveLength(1);
    expect(screen.getByRole('dialog', { name })).toBeInTheDocument();
  });
});
