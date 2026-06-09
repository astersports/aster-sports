// Human phrasing for the program-delete confirm (PR-3 F14). Pure so the
// pluralization is unit-tested without rendering. A program delete CASCADEs
// teams → team_players / roster_members and events; registration + financial
// records (registrations, financial_accounts ON DELETE RESTRICT; coach_payouts
// NO ACTION) BLOCK the delete ("archive instead") rather than cascading — the
// guard lives in useProgramAdmin.deleteProgram.
export function dependencySummary({ teams = 0, players = 0, events = 0 } = {}) {
  const p = (n, noun) => `${n} ${noun}${n !== 1 ? 's' : ''}`;
  return `${p(teams, 'team')}, ${p(players, 'roster row')}, ${p(events, 'event')}`;
}
