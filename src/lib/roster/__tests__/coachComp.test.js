import { describe, expect, it } from 'vitest';
import { compLine, compSummary, roleLabel, scopeLabel, toCompRole } from '../coachComp';

describe('coachComp display helpers', () => {
  it('compLine renders rate + scope for a paid coach', () => {
    expect(compLine({ rateCents: 12000, scope: 'all_events' })).toBe('$120/session · all events');
    expect(compLine({ rateCents: 8000, scope: 'games_only' })).toBe('$80/session · games only');
  });

  it('compLine renders "Volunteer" for no comp', () => {
    expect(compLine(null)).toBe('Volunteer');
  });

  it('compSummary sums active rates, null when nothing committed', () => {
    expect(compSummary([{ comp: { rateCents: 12000 } }, { comp: { rateCents: 12000 } }, { comp: null }]))
      .toBe('$240/session committed');
    expect(compSummary([{ comp: null }, { comp: null }])).toBe(null);
    expect(compSummary([])).toBe(null);
  });

  it('role/scope labels map enum → human, fallback safe', () => {
    expect(roleLabel('head_coach')).toBe('Head coach');
    expect(roleLabel('program_director')).toBe('Program director');
    expect(roleLabel('unknown')).toBe('Coach');
    expect(scopeLabel('practices_only')).toBe('Practices only');
    expect(scopeLabel(null)).toBe('All events');
  });

  it('toCompRole maps team_staff vocabulary → comp enum (so volunteer rows label correctly)', () => {
    expect(toCompRole('assistant_coach')).toBe('assistant');
    expect(toCompRole('manager')).toBe('team_manager');
    expect(toCompRole('head_coach')).toBe('head_coach');
    expect(roleLabel('assistant_coach')).toBe('Assistant'); // team_staff variant → label
    expect(roleLabel('manager')).toBe('Team manager');
  });
});
