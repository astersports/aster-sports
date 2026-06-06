import ParentHomeTeamCard from './ParentHomeTeamCard';

// CoachTail — slot 5 (RoleTail) for coach home. Day-one = MY TEAMS records
// (reuses ParentHomeTeamCard + useOrgTeamRecords, the same source Parent's
// records use — preserves the AP#43 cross-surface records invariant).
//
// COMP CARD DEFERRED (flagged to design lane): the canon tail also wants a
// "this month · pay" comp card. Production has the per-session RATE
// (coaching_assignments.pay_per_session_cents, 11 rows) but NO accrual data
// — coach_payouts = 0 rows and event_coach_assignments = 0 (no session
// count), and there is no coach-facing pay surface to link to. Rendering
// "$X · N sessions" would be fabrication (AP#27). Comp lands when a coach
// pay surface + accrual source exist; tracked as a Phase-2 follow-up.
const LABEL = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--as-text-meta)', marginBottom: 8, padding: '0 2px',
};

export default function CoachTail({ teams, recordsByTeam, recordsLoading, onTeamClick }) {
  if (!teams?.length) return null;
  return (
    <section className="min-w-0" aria-label="My teams">
      <div style={LABEL}>My teams</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 4 }}>
        {teams.map((t) => (
          <ParentHomeTeamCard
            key={t.id}
            team={t}
            summary={recordsByTeam[t.id]}
            loading={recordsLoading}
            onClick={() => onTeamClick(t.id)}
          />
        ))}
      </div>
    </section>
  );
}
