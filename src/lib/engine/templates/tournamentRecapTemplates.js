// Wave 4.2-A-4 alignment — templates match TournamentRecapBody fields.
// Body fields consumed by the resolver-path composer:
//   { standout_moments, coach_reflection, coach_note, parent_shoutout }
//
// Placement (record, point differential) auto-renders from DB. Per-game
// results auto-render from game_results. Templates only seed the
// narrative fields the editor exposes.

export default [
  {
    id: 'tr-blank',
    name: 'Blank starter',
    description: 'Empty sections — write from scratch',
    body: { standout_moments: '', coach_reflection: '', coach_note: '', parent_shoutout: '' },
    preview_summary: 'Empty body',
  },
  {
    id: 'tr-weekend-wrapup-champs',
    name: 'Weekend wrap-up · Tournament champs',
    description: 'Voice template based on the 11U Girls champ recap — countdown phrasing + per-game blurbs',
    body: {
      standout_moments: 'Tournament champions. 5-2 record. +6.3 point differential. The team that walked in nervous walked out with rings.',
      coach_reflection: [
        '28 days. 7 games. 2 tournaments. Back to back weekends with no break.',
        "That's not a season start. That's a launch sequence.",
        '',
        "Two tournament weekends back to back is a lot for 11 year olds still learning each other's game.",
        "They didn't flinch. Now Coach Kenny gets real practice time to sharpen what showed up.",
        "Next time out, they'll be tighter, tougher, and still asking \"what color jersey.\"",
        "It's always black.",
        '',
        'Next up: RUMBLE FOR THE RING — May 16-17 — Fairfield, CT (27 days)',
      ].join('\n'),
      coach_note: [
        'Sat: Palisades Elite — 20-43 — Talented. Physical. Well-coached.',
        'Sat: NY Gauchos — 14-24 — The reputation walks in before the team does.',
        'Sun: Rockland Spartans — 29-24 — Closed Sunday the right way.',
      ].join('\n'),
      parent_shoutout: '',
    },
    preview_summary: 'Champ banner · per-game blurbs · countdown to next event',
  },
];
