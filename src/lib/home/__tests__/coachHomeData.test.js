import { describe, expect, it } from 'vitest';
import { alertToActionItem, summarizeActionQueue } from '../coachHomeData';

// Coach/admin Needs-you shapers. The alert row reads "{label} · {N events}"
// on ONE line per HOME_RENDERS (not a label + a separate "N events" sub).
describe('alertToActionItem', () => {
  it('folds the affected-event count into the primary line', () => {
    const item = alertToActionItem({
      config_id: 'c1', alert_type_key: 'rsvp_shortfall', severity: 'warning',
      data: { events: [{ id: 'e1' }, { id: 'e2' }, { id: 'e3' }, { id: 'e4' }] },
    });
    expect(item.primary).toBe('RSVP shortfall · 4 events');
    expect(item.subtitle).toBeUndefined();
    expect(item.severity).toBe('warning');
  });

  it('singularizes one event and carries critical severity through', () => {
    const item = alertToActionItem({
      config_id: 'c2', alert_type_key: 'location_unassigned', severity: 'critical',
      data: { events: [{ id: 'e1' }] },
    });
    expect(item.primary).toBe('Location needs assigning · 1 event');
    expect(item.severity).toBe('critical');
  });

  it('omits the count suffix when there are no affected events', () => {
    const item = alertToActionItem({ config_id: 'c3', alert_type_key: 'rsvp_shortfall', severity: 'warning', data: {} });
    expect(item.primary).toBe('RSVP shortfall');
  });
});

describe('summarizeActionQueue', () => {
  it('counts + pluralizes per kind', () => {
    expect(summarizeActionQueue([
      { kind: 'unscored_game' }, { kind: 'unscored_game' }, { kind: 'pending_invitation' },
    ])).toBe('2 games need scores · 1 pending invite');
  });
});
