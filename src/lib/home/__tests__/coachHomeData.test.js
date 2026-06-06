import { describe, expect, it } from 'vitest';
import { alertToActionItem, groupTeamsByProgram, summarizeActionQueue } from '../coachHomeData';

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

// C-12 grouping (multi-program). GROUP, not filter — a camp's teams render
// under their own program header rather than being hidden.
describe('groupTeamsByProgram', () => {
  const teams = [
    { id: 't-1', name: '10U Blue' },
    { id: 't-2', name: '9U Boys' },
    { id: 't-3', name: 'Lab A' },
  ];

  it('returns ONE group when every team is in the same program (no-regression)', () => {
    const programs = [{ id: 'pr-1', programType: 'season', name: 'Spring 2026', teamIds: ['t-1', 't-2', 't-3'] }];
    const groups = groupTeamsByProgram(teams, programs);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe('Spring 2026 · teams');
    expect(groups[0].teams.map((t) => t.id)).toEqual(['t-1', 't-2', 't-3']);
  });

  it('splits teams across programs with a per-type label noun', () => {
    const programs = [
      { id: 'pr-1', programType: 'season', name: 'Spring 2026', teamIds: ['t-1', 't-2'] },
      { id: 'pr-2', programType: 'camp', name: 'Active Roster Lab', teamIds: ['t-3'] },
    ];
    const groups = groupTeamsByProgram(teams, programs);
    expect(groups).toHaveLength(2);
    expect(groups[0].label).toBe('Spring 2026 · teams');
    expect(groups[1].label).toBe('Active Roster Lab · camp');
    expect(groups[1].teams.map((t) => t.id)).toEqual(['t-3']);
  });

  it('carries a noun for every program_type (F8 — no generic fallback)', () => {
    const single = [{ id: 't-1', name: 'A' }];
    const noun = (programType) =>
      groupTeamsByProgram(single, [{ id: 'p', programType, name: 'P', teamIds: ['t-1'] }])[0].label;
    expect(noun('camp')).toBe('P · camp');
    expect(noun('clinic')).toBe('P · clinic');
    expect(noun('tryout')).toBe('P · tryout');
    expect(noun('evaluation')).toBe('P · evaluation');
    expect(noun('interest_list')).toBe('P · interest list');
  });

  it('lands unmatched teams in a trailing "Other" group (defensive)', () => {
    const programs = [{ id: 'pr-1', programType: 'season', name: 'Spring 2026', teamIds: ['t-1'] }];
    const groups = groupTeamsByProgram(teams, programs);
    const other = groups.find((g) => g.programId === '__none__');
    expect(other?.label).toBe('Other');
    expect(other?.teams.map((t) => t.id)).toEqual(['t-2', 't-3']);
  });

  it('returns empty for no teams', () => {
    expect(groupTeamsByProgram([], [])).toEqual([]);
  });
});
