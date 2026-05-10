// Wave 4.1b §5 — pure synth-row builders extracted from useNeedsBriefing
// so the pagination + windowing logic is unit-testable without async.
//
// Each function returns an array of synthetic queue rows in the shape
// ActionQueueRow expects: { synthetic_id, status, kind, anchor_kind,
// anchor_id, title, audience_preview, relative_time, eca_diff? }.
//
// Wave 4.1d-2 §1.5 — TOURNAMENT_RECAP_WINDOW_MS broadened 7d → 30d.
// Production has past tournaments missing recaps that current synth
// didn't surface (S2). Also §2.6 label drift fix: "Tournament prelim"
// inbox label aligned with KIND_METADATA.label "Tournament briefing".
// §4.4: test-send rows surface a different audience_preview text.
//
// Wave 4.1d-4 — synth rows now carry team scoping so the inbox team
// filter chip can gate them. Game/skipped rows carry team_id (single
// team); tournament rows carry team_ids (multi-team). buildDigestDueRow
// stays org-anchored (chip filter passes anchor_kind='org' through).

export const GAME_RECAP_VISIBLE_CAP = 5;
export const GAME_RECAP_WINDOW_MS = 14 * 86400000;
export const TOURNAMENT_PRELIM_WINDOW_MS = 14 * 86400000;
export const TOURNAMENT_RECAP_WINDOW_MS = 30 * 86400000;

export function relTime(iso, suffix = '') {
  if (!iso) return '';
  const ms = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(ms);
  const days = Math.round(abs / 86400000);
  const hours = Math.round(abs / 3600000);
  let core;
  if (abs < 3600000) core = 'just now';
  else if (abs < 86400000) core = `${hours}h ${ms < 0 ? 'ago' : 'from now'}`;
  else core = `${days}d ${ms < 0 ? 'ago' : 'from now'}`;
  return suffix ? `${core}${suffix}` : core;
}

// Wave 4.1b §5 — broadened from Sun 7PM-Mon 7AM to Sat AM through
// Mon AM so admins see the reminder over the whole prep window.
// ET via fixed -4h offset (May = EDT). Refine when org expands TZs.
export function weeklyDigestDueWindow(now = new Date()) {
  const et = new Date(now.getTime() - 4 * 3600000);
  const dow = et.getUTCDay();
  const hour = et.getUTCHours();
  if (dow === 6) return hour >= 6;
  if (dow === 0) return true;
  if (dow === 1 && hour < 7) return true;
  return false;
}

export function buildPrelimRows(tournaments, sentAnchorIds, testSentAnchorIds = []) {
  const skip = new Set(sentAnchorIds);
  const testSent = new Set(testSentAnchorIds);
  return (tournaments || [])
    .filter((t) => !skip.has(t.id))
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .map((t) => ({
      synthetic_id: `needs_prelim_${t.id}`,
      status: 'needs_briefing_tournament',
      kind: 'tournament_prelim',
      anchor_kind: 'tournament', anchor_id: t.id,
      team_ids: t.team_ids || [],
      // Wave 4.1d-2 §2.6: align label with KIND_METADATA "Tournament briefing"
      title: `Tournament briefing · ${t.name}`,
      audience_preview: testSent.has(t.id) ? 'Test sent · families pending' : 'Pre-tournament briefing not sent yet',
      relative_time: relTime(t.start_date),
    }));
}

export function buildTournRecapRows(tournaments, sentAnchorIds, testSentAnchorIds = []) {
  const skip = new Set(sentAnchorIds);
  const testSent = new Set(testSentAnchorIds);
  return (tournaments || [])
    .filter((t) => !skip.has(t.id))
    .sort((a, b) => new Date(b.end_date) - new Date(a.end_date))
    .map((t) => ({
      synthetic_id: `needs_tourn_recap_${t.id}`,
      status: 'needs_briefing_tournament_recap',
      kind: 'tournament_recap',
      anchor_kind: 'tournament', anchor_id: t.id,
      team_ids: t.team_ids || [],
      title: `Tournament recap · ${t.name}`,
      audience_preview: testSent.has(t.id) ? 'Test sent · families pending' : 'Post-tournament recap not sent yet',
      relative_time: relTime(t.end_date),
    }));
}

export function buildGameRecapRows(games, sentAnchorIds, cap = GAME_RECAP_VISIBLE_CAP, testSentAnchorIds = []) {
  const skip = new Set(sentAnchorIds);
  const testSent = new Set(testSentAnchorIds);
  const remaining = (games || [])
    .filter((e) => !skip.has(e.id))
    .sort((a, b) => new Date(b.start_at) - new Date(a.start_at));
  const visible = remaining.slice(0, cap).map((e) => ({
    synthetic_id: `needs_recap_${e.id}`,
    status: 'needs_briefing_game',
    kind: 'game_recap',
    anchor_kind: 'event', anchor_id: e.id,
    team_id: e.team_id,
    title: `Game recap · ${e.teams?.name || ''} · ${e.title}`,
    audience_preview: testSent.has(e.id) ? 'Test sent · families pending' : 'Recap not sent yet',
    relative_time: relTime(e.start_at, ' (game ended)'),
  }));
  const overflow = remaining.length - cap;
  if (overflow > 0) {
    visible.push({
      synthetic_id: 'needs_recap_more',
      status: 'more_recaps_collapsed',
      kind: 'game_recap',
      anchor_kind: 'event', anchor_id: null,
      title: `+${overflow} more game${overflow === 1 ? '' : 's'} need${overflow === 1 ? 's' : ''} a recap`,
      audience_preview: 'Compose individually from the games tab.',
      relative_time: '',
    });
  }
  return visible;
}

export function buildSkippedRows(audits) {
  return (audits || []).map((eca) => ({
    synthetic_id: `skipped_${eca.id}`,
    status: 'schedule_change_skipped',
    kind: 'schedule_change',
    anchor_kind: 'event', anchor_id: eca.event_id,
    team_id: eca.events?.team_id,
    eca_diff: { before: eca.before_jsonb, after: eca.after_jsonb, recurrence_scope: eca.recurrence_scope },
    title: `Schedule change · ${eca.events?.title || ''}`,
    audience_preview: 'Skipped notification — families unaware',
    relative_time: relTime(eca.changed_at),
  }));
}

export function buildDigestDueRow(orgId, mondayIso) {
  return {
    synthetic_id: `digest_due_${mondayIso.slice(0, 10)}`,
    status: 'weekly_digest_due',
    kind: 'weekly_digest',
    anchor_kind: 'org', anchor_id: orgId,
    title: 'Weekly digest · all program families',
    audience_preview: 'Due Monday 7 AM ET',
    relative_time: 'this week',
  };
}
