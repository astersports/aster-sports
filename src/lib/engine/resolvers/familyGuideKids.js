// Kid → team → event fetch for the family_guide resolver. Extracted from
// familyGuide.js to keep that module under the 150-line cap (CLAUDE.md §6).
// Pure with injected supabase (AP #27); every query checks error (AP #36).

import { etDayEndUtc } from './etWindow';

export async function fetchFamilyGuideKids(supabase, { kidRows, playerIds, dateRange }) {
  const kids = [];
  let events = [];
  let teamIds = [];
  if (!playerIds.length) return { kids, events, teamIds };

  const { data: tpRows, error: tpErr } = await supabase.from('team_players')
    .select('player_id, team_id, teams ( id, name, team_color, sort_order, org_id )')
    .in('player_id', playerIds).eq('status', 'active');
  if (tpErr) throw tpErr;

  const byPlayer = new Map();
  for (const r of tpRows || []) {
    if (!r.teams) continue;
    if (!byPlayer.has(r.player_id)) byPlayer.set(r.player_id, []);
    byPlayer.get(r.player_id).push({
      team_id: r.team_id,
      team_name: r.teams.name || 'Team',
      team_color: r.teams.team_color || '#4a8fd4',
      sort_order: r.teams.sort_order ?? 0,
    });
  }
  for (const k of kidRows) {
    kids.push({
      player_id: k.player_id,
      first_name: k.players.first_name,
      last_name: k.players.last_name,
      teams: byPlayer.get(k.player_id) || [],
    });
  }
  teamIds = [...new Set(kids.flatMap((k) => k.teams.map((t) => t.team_id)))];
  if (teamIds.length && dateRange?.start && dateRange?.end) {
    const { data: evRows, error: evErr } = await supabase.from('events')
      .select('id, team_id, start_at, end_at, opponent, location, sub_location, title, event_type, is_scrimmage')
      .in('team_id', teamIds)
      .gte('start_at', dateRange.start)
      .lte('start_at', etDayEndUtc(dateRange.end));
    if (evErr) throw evErr;
    events = evRows || [];
  }
  return { kids, events, teamIds };
}
