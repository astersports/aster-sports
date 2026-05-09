// Wave 3.16 — game_recap starter templates.
// Body fields consumed by GameRecapBody:
//   { score: { ours, theirs }, our_highlights, opp_highlights,
//     player_of_game_name, coach_note }

export default [
  {
    id: 'gr-blank',
    name: 'Blank starter',
    description: 'Empty fields — write from scratch',
    body: {
      score: { ours: '', theirs: '' },
      our_highlights: '', opp_highlights: '',
      player_of_game_name: '', coach_note: '',
    },
    preview_summary: 'Empty body',
  },
  {
    id: 'gr-home-game',
    name: 'Home-game recap',
    description: 'Narrative starter for a home game',
    body: {
      score: { ours: '', theirs: '' },
      our_highlights: 'Tonight at our home gym:',
      opp_highlights: '',
      player_of_game_name: '',
      coach_note: 'Proud of how this team showed up tonight.',
    },
    preview_summary: 'Home-game narrative starter',
  },
  {
    id: 'gr-league-game',
    name: 'League game recap',
    description: 'For 10U Blue / 9U Boys league games — auto-surfaces the WPCYO link when game is parented to the league',
    body: {
      score: { ours: '', theirs: '' },
      our_highlights: '',
      opp_highlights: '',
      player_of_game_name: '',
      coach_note: '',
      tourney_link_label: 'VIEW LEAGUE STANDINGS',
    },
    preview_summary: 'League game · CTA inherits parent league link',
  },
];
