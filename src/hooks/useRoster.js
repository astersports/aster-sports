import { useMemo } from 'react';

// Seed roster for the 2-A part-1 read-only view. Every teamId returns the
// same 10 players for now — once the players + team_players tables have
// real rows, swap the body of useRoster() for a Supabase query filtered
// by team_id and keep the same { players, loading } shape.
const SEED_PLAYERS = [
  { id: '1',  first_name: 'Gabriel',  last_name: 'Alexander',  jersey_number: 1,  grade: 4, member_type: 'roster' },
  { id: '2',  first_name: 'Spencer',  last_name: 'Clark',      jersey_number: 3,  grade: 4, member_type: 'roster' },
  { id: '3',  first_name: 'Cameron',  last_name: 'Dortona',    jersey_number: 5,  grade: 4, member_type: 'roster' },
  { id: '4',  first_name: 'Mason',    last_name: 'Drumheller', jersey_number: 7,  grade: 4, member_type: 'roster' },
  { id: '5',  first_name: 'Hudson',   last_name: 'Edelman',    jersey_number: 10, grade: 4, member_type: 'roster' },
  { id: '6',  first_name: 'Henry',    last_name: 'Graff',      jersey_number: 12, grade: 4, member_type: 'roster' },
  { id: '7',  first_name: 'Henry',    last_name: 'Katzeff',    jersey_number: 14, grade: 3, member_type: 'futures_academy' },
  { id: '8',  first_name: 'Aubtin',   last_name: 'Khojasteh',  jersey_number: 21, grade: 4, member_type: 'roster' },
  { id: '9',  first_name: 'Lucas',    last_name: 'Mandell',    jersey_number: 23, grade: 4, member_type: 'roster' },
  { id: '10', first_name: 'Frankie',  last_name: 'Schindler',  jersey_number: 32, grade: 4, member_type: 'roster' },
];

// Ascending jersey number — null/undefined jerseys sink to the bottom so
// numbered players always appear first in the list.
function byJersey(a, b) {
  const aJ = a.jersey_number ?? Number.POSITIVE_INFINITY;
  const bJ = b.jersey_number ?? Number.POSITIVE_INFINITY;
  return aJ - bJ;
}

// eslint-disable-next-line no-unused-vars
export function useRoster(teamId) {
  const players = useMemo(() => [...SEED_PLAYERS].sort(byJersey), []);
  return { players, loading: false };
}
