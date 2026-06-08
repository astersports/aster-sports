// Wave 4.2-A-4 — pure section builders for tournamentRecap.
// Full-depth render (2026-06-05): the flat game_log list is retired in
// favor of the framed shell the sibling recaps (games_recap/game_recap)
// use. Reuses existing renderers only — buildGameCell + recap_game_cell,
// bracket_callout, pool_standings, placement_block, section_bar, frame_*
// — no new renderers (AP #38). The retired game_log renderer +
// SECTION_RENDERERS entry stay registered (no kind emits it now, but
// keeping it avoids an AP #34 dispatch-table removal without a sweep).

import { buildGameCell } from './gamesRecapHelpers';
import { buildSubContext, trim } from './tournamentPrelimHelpers';
import { buildStandingsSection } from './tournamentPrelimGoldSections';
import { buildSignoffSection } from '../buildSignoffSection';

export function buildSubject(team, tournament) {
  return `${team.team_name}: ${tournament.name} Recap`;
}

export function buildPlacementBlock(tt, teamColor) {
  if (!tt?.final_place) return null;
  const block = { kind: 'placement_block', team_color: teamColor, final_place: tt.final_place };
  const wins = tt.wins ?? 0;
  const losses = tt.losses ?? 0;
  if (wins + losses > 0) block.record = `${wins}-${losses}`;
  return block;
}

// W-L(-T) record across this team's PUBLISHED tournament games (the run).
// Pure: counts only games whose result is W/L/T. Returns a "{w}-{l}" (or
// "{w}-{l}-{t}") string, or '' when no published games.
export function summarizeRecord(games) {
  let w = 0; let l = 0; let t = 0;
  for (const g of games) {
    const r = String(g.result || '').toUpperCase();
    if (r === 'W') w += 1; else if (r === 'L') l += 1; else if (r === 'T') t += 1;
  }
  if (!(w + l + t)) return '';
  return t ? `${w}-${l}-${t}` : `${w}-${l}`;
}

// Header-band record pill — "3–1 RECORD". En-dashed to match the sibling
// recaps' band style (gamesRecapHelpers.summarizeGames). '' when no record.
export function recordPill(record) {
  return record ? `${record.replace(/-/g, '–')} RECORD` : null;
}

// Map a resolved tournament event + its game_result into the recap-game
// shape buildGameCell consumes. Only PUBLISHED results render a score/pill;
// unpublished games are omitted upstream (no fabrication, AP #27).
function recapGameFrom(event, gr, locations, teamName, teamColor) {
  const loc = locations[event.location_id] || null;
  const venue = loc?.name || event.location || null;
  return {
    team_name: teamName,
    team_color: teamColor || null,
    opponent: event.opponent || null,
    venue,
    start_at: event.start_at,
    our_score: gr?.our_score ?? null,
    opponent_score: gr?.opponent_score ?? null,
    result: gr?.result || null,
  };
}

// THE RUN — one recap_game_cell per PUBLISHED pool game, in start order.
// Reuses buildGameCell from gamesRecapHelpers (per-cell team color rail +
// score + W/L pill). Returns [] when no published games (caller omits the
// section bar too via the cells-length check).
export function buildRunCells(events, gameResults, locations, teamName, teamColor) {
  return (events || [])
    .filter((ev) => !ev.bracket_label && !ev.is_bracket_placeholder)
    .map((ev) => ({ ev, gr: gameResults[ev.id] || null }))
    .filter(({ gr }) => gr && gr.published_at)
    .map(({ ev, gr }) => buildGameCell(recapGameFrom(ev, gr, locations, teamName, teamColor)));
}

// BRACKET PATH TAKEN — the played bracket games (events carrying a
// bracket_label, NOT placeholders) with their results. Reuses
// bracket_callout (the gold band) + recap_game_cell per game so the W/L
// rail + score carry through. Each cell's date_label is replaced with the
// bracket stage label (QUARTERFINAL / SEMIFINAL / FINAL) so the path reads
// as a ladder. Returns [] when the tournament was pool-only (no bracket
// games) — no fabrication (AP #27).
export function buildBracketPathSections(events, gameResults, locations, teamName, teamColor) {
  const bracketGames = (events || [])
    .filter((ev) => ev.bracket_label && !ev.is_bracket_placeholder)
    .map((ev) => ({ ev, gr: gameResults[ev.id] || null }))
    .filter(({ gr }) => gr && gr.published_at);
  if (!bracketGames.length) return [];
  const hasChamp = bracketGames.some(({ ev }) => /championship|final/i.test(ev.bracket_label || '') || ev.is_championship_final);
  const out = [{ kind: 'bracket_callout', text: hasChamp ? 'BRACKET PATH · TO THE FINAL' : 'BRACKET PATH' }];
  for (const { ev, gr } of bracketGames) {
    const cell = buildGameCell(recapGameFrom(ev, gr, locations, teamName, teamColor));
    cell.date_label = String(ev.bracket_label).toUpperCase();
    out.push(cell);
  }
  return out;
}

// Framed shell assembly (order: results → bracket → standings → voice):
// frame_open → cobalt_band header(+record pill) → placement → "The Run"
// bar + recap_game_cell ×N → bracket path → final standings → "From the
// Sideline" bar + narrative → signoff → footer → frame_close. Reuses only
// registered renderers (AP #38); omits each section when data is absent
// (AP #27). Extracted from compose() for the 150-line cap (AP #6).
export function buildRecapSections(context, slice, overrides) {
  const { tournament, tournament_teams, events_by_team, locations, game_results_by_event, org } = context;
  const tt = tournament_teams.find((t) => t.team_id === slice.team_id);
  const events = events_by_team[slice.team_id] || [];
  const sections = [];

  sections.push({ kind: 'frame_open' });
  const runCells = buildRunCells(events, game_results_by_event, locations, slice.team_name, slice.team_color);
  const header = { kind: 'header', variant: 'cobalt_band', eyebrow: `${slice.team_name.toUpperCase()} · TOURNAMENT RECAP`, eyebrow_link: org.branding.eyebrowLink, headline: 'TOURNAMENT RECAP', sub_context: buildSubContext(tournament), team_color: slice.team_color };
  const pill = recordPill(summarizeRecord(runCells));
  if (pill) header.record_pill = pill;
  sections.push(header);

  const placement = buildPlacementBlock(tt, slice.team_color);
  if (placement) sections.push(placement);

  if (runCells.length) {
    sections.push({ kind: 'section_bar', label: 'The Run' });
    for (const cell of runCells) sections.push(cell);
  }

  sections.push(...buildBracketPathSections(events, game_results_by_event, locations, slice.team_name, slice.team_color));

  const standings = buildStandingsSection(overrides, overrides.standings_label || tournament.pool_label, [org.name, slice.team_name]);
  if (standings) { standings.bar_label = standings.bar_label || 'Final Standings'; sections.push(standings); }

  const narrative = [];
  if (trim(overrides.standout_moments)) narrative.push({ kind: 'standout_moments', text: trim(overrides.standout_moments) });
  if (trim(overrides.coach_reflection)) narrative.push({ kind: 'coach_reflection', text: trim(overrides.coach_reflection) });
  for (const key of ['coach_note', 'parent_shoutout']) {
    const v = trim(overrides[key]);
    if (v) narrative.push({ kind: 'stats_narrative', body: v });
  }
  if (narrative.length) { sections.push({ kind: 'section_bar', label: 'From the Sideline' }); sections.push(...narrative); }

  const signoff = buildSignoffSection({ overrides });
  if (signoff) sections.push(signoff);
  sections.push({ kind: 'footer', logoUrl: org.branding.logoUrl, orgName: org.name, websiteUrl: org.branding.eyebrowLink, contactEmail: org.branding.contactEmail });
  sections.push({ kind: 'frame_close' });
  return sections;
}
