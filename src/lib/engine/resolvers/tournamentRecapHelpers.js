// Wave 4.2-A-4 — pure section builders for tournamentRecap.
// Extracted to keep tournamentRecap.js under the 150-line cap.

import { formatDayLabel, formatTime } from './tournamentPrelimHelpers';

export function buildSubject(team, tournament) {
  return `${team.team_name} — ${tournament.name} Recap`;
}

export function buildPlacementBlock(tt, teamColor) {
  if (!tt?.final_place) return null;
  const block = { kind: 'placement_block', team_color: teamColor, final_place: tt.final_place };
  const wins = tt.wins ?? 0;
  const losses = tt.losses ?? 0;
  if (wins + losses > 0) block.record = `${wins}-${losses}`;
  return block;
}

function buildGameLogRow(event, gr, locations, players) {
  const time = formatTime(event.start_at);
  const loc = locations[event.location_id] || null;
  const base = {
    time, opponent: event.opponent || 'TBD',
    location_name: loc?.name || event.location || 'Location TBD',
    location_map_url: loc?.google_maps_url || null,
  };
  if (!gr || !gr.published_at) return { ...base, result: null, status: 'Result not published' };
  const row = { ...base, result: gr.result, our_score: gr.our_score, opponent_score: gr.opponent_score };
  if (gr.player_of_game_id) {
    const pog = players[gr.player_of_game_id];
    if (pog?.first_name) row.player_of_game = pog.first_name;
  }
  if (gr.coach_highlight && gr.coach_highlight.trim()) row.coach_highlight = gr.coach_highlight.trim();
  return row;
}

export function buildGameLogSection(events, gameResults, locations, players, teamColor) {
  if (!events?.length) return { kind: 'game_log', team_color: teamColor, days: [], placeholder: 'No games played' };
  const dayMap = new Map();
  for (const ev of events) {
    const label = formatDayLabel(ev.start_at);
    if (!dayMap.has(label)) dayMap.set(label, []);
    dayMap.get(label).push(buildGameLogRow(ev, gameResults[ev.id] || null, locations, players));
  }
  const days = Array.from(dayMap.entries()).map(([day_label, rows]) => ({ day_label, rows }));
  return { kind: 'game_log', team_color: teamColor, days };
}
