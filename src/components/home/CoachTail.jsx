// CoachTail — slot 5 (RoleTail) for coach home. Day-one = the "My teams"
// compact context card (per HOME_RENDERS coach): one card, a team rail per
// team (color dot · name · record). Records source stays useOrgTeamRecords
// (threaded as recordsByTeam) — the same source Parent's records use, so the
// anti-pattern #43 records invariant holds across the redesign — including the
// empty-state default: a recordless team renders '—' here, matching parent
// (parentHomeData), never a fabricated '0-0' (AP#27 / cross-section BUG-H2).
//
// COMP CARD (D-A, ratified 2026-06-07): the comp card ships as a SIBLING slot
// (CoachCompCard on CoachHomePage), hidden until accrual data exists
// (coach_payouts/event_coach_assignments) — option A honored, no fabrication.
// CoachTail itself stays "My teams" only.
import { groupTeamsByProgram } from '../../lib/home/coachHomeData';

const LABEL = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--as-text-meta)', marginBottom: 8, padding: '0 2px',
};
const SUBLABEL = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
  color: 'var(--as-text-meta)', padding: '10px 0 4px',
};

export default function CoachTail({ teams, recordsByTeam, recordsLoading, onTeamClick, offSeason, seasonLabel, programs }) {
  if (!teams?.length) return null;
  const accent = teams[0]?.team_color || 'var(--as-accent)';

  // C-12: when the coach touches more than one active program, render the
  // teams GROUPED under per-program headers. With one program (Legacy today)
  // groups.length === 1 and we fall through to the unchanged flat render
  // below — the no-regression path. Off-season keeps the flat wrap treatment.
  const groups = offSeason ? [] : groupTeamsByProgram(teams, programs);
  if (groups.length > 1) {
    return (
      <section className="min-w-0" aria-label="My teams">
        <div style={LABEL}>My teams</div>
        <div style={{
          backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)',
          borderTop: `3px solid ${accent}`, borderRadius: 12, boxShadow: 'var(--as-shadow-sm)',
          padding: '4px 13px',
        }}>
          {groups.map((g, gi) => (
            <div key={g.programId}>
              <div style={{ ...SUBLABEL, borderTop: gi > 0 ? '1px solid var(--as-border-subtle)' : 'none' }}>{g.label}</div>
              {g.teams.map((t, i) => (
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
                    {recordsLoading ? '—' : (recordsByTeam[t.id]?.record || '—')}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </section>
    );
  }
  return (
    <section className="min-w-0" aria-label={offSeason ? 'Season wrapped' : 'My teams'}>
      <div style={LABEL}>{offSeason ? 'Season wrapped' : 'My teams'}</div>
      <div style={{
        backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)',
        borderTop: `3px solid ${accent}`, borderRadius: 12, boxShadow: 'var(--as-shadow-sm)',
        padding: '4px 13px',
      }}>
        {offSeason && (
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--as-text-primary)', padding: '9px 0 3px' }}>🏁 {seasonLabel}, wrapped</div>
        )}
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
              borderTop: (i > 0 || offSeason) ? '1px solid var(--as-border-subtle)' : 'none',
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
            }}
          >
            <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: t.team_color || 'var(--as-neutral)', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--as-text-primary)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: 'var(--as-text-secondary)', flexShrink: 0 }}>
              {recordsLoading ? '—' : (recordsByTeam[t.id]?.record || '—')}
            </span>
          </button>
        ))}
        {offSeason && (
          <div style={{ fontSize: 12, color: 'var(--as-text-secondary)', borderTop: '1px solid var(--as-border-subtle)', padding: '9px 0 5px' }}>
            Rosters roll over for the next season.
          </div>
        )}
      </div>
    </section>
  );
}
