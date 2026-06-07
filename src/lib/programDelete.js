// Human phrasing for the program-delete confirm (PR-3 F14). Pure so the
// pluralization is unit-tested without rendering. Programs cascade-delete
// teams → team_players / roster_members / events (all FK ON DELETE CASCADE).
export function dependencySummary({ teams = 0, players = 0, events = 0 } = {}) {
  const p = (n, noun) => `${n} ${noun}${n !== 1 ? 's' : ''}`;
  return `${p(teams, 'team')}, ${p(players, 'roster row')}, ${p(events, 'event')}`;
}
