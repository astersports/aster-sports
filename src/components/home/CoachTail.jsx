// CoachTail — slot 5 (RoleTail) for coach home. Day-one = the "My teams"
// compact context card (per HOME_RENDERS coach): one card, a team rail per
// team (color dot · name · record). Records source stays useOrgTeamRecords
// (threaded as recordsByTeam) — the same source Parent's records use, so the
// anti-pattern #43 records invariant holds across the redesign.
//
// COMP CARD DEFERRED (D-A, Phase 2.5): production has the per-session rate
// but no accrual (coach_payouts = 0, event_coach_assignments = 0) and no
// coach pay surface — rendering a figure would be fabrication (AP#27).
const LABEL = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--as-text-meta)', marginBottom: 8, padding: '0 2px',
};

export default function CoachTail({ teams, recordsByTeam, recordsLoading, onTeamClick }) {
  if (!teams?.length) return null;
  const accent = teams[0]?.team_color || 'var(--as-accent)';
  return (
    <section className="min-w-0" aria-label="My teams">
      <div style={LABEL}>My teams</div>
      <div style={{
        backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)',
        borderTop: `3px solid ${accent}`, borderRadius: 12, boxShadow: 'var(--as-shadow-sm)',
        padding: '4px 13px',
      }}>
        {teams.map((t, i) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTeamClick(t.id)}
            className="as-press"
            aria-label={`${t.name} team`}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%', minHeight: 44,
              padding: '8px 0', background: 'none', border: 'none',
              borderTop: i > 0 ? '1px solid var(--as-border-subtle)' : 'none',
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
            }}
          >
            <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: t.team_color || 'var(--as-neutral)', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--as-text-primary)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: 'var(--as-text-secondary)', flexShrink: 0 }}>
              {recordsLoading ? '—' : (recordsByTeam[t.id]?.record || '0-0')}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
