// Wave 4.1d-1 — audience resolver + recipient filter.
//
// Closes the gap left by wave 3.11+: the unified BriefingComposer's
// generic compose+queue path never built per-recipient rows for
// game_recap, tournament_prelim, tournament_recap, announcement, or
// custom_message. send-tournament-message v16 then 400s with "No
// queued recipients" because comms_message_recipients was empty.
//
// resolveAudienceTeamIds maps the wizard's audience_type +
// audience_filter + anchor_id to a concrete team_ids list:
//   org_all              → null (no filter; pass everyone through)
//   team                 → [audienceFilter.team_id || anchorId]
//   multi_team           → audienceFilter.team_ids || [anchorId]
//   event_attendees      → [events.team_id] (looked up from anchor_id)
//   tournament_attendees → tournament_teams.team_id list (from anchor)
//
// filterRecipientsByTeams is pure so unit tests don't need to load
// supabase. resolveAudienceTeamIds dynamically imports supabase only
// when an event/tournament lookup is needed — keeps the module
// importable in environments without VITE_SUPABASE_URL set.

export async function resolveAudienceTeamIds({ audienceType, audienceFilter, anchorId }) {
  if (audienceType === 'org_all') return null;
  if (audienceType === 'team') {
    const id = audienceFilter?.team_id || anchorId;
    return id ? [id] : [];
  }
  if (audienceType === 'multi_team') {
    const ids = audienceFilter?.team_ids;
    if (Array.isArray(ids) && ids.length) return ids.filter(Boolean);
    return anchorId ? [anchorId] : [];
  }
  if (audienceType === 'event_attendees') {
    if (!anchorId) return [];
    const { supabase } = await import('../supabase');
    const { data, error } = await supabase
      .from('events').select('team_id').eq('id', anchorId).maybeSingle();
    if (error) throw error;
    return data?.team_id ? [data.team_id] : [];
  }
  if (audienceType === 'tournament_attendees') {
    if (!anchorId) return [];
    const { supabase } = await import('../supabase');
    const { data, error } = await supabase
      .from('tournament_teams').select('team_id').eq('tournament_id', anchorId);
    if (error) throw error;
    return (data || []).map((r) => r.team_id).filter(Boolean);
  }
  return [];
}

export function filterRecipientsByTeams(recipients, teamIds) {
  if (teamIds == null) return recipients || [];
  if (!teamIds.length) return [];
  const idSet = new Set(teamIds);
  return (recipients || []).filter((f) => (f.team_ids || []).some((t) => idSet.has(t)));
}

export async function resolveAudience({ recipients, audienceType, audienceFilter, anchorId }) {
  const teamIds = await resolveAudienceTeamIds({ audienceType, audienceFilter, anchorId });
  return { teamIds, audience: filterRecipientsByTeams(recipients, teamIds) };
}
