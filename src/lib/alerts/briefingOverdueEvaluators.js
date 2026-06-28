// §4.AI Option C PR B — per-instance evaluators for the
// `briefing_overdue` alert_type. Moved out of evaluator.js to keep
// that file under the 150-line cap (AP #11) while adding the 2 new
// game_recap / tournament_recap sub-keys.
//
// Each function takes (config, queryExecutor) and returns either null
// (no fire) OR { config_id, alert_type_key, instance_key, severity,
// data } — same shape as all other alert evaluators.

function computeWeekStartIso(weekStartLocal) {
  const day = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 }[weekStartLocal] ?? 0;
  // Anchor the week-start on the current ET calendar day, not the machine's
  // local day. The server runs UTC, so `new Date().getDay()`/`getDate()` can
  // be a day off for late-evening ET. Read ET parts via Intl (the codebase's
  // established America/New_York pattern, e.g. engine/etDate.js).
  const now = new Date();
  const NY_TZ = 'America/New_York';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: NY_TZ, year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short',
  }).formatToParts(now);
  const get = (t) => parts.find((p) => p.type === t)?.value || '';
  const dowMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const etDow = dowMap[get('weekday')] ?? 0;
  // Build a UTC-midnight date for the ET calendar day, then step back to the
  // configured week-start weekday. ISO out is a stable, date-granular cutoff.
  const dt = new Date(Date.UTC(Number(get('year')), Number(get('month')) - 1, Number(get('day')) - ((etDow - day + 7) % 7)));
  return dt.toISOString();
}

export async function evalBriefingOverdue(config, qx) {
  const cfg = config.threshold_config || {};
  const sinceTs = computeWeekStartIso(cfg.week_start_local || 'Sunday');
  const recent = await qx.getMostRecentBriefingByKind(config.org_id, cfg.briefing_kind, sinceTs);
  if (recent) return null;
  return { config_id: config.id, alert_type_key: 'briefing_overdue', instance_key: config.instance_key,
    severity: cfg.severity || 'warning',
    data: { briefing_kind: cfg.briefing_kind, expected_send_by: cfg.expected_send_by_local } };
}

export async function evalBriefingOverdueTournament(config, qx) {
  const cfg = config.threshold_config || {};
  const tournaments = await qx.getTournamentsWithoutPrelim(config.org_id, 3);
  if (!tournaments.length) return null;
  return { config_id: config.id, alert_type_key: 'briefing_overdue', instance_key: config.instance_key,
    severity: cfg.severity || 'warning',
    data: { tournaments, expected_send_by: cfg.alert_fire_time_local } };
}

// §4.AI new — fires when a game ended ≥sinceHours ago and no
// game_recap briefing was queued/sent against its event.anchor_id.
export async function evalBriefingOverdueGameRecap(config, qx) {
  const cfg = config.threshold_config || {};
  const sinceHours = cfg.since_hours ?? 24;
  const events = await qx.getGameRecapPendingEvents(config.org_id, sinceHours);
  if (!events.length) return null;
  return { config_id: config.id, alert_type_key: 'briefing_overdue', instance_key: config.instance_key,
    severity: cfg.severity || 'warning',
    data: { events, count: events.length } };
}

// §4.AI new — fires when a tournament ended ≥sinceDays ago and no
// tournament_recap briefing was queued/sent against its tournament_id.
export async function evalBriefingOverdueTournamentRecap(config, qx) {
  const cfg = config.threshold_config || {};
  const sinceDays = cfg.since_days ?? 2;
  const tournaments = await qx.getTournamentRecapPendingTournaments(config.org_id, sinceDays);
  if (!tournaments.length) return null;
  return { config_id: config.id, alert_type_key: 'briefing_overdue', instance_key: config.instance_key,
    severity: cfg.severity || 'warning',
    data: { tournaments, count: tournaments.length } };
}

export { computeWeekStartIso };
