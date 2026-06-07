// Pure grouping + display mapping for the /admin/programs index (PR-3, render R1).
// Kept client-free so it's unit-testable (AP#27).
//
// Active   = running now (non-archived, started on/before today).
// Upcoming = non-archived but starts later (F12: 'active' is a lifecycle status,
//            not "running" — a future-dated active camp belongs under Upcoming).
// Archived = anything archived.

const TYPE_LABEL = {
  season: 'Season', camp: 'Camp', clinic: 'Clinic',
  tryout: 'Tryout', evaluation: 'Evaluation', interest_list: 'Interest list',
};

// Season reads as the platform primary (info/cobalt); non-season programs share
// the academy token so they read apart from seasons at a glance. Locked --as
// tokens only — the render's teal is not a token (§0 anti-drift #1/#2).
export function programBadge(programType) {
  return {
    label: TYPE_LABEL[programType] || programType,
    variant: programType === 'season' ? 'info' : 'academy',
  };
}

export function groupPrograms(programs, today = new Date()) {
  const todayStr = today.toISOString().slice(0, 10);
  const active = [], upcoming = [], archived = [];
  for (const p of programs || []) {
    if (p.status === 'archived') archived.push(p);
    else if (p.startDate && p.startDate > todayStr) upcoming.push(p);
    else active.push(p);
  }
  return [
    { key: 'active', label: 'Active · running now', programs: active },
    { key: 'upcoming', label: 'Upcoming · starts later', programs: upcoming },
    { key: 'archived', label: 'Archived', programs: archived },
  ].filter((g) => g.programs.length > 0);
}
