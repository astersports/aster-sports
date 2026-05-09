// Wave 3.16 — tournament_recap starter templates.
// Body fields consumed by TournamentRecapBody:
//   { final_standing, game_results, mvp_name, takeaways }
//
// TODO(future-wave): TournamentRecapBody currently consumes only the
// 4 fields above. Frank's full hand-written tournament recaps are
// richer — mood headers ("TIME TO BREATHE."), urgent CTAs (hotel
// deadlines), 4-stat blocks, countdown to next event, per-game
// blurbs with one-line characterizations of each opponent. A future
// wave will extend the editor + renderer to surface those fields.
// The seeds below populate only what the editor renders for and
// inline the richer voice into the four available text fields so
// Frank can copy-paste the structure when he backfills his other
// recaps via docs/BRIEFING_TEMPLATES.md.

export default [
  {
    id: 'tr-blank',
    name: 'Blank starter',
    description: 'Empty sections — write from scratch',
    body: { final_standing: '', game_results: '', mvp_name: '', takeaways: '' },
    preview_summary: 'Empty body',
  },
  {
    id: 'tr-weekend-wrapup-champs',
    name: 'Weekend wrap-up · Tournament champs',
    description: 'Per-game blurbs + record + countdown phrasing — based on the 11U Girls voice',
    body: {
      final_standing: 'TOURNAMENT CHAMPIONS · 5-2 record · +6.3 point differential',
      game_results: [
        'Sat: Palisades Elite — 20-43 — Talented. Physical. Well-coached.',
        'Sat: NY Gauchos — 14-24 — The reputation walks in before the team does.',
        'Sun: Rockland Spartans — 29-24 — Closed Sunday the right way.',
      ].join('\n'),
      mvp_name: '',
      takeaways: [
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
    },
    preview_summary: 'Champ banner · per-game blurbs · countdown to next event',
  },
];
