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
  };
}
