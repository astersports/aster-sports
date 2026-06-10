import { describe, expect, it } from 'vitest';
import { alertGroup, alertLabel, alertSeverity, groupAlerts } from '../alertLabels';

describe('alertLabels', () => {
  it('maps a known alert to its label + summary', () => {
    expect(alertLabel('rsvp_shortfall', 'saturday_6am').label).toBe('Saturday 6am checkpoint');
    expect(alertLabel('briefing_overdue', 'weekly_digest').summary).toMatch(/Thursday 09:00/);
  });

  it('falls back to the type key for an unknown alert', () => {
    expect(alertLabel('mystery', null)).toEqual({ label: 'mystery', summary: '' });
  });

  it('derives severity from threshold_config.severity, else default_severity', () => {
    expect(alertSeverity({ severity: 'critical' }, 'warning')).toBe('crit');
    expect(alertSeverity({}, 'info')).toBe('info');
    expect(alertSeverity(null, 'warning')).toBe('warn');
    // location_unassigned has no .severity key -> uses default ('warning' -> warn)
    expect(alertSeverity({ severity_warning_window_hours: 48 }, 'warning')).toBe('warn');
  });

  it('collapses the four data/ops types into one display group', () => {
    expect(alertGroup('payment_overdue')).toBe('Data & operations');
    expect(alertGroup('location_unassigned')).toBe('Data & operations');
    expect(alertGroup('data_integrity_event_location_missing')).toBe('Data & operations');
  });

  it('groups in fixed order; within-group order preserved from input', () => {
    const configs = [
      { id: 1, type_key: 'rsvp_shortfall' },
      { id: 2, type_key: 'location_unassigned' },
      { id: 3, type_key: 'briefing_overdue' },
      { id: 4, type_key: 'payment_overdue' },
    ];
    const groups = groupAlerts(configs);
    expect(groups.map((g) => g.title)).toEqual(['RSVP shortfall', 'Briefing overdue', 'Data & operations']);
    expect(groups.find((g) => g.title === 'Data & operations').rows.map((r) => r.id)).toEqual([2, 4]);
  });
});
