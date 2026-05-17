// Tier 3 v1 PR 6 — coach roster snapshot container.
//
// Renders one CoachRosterSnapshotTeam per team in the coach's
// team_staff list. Each team subcomponent loads its own attendance
// data via useAttendanceData(teamId).
//
// Per Q3 lock: per-team fetch. Acceptable at Legacy scale; v2
// concern pinned in retrospective notes.

import CoachRosterSnapshotTeam from './CoachRosterSnapshotTeam';

export default function CoachRosterSnapshot({ teams }) {
  if (!teams || teams.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {teams.map((t) => (
        <CoachRosterSnapshotTeam key={t.id} team={t} />
      ))}
    </div>
  );
}
