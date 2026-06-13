import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { formatEventTitle } from '../../../lib/eventTitle';

// PR-V3 gate (visual pass, operator-directed at the 7/10 grade): the
// Games tab speaks the same card vocabulary as the list — EventCard
// rows fed by the useScheduleData bundle. MatchupCard is retired
// (AP #34: zero callers verified; AP #51: dead surface removed).

describe('Games tab — rail/facts vocabulary adoption', () => {
  it('MatchupCard is retired (file + tests gone)', () => {
    expect(existsSync('src/components/schedule/MatchupCard.jsx')).toBe(false);
  });

  it('GamesView renders EventCard rows from the schedule-data bundle', () => {
    const src = readFileSync('src/components/schedule/GamesView.jsx', 'utf8');
    expect(src).toContain("import EventCard from './EventCard'");
    expect(src).not.toContain('MatchupCard from');
    expect(src).toContain('data?.gameResults?.[e.id]');
  });

  it('Games mode carries the density control + per-row weather (operator-caught 2026-06-13)', () => {
    const src = readFileSync('src/components/schedule/GamesView.jsx', 'utf8');
    expect(src).toContain('<DensityToggle sectionKey="default" />');
    expect(src).toContain('getWeatherForTime(data?.weather, e.start_at)');
  });

  it('tournament anchors title as the tournament name, not a bare type label (MatchupCard treatment preserved)', () => {
    const anchor = { event_type: 'tournament', opponent: null, tournament_name: 'Bergen County Tournament' };
    expect(formatEventTitle(anchor)).toEqual({ prefix: '', body: 'Bergen County Tournament' });
    const withOpp = { event_type: 'tournament', opponent: 'CT Northstars', home_away: 'neutral' };
    expect(formatEventTitle(withOpp).body).toBe('CT Northstars');
  });
});
