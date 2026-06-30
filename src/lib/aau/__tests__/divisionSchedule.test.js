import { describe, expect, it } from 'vitest';
import { groupGamesByDay } from '../divisionSchedule';

describe('groupGamesByDay', () => {
  it('buckets games by NY calendar day, chronological within a day, TBD last', () => {
    const games = [
      { gameId: 'b', startAt: '2026-06-24T18:00:00Z' },
      { gameId: 'a2', startAt: '2026-06-23T20:00:00Z' },
      { gameId: 'a1', startAt: '2026-06-23T18:00:00Z' },
      { gameId: 't', startAt: null },
    ];
    const days = groupGamesByDay(games);
    expect(days.map((d) => d.key)).toEqual(['2026-06-23', '2026-06-24', 'tbd']);
    expect(days[0].games.map((g) => g.gameId)).toEqual(['a1', 'a2']); // within-day chronological
    expect(days[2].label).toBe('Date TBD');
  });

  it('tolerates empty / non-array input', () => {
    expect(groupGamesByDay([])).toEqual([]);
    expect(groupGamesByDay(null)).toEqual([]);
  });
});
