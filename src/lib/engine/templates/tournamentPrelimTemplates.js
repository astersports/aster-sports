// Wave 3.16 — tournament_prelim starter templates.
// Body fields consumed by TournamentPrelimBody:
//   { hotel_block, sat_notes, sun_notes, opponent_scouting,
//     lineup_notes }

export default [
  {
    id: 'tp-blank',
    name: 'Blank starter',
    description: 'Empty sections — write from scratch',
    body: {
      hotel_block: '', sat_notes: '', sun_notes: '',
      opponent_scouting: '', lineup_notes: '',
    },
    preview_summary: 'Empty body',
  },
  {
    id: 'tp-single-day',
    name: 'Single-day tournament',
    description: 'Saturday-only schedule, hotel block left empty',
    body: {
      hotel_block: '',
      sat_notes: 'Pool play TBD — confirmed times sent Friday.\nArrive 45 minutes before tip.',
      sun_notes: '',
      opponent_scouting: '',
      lineup_notes: '',
    },
    preview_summary: 'Saturday-only · no hotel',
  },
  {
    id: 'tp-multi-day-hotels',
    name: 'Multi-day with hotels',
    description: 'Sat + Sun schedule, hotel block enabled',
    body: {
      hotel_block: 'Hotel block: TBD — booking link in next email.\nDeadline: TBD',
      sat_notes: 'Pool play 9 AM, noon, 3 PM. Arrive 45 minutes before tip.',
      sun_notes: 'Bracket play TBD pending Saturday results.',
      opponent_scouting: 'Saturday opponent scouting in Friday email.',
      lineup_notes: 'Starting lineup TBD — Coach Kenny will confirm Friday.',
      tourney_link_label: 'VIEW SCHEDULE ON SE TOURNEY',
    },
    preview_summary: 'Sat + Sun · hotel block · scouting · CTA',
  },
];
