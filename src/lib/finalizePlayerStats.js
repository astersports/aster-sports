import { supabase } from './supabase';

const POINT_MAP = { fg2_made: 2, fg3_made: 3, ft_made: 1 };
const SHOT_TYPES = { fg2_made: 'fg', fg2_miss: 'fg', fg3_made: 'three', fg3_miss: 'three', ft_made: 'ft', ft_miss: 'ft' };

export async function finalizePlayerStats(eventId, teamId, orgId, plays) {
  const stats = {};
  for (const p of plays) {
    if (!p.player_id || p.is_opponent) continue;
    if (!stats[p.player_id]) {
      stats[p.player_id] = {
        org_id: orgId, event_id: eventId, player_id: p.player_id, team_id: teamId,
        pts: 0, pf: 0, fg_made: 0, fg_att: 0, three_made: 0, three_att: 0,
        ft_made: 0, ft_att: 0, to_count: 0, orb: 0, drb: 0, reb: 0,
        ast: 0, stl: 0, blk: 0, plus_minus: 0, source: 'ember_live',
      };
    }
    const s = stats[p.player_id];
    s.pts += POINT_MAP[p.play_type] || 0;
    if (p.play_type === 'foul') s.pf++;
    if (p.play_type === 'turnover') s.to_count++;
    if (p.play_type === 'rebound') { s.reb++; s.drb++; }
    if (p.play_type === 'assist') s.ast++;
    if (p.play_type === 'steal') s.stl++;
    if (p.play_type === 'block') s.blk++;
    const shot = SHOT_TYPES[p.play_type];
    if (shot === 'fg') { s.fg_att++; if (p.play_type.endsWith('_made')) s.fg_made++; }
    if (shot === 'three') { s.three_att++; if (p.play_type.endsWith('_made')) { s.three_made++; s.fg_att++; s.fg_made++; } else { s.fg_att++; } }
    if (shot === 'ft') { s.ft_att++; if (p.play_type.endsWith('_made')) s.ft_made++; }
  }

  const rows = Object.values(stats);
  if (rows.length === 0) return { error: null, count: 0 };

  const { error } = await supabase.from('player_game_stats').upsert(rows, { onConflict: 'event_id,player_id' });
  if (!error) {
    await supabase.from('game_results').update({ has_player_stats: true }).eq('event_id', eventId);
  }
  return { error, count: rows.length };
}
