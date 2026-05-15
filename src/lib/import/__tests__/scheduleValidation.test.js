import { describe, expect, it } from 'vitest';
import { normalizeDate, normalizeTimeToISO, resolveLocationId, resolveTeamId, summarize, validateParsedRow } from '../scheduleValidation';

const TEAMS = [
  { id: 'team-11ug', name: '11U Girls' },
  { id: 'team-10ub', name: '10U Black' },
  { id: 'team-8ub', name: '8U Boys' },
];
const LOCATIONS = [
  { id: 'loc-insports', name: 'Insports Center' },
  { id: 'loc-bgcansonia', name: 'Boys and Girls Club of Ansonia' },
];
const TOURNAMENT = { id: 't-zg', name: 'Rumble for the Ring CT', start_date: '2026-05-16', end_date: '2026-05-17' };

describe('scheduleValidation', () => {
  it('normalizes M/D dates to tournament-year-anchored ISO', () => {
    expect(normalizeDate('5/16', 2026)).toBe('2026-05-16');
    expect(normalizeDate('5/1', 2026)).toBe('2026-05-01');
    expect(normalizeDate('garbage', 2026)).toBe(null);
  });

  it('normalizes H:MM AM/PM to ET-anchored ISO timestamp', () => {
    expect(normalizeTimeToISO('11:00 AM', '2026-05-16')).toBe('2026-05-16T11:00:00-04:00');
    expect(normalizeTimeToISO('12:00 PM', '2026-05-16')).toBe('2026-05-16T12:00:00-04:00');
    expect(normalizeTimeToISO('5:00 PM', '2026-05-17')).toBe('2026-05-17T17:00:00-04:00');
    expect(normalizeTimeToISO('garbage', '2026-05-16')).toBe(null);
  });

  it('resolves team identifier via fuzzy substring match', () => {
    expect(resolveTeamId('11U Girls', TEAMS)).toBe('team-11ug');
    expect(resolveTeamId('10U Black', TEAMS)).toBe('team-10ub');
    expect(resolveTeamId('Unknown Team', TEAMS)).toBe(null);
  });

  it('resolves location id via exact-name match', () => {
    expect(resolveLocationId('Insports Center', LOCATIONS)).toBe('loc-insports');
    expect(resolveLocationId('  Insports Center  ', LOCATIONS)).toBe('loc-insports');
    expect(resolveLocationId('Unknown Venue', LOCATIONS)).toBe(null);
  });

  it('validates a clean row → valid', () => {
    const row = { team: '11U Girls', date: '5/16', time: '11:00 AM', opponent: 'CT Northstars', venue: 'Insports Center', court: 'Court 3', home_away: 'home' };
    const v = validateParsedRow(row, { teams: TEAMS, locations: LOCATIONS, tournament: TOURNAMENT });
    expect(v.status).toBe('valid');
    expect(v.resolved.team_id).toBe('team-11ug');
    expect(v.resolved.location_id).toBe('loc-insports');
    expect(v.resolved.start_at).toBe('2026-05-16T11:00:00-04:00');
  });

  it('flags row with unmatched team → error', () => {
    const row = { team: 'Made-up Team', date: '5/16', time: '11:00 AM', opponent: 'X', venue: 'Insports Center', court: '3', home_away: 'home' };
    const v = validateParsedRow(row, { teams: TEAMS, locations: LOCATIONS, tournament: TOURNAMENT });
    expect(v.status).toBe('error');
    expect(v.messages.some((m) => m.includes('team'))).toBe(true);
  });

  it('flags row with unparseable date → error', () => {
    const row = { team: '11U Girls', date: 'May 16', time: '11:00 AM', opponent: 'X', venue: 'Insports Center', court: '3', home_away: 'home' };
    const v = validateParsedRow(row, { teams: TEAMS, locations: LOCATIONS, tournament: TOURNAMENT });
    expect(v.status).toBe('error');
  });

  it('flags row with date outside tournament range → error', () => {
    const row = { team: '11U Girls', date: '6/20', time: '11:00 AM', opponent: 'X', venue: 'Insports Center', court: '3', home_away: 'home' };
    const v = validateParsedRow(row, { teams: TEAMS, locations: LOCATIONS, tournament: TOURNAMENT });
    expect(v.status).toBe('error');
    expect(v.messages.some((m) => m.includes('outside tournament range'))).toBe(true);
  });

  it('flags row with unmatched venue → warning (not error)', () => {
    const row = { team: '11U Girls', date: '5/16', time: '11:00 AM', opponent: 'X', venue: 'New Gym Maybe', court: '3', home_away: 'home' };
    const v = validateParsedRow(row, { teams: TEAMS, locations: LOCATIONS, tournament: TOURNAMENT });
    expect(v.status).toBe('warning');
    expect(v.resolved.location_id).toBe(null);
  });

  it('summary aggregates rows by status', () => {
    const rows = [{ status: 'valid' }, { status: 'valid' }, { status: 'warning' }, { status: 'error' }];
    expect(summarize(rows)).toEqual({ valid: 2, warning: 1, error: 1 });
  });
});
