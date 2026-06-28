// Pure shapers for the parent home tail. Keep ParentHomePage thin.

const ACHIEVEMENT_LABELS = {
  champions: 'Champions',
  nationals_qualified: 'Nationals qualified',
  finalists: 'Finalists',
  semifinalists: 'Semifinalists',
  undefeated_season: 'Undefeated season',
  custom: 'Achievement',
};

// Shape a team_achievements row (joined `teams`) + the org records map into
// the ParentTail achievement card props. recordsByTeam is keyed by team_id
// (useOrgTeamRecords) → the W-L badge. Returns null when there's no
// achievement (the tail then renders progress + records only).
export function shapeAchievement(achievement, recordsByTeam = {}) {
  if (!achievement) return null;
  const teamName = achievement.teams?.name || '';
  const typeLabel = ACHIEVEMENT_LABELS[achievement.achievement_type] || 'Achievement';
  const title = achievement.custom_title || [teamName, typeLabel].filter(Boolean).join(' · ');
  return {
    title,
    subtitle: achievement.description || null,
    recordBadge: recordsByTeam[achievement.team_id]?.record || null,
    teamColor: achievement.teams?.team_color || null,
  };
}

// Off-season season-wrap rows (D-D). One row per child: color dot ·
// "Charlie · 11U" · final record badge. Team age + color derive from the
// season's events; the record from recordsByTeam. Gold badge ONLY when the
// team earned an achievement (gold = achievement-only per §3) — a winning
// record alone stays neutral. No record → "—" (honest, never a fake 0-0).
export function shapeChildRecords(myChildren, activities, recordsByTeam = {}, achievementTeamIds = new Set()) {
  const meta = new Map();
  for (const a of activities || []) {
    // Fill meta from the first activity that actually carries a joined `teams`
    // row — an earlier activity for the same team_id with teams=null would
    // otherwise lock in empty age/color.
    if (a.team_id && a.teams && !meta.has(a.team_id)) {
      meta.set(a.team_id, { age: a.teams?.age_group || a.teams?.name || '', color: a.teams?.team_color });
    }
  }
  return (myChildren || []).map((c) => {
    const m = meta.get(c.teamId) || {};
    return {
      key: c.playerId,
      label: [c.firstName, m.age].filter(Boolean).join(' · '),
      color: m.color || 'var(--as-neutral)',
      record: recordsByTeam[c.teamId]?.record || '—',
      gold: achievementTeamIds.has(c.teamId),
    };
  });
}
