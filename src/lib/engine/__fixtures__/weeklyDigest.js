// Fixtures for weeklyDigest composer tests + preview page. Each named
// export covers one shape: single-team, multi-team interleave, tournament
// weekend, and empty week. Period is fixed at May 11–17, 2026 for stable
// snapshots regardless of system clock.

// Anchored at noon UTC so the period stays inside May 11–17 in NY EDT
// (UTC-4) for date-label formatting. periodIsoBounds tests exercise the
// midnight-anchored path separately.
const PERIOD = {
  start: new Date('2026-05-11T12:00:00Z'),
  end:   new Date('2026-05-17T12:00:00Z'),
};

const TEAMS = [
  { id: 't-11u', name: '11U Girls',  team_color: '#7C3AED', sort_order: 1 },
  { id: 't-10b', name: '10U Black',  team_color: '#18181B', sort_order: 2 },
  { id: 't-8u',  name: '8U Boys',    team_color: '#EA580C', sort_order: 5 },
];

const COACHES = [
  { display_name: 'Frank Samaritano', title: 'Program Director',  phone: '914-555-1234' },
  { display_name: 'Kenny Lane',       title: 'Coaching Director', phone: '914-555-5678' },
];

export const singleTeam = {
  family: { guardian_id: 'g-mlopez', email: 'maria@example.com', full_name: 'Maria Lopez', team_ids: ['t-10b'], team_names: ['10U Black'] },
  events: [
    { id: 'e1', team_id: 't-10b', event_type: 'practice', start_at: '2026-05-13T22:30:00Z', end_at: '2026-05-14T00:00:00Z', location: 'WCC',                sub_location: null, status: 'scheduled' },
    { id: 'e2', team_id: 't-10b', event_type: 'game',     start_at: '2026-05-16T14:00:00Z', end_at: '2026-05-16T15:30:00Z', location: 'Stamford Sportsplex', sub_location: 'Court 2', opponent: 'Wave 3C', status: 'scheduled' },
  ],
  period: PERIOD, teams: TEAMS, tournaments: [],
  body_notes: 'Quick week — one practice, then Saturday game in Stamford.',
  signoff_message: 'See you on the court.',
  coaches: COACHES,
};

// Embedded `locations` mimics the PostgREST join in useDigestEvents.
// rsvpCountsByEvent is a Map keyed by event_id with { going, maybe, out }
// shape — exercises §B3 "N going · M maybe · K out" line in renderer #6.
const RSVP_COUNTS = new Map([
  ['e1', { going: 8, maybe: 2, out: 1 }],
  ['e2', { going: 0, maybe: 0, out: 0 }],
  ['e3', { going: 12, maybe: 1, out: 0 }],
]);

export const multiTeam = {
  family: { guardian_id: 'g-stephanie', email: 'stephanie@example.com', full_name: 'Stephanie Samaritano', team_ids: ['t-11u', 't-8u'], team_names: ['11U Girls', '8U Boys'] },
  events: [
    { id: 'e1', team_id: 't-11u', event_type: 'practice', start_at: '2026-05-13T22:30:00Z', end_at: '2026-05-14T00:00:00Z', location: 'WCC', sub_location: null, status: 'scheduled', locations: { id: 'loc-wcc', name: 'WCC', google_maps_url: 'https://maps.google.com/?q=WCC' } },
    { id: 'e2', team_id: 't-8u',  event_type: 'practice', start_at: '2026-05-12T22:30:00Z', end_at: '2026-05-13T00:00:00Z', location: 'WCC', sub_location: null, status: 'scheduled', locations: { id: 'loc-wcc', name: 'WCC', google_maps_url: 'https://maps.google.com/?q=WCC' } },
    { id: 'e3', team_id: 't-11u', event_type: 'game',     start_at: '2026-05-16T14:00:00Z', end_at: '2026-05-16T15:30:00Z', location: 'Stamford Sportsplex', sub_location: 'Court 1', opponent: 'Wave', status: 'scheduled', locations: { id: 'loc-ssx', name: 'Stamford Sportsplex', google_maps_url: 'https://maps.google.com/?q=Stamford+Sportsplex' } },
  ],
  period: PERIOD, teams: TEAMS, tournaments: [],
  body_notes: 'Two teams running this week — 11U Girls + 8U Boys. Stagger your snack runs!',
  signoff_message: 'Coach Frank',
  coaches: COACHES,
  rsvpCountsByEvent: RSVP_COUNTS,
};

export const tournamentWeekend = {
  family: { guardian_id: 'g-trn', email: 'tournparent@example.com', full_name: 'Tina Reyes', team_ids: ['t-11u'], team_names: ['11U Girls'] },
  events: [
    { id: 'e1', team_id: 't-11u', event_type: 'practice',   start_at: '2026-05-13T22:30:00Z', end_at: '2026-05-14T00:00:00Z', location: 'WCC', sub_location: null, status: 'scheduled' },
    { id: 'e2', team_id: 't-11u', event_type: 'tournament', start_at: '2026-05-15T22:00:00Z', tournament_id: 'tr-1', tournament_name: 'ZG Rumble for the Ring CT', status: 'scheduled' },
    { id: 'e3', team_id: 't-11u', event_type: 'tournament', start_at: '2026-05-16T13:00:00Z', tournament_id: 'tr-1', tournament_name: 'ZG Rumble for the Ring CT', status: 'scheduled' },
    { id: 'e4', team_id: 't-11u', event_type: 'tournament', start_at: '2026-05-17T13:00:00Z', tournament_id: 'tr-1', tournament_name: 'ZG Rumble for the Ring CT', status: 'scheduled' },
  ],
  period: PERIOD, teams: TEAMS,
  tournaments: [
    { id: 'tr-1', name: 'ZG Rumble for the Ring CT', start_date: '2026-05-16', end_date: '2026-05-17', rules: { bracket_day_count: 1 } },
  ],
  body_notes: 'Weekend tournament — see Thursday email for full schedule.',
  signoff_message: 'Bring it.',
  coaches: COACHES,
};

export const emptyWeek = {
  family: { guardian_id: 'g-empty', email: 'empty@example.com', full_name: 'Quiet Family', team_ids: ['t-10b'], team_names: ['10U Black'] },
  events: [],
  period: PERIOD, teams: TEAMS, tournaments: [],
  body_notes: '',
  signoff_message: '',
  coaches: COACHES,
};
