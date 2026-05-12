// Wave 4.8 6c — pure helpers for the lone remaining client-side synth
// surface: weekly_digest_due. The 3 builder functions for game_recap /
// tournament_prelim / tournament_recap and the schedule_change_skipped
// builder were deleted in PR #120 when the briefing_active_queue RPC
// took over those surfaces server-side. relTime + GAME_RECAP_VISIBLE_CAP
// + the window constants are removed in the same pass — no caller
// references them after the trim.

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
