// §4.AI Option C PR B — pending-recap query helpers. Used by the new
// briefing_overdue:game_recap + briefing_overdue:tournament_recap
// evaluators. Pure functions take an injected supabase client (clean-
// seam pattern matching evaluator.js's queryExecutor contract).
//
// Both queries bound the lookback window so the result set stays
// small even if no recap is ever sent (events from before the lookback
// are silently dropped — the alert is for recent unsent recaps, not a
// full historical audit).

const GAME_LOOKBACK_DAYS = 7;
const TOURNAMENT_LOOKBACK_DAYS = 14;

// Returns events where event_type='game', end_at older than sinceHours
// ago but within the last GAME_LOOKBACK_DAYS, status != 'cancelled',
// AND no game_recap briefing is queued/sent against event.id.
export async function getGameRecapPendingEvents(supabase, orgId, sinceHours) {
  const now = Date.now();
  const cutoffIso = new Date(now - sinceHours * 3600000).toISOString();
  const lookbackIso = new Date(now - GAME_LOOKBACK_DAYS * 86400000).toISOString();
  const { data: games, error: gErr } = await supabase.from('events')
    .select('id, team_id, start_at, end_at, opponent, teams!inner(org_id, name)')
    .eq('teams.org_id', orgId).eq('event_type', 'game')
    .lt('end_at', cutoffIso).gte('end_at', lookbackIso)
    .neq('status', 'cancelled');
  if (gErr) throw gErr;
  const events = games || [];
  if (!events.length) return [];
  const ids = events.map((e) => e.id);
  const { data: sent, error: sErr } = await supabase.from('comms_messages')
    .select('anchor_id').eq('org_id', orgId).eq('kind', 'game_recap')
    .eq('anchor_kind', 'event').in('anchor_id', ids)
    .in('status', ['queued', 'sent']);
  if (sErr) throw sErr;
  const sentSet = new Set((sent || []).map((r) => r.anchor_id));
  return events.filter((e) => !sentSet.has(e.id));
}

// Returns tournaments with end_date older than sinceDays ago but
// within the last TOURNAMENT_LOOKBACK_DAYS, AND no tournament_recap
// briefing is queued/sent against tournament.id.
export async function getTournamentRecapPendingTournaments(supabase, orgId, sinceDays) {
  const now = Date.now();
  const cutoffIso = new Date(now - sinceDays * 86400000).toISOString();
  const lookbackIso = new Date(now - TOURNAMENT_LOOKBACK_DAYS * 86400000).toISOString();
  const { data: tours, error: tErr } = await supabase.from('tournaments')
    .select('id, name, start_date, end_date').eq('org_id', orgId)
    .lt('end_date', cutoffIso.slice(0, 10)).gte('end_date', lookbackIso.slice(0, 10));
  if (tErr) throw tErr;
  const tournaments = tours || [];
  if (!tournaments.length) return [];
  const ids = tournaments.map((t) => t.id);
  const { data: sent, error: sErr } = await supabase.from('comms_messages')
    .select('anchor_id').eq('org_id', orgId).eq('kind', 'tournament_recap')
    .eq('anchor_kind', 'tournament').in('anchor_id', ids)
    .in('status', ['queued', 'sent']);
  if (sErr) throw sErr;
  const sentSet = new Set((sent || []).map((r) => r.anchor_id));
  return tournaments.filter((t) => !sentSet.has(t.id));
}
