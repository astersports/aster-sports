import { programRule } from '../../lib/programRegistry';

// One child's card on the parent My Family surface (PR-B1): first name + grade,
// then a row per enrollment (team_color dot · team/program · program·type ·
// status badge). Imported roster rows read "Enrolled"; funnel rows read the
// registration lifecycle. --as-* tokens only; team_color is the sanctioned DB hex.
const STATUS = {
  enrolled: { label: 'Enrolled', fg: 'var(--as-success)', bg: 'var(--as-success-soft)' },
  confirmed: { label: 'Confirmed', fg: 'var(--as-success)', bg: 'var(--as-success-soft)' },
  pending: { label: 'Pending', fg: 'var(--as-warning)', bg: 'var(--as-warning-soft)' },
  waitlist: { label: 'Waitlist', fg: 'var(--as-info)', bg: 'var(--as-info-soft)' },
  payment_overdue: { label: 'Overdue', fg: 'var(--as-danger)', bg: 'var(--as-danger-soft)' },
};

export default function ChildProgramCard({ child }) {
  return (
    <section style={card} aria-label={`${child.firstName} enrollments`}>
      <div style={head}>
        <span style={name}>{child.firstName}</span>
        {child.grade != null && <span style={grade}>Grade {child.grade}</span>}
      </div>
      {child.enrollments.length === 0 ? (
        <div style={emptyRow}>Not enrolled in a program yet.</div>
      ) : child.enrollments.map((e, i) => {
        const st = STATUS[e.status] || STATUS.enrolled;
        const typeLabel = programRule(e.programType).label;
        const primary = e.teamName || e.programName;
        const secondary = e.teamName ? `${e.programName} · ${typeLabel}` : typeLabel;
        return (
          <div key={`${e.programId}-${i}`} style={row}>
            <span style={{ ...dot, backgroundColor: e.teamColor || 'var(--as-border-default)' }} aria-hidden="true" />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={primaryStyle}>{primary}</span>
              <span style={secondaryStyle}>{secondary}</span>
            </span>
            <span style={{ ...badge, color: st.fg, backgroundColor: st.bg }}>{st.label}</span>
          </div>
        );
      })}
    </section>
  );
}

const card = { backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 13, overflow: 'hidden', marginBottom: 12 };
const head = { display: 'flex', alignItems: 'baseline', gap: 8, padding: '13px 15px 9px' };
const name = { fontSize: 16, fontWeight: 700, color: 'var(--as-text-primary)' };
const grade = { fontSize: 11.5, fontWeight: 600, color: 'var(--as-text-meta)' };
const row = { display: 'flex', alignItems: 'center', gap: 11, padding: '12px 15px', borderTop: '1px solid var(--as-border-subtle)', minHeight: 48 };
const emptyRow = { padding: '4px 15px 14px', fontSize: 13, color: 'var(--as-text-meta)' };
const dot = { width: 11, height: 11, borderRadius: '50%', flex: 'none' };
const primaryStyle = { display: 'block', fontSize: 15, fontWeight: 600, color: 'var(--as-text-primary)' };
const secondaryStyle = { display: 'block', fontSize: 11.5, color: 'var(--as-text-secondary)', marginTop: 1 };
const badge = { fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 5, flex: 'none' };
