// RV-5b: per-team 3-state roster visibility (Inherit / Show / Hide), writing
// teams.roster_visibility_override (null / true / false). Inherit shows the resolved
// program value inline (by program type) so the admin knows what Inherit means here.
const OPTS = [
  { key: 'inherit', label: 'Inherit', value: null },
  { key: 'show', label: 'Show', value: true },
  { key: 'hide', label: 'Hide', value: false },
];

export default function RosterVisibilityField({ value, programType, onChange }) {
  const cur = value === true ? 'show' : value === false ? 'hide' : 'inherit';
  const resolved = programType === 'season' ? 'Visible' : 'Hidden';
  return (
    <div style={{ margin: '4px 0 12px' }}>
      <div style={lbl}>Roster visibility</div>
      <div style={seg}>
        {OPTS.map((o) => {
          const on = cur === o.key;
          return (
            <button
              key={o.key} type="button" onClick={() => onChange(o.value)} aria-pressed={on}
              className="as-press" style={btn(on)}
            >
              <span>{o.label}</span>
              {o.key === 'inherit' && <small style={on ? subOn : sub}>{resolved}</small>}
            </button>
          );
        })}
      </div>
      <div style={help}>Inherit follows the program. Override only this team.</div>
    </div>
  );
}

const lbl = { fontSize: 11, fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--as-text-tertiary)', marginBottom: 6 };
const seg = { display: 'flex', gap: 7 };
const btn = (on) => ({
  flex: 1, minHeight: 46, borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
  fontSize: 13, fontWeight: on ? 700 : 600, fontFamily: 'inherit', cursor: 'pointer',
  border: `1px solid ${on ? 'var(--as-accent)' : 'var(--as-border-default)'}`,
  backgroundColor: on ? 'var(--as-accent-soft)' : 'var(--as-bg-card)',
  color: on ? 'var(--as-accent)' : 'var(--as-text-secondary)',
});
const sub = { fontSize: 9.5, fontWeight: 600, color: 'var(--as-text-tertiary)' };
const subOn = { ...sub, color: 'var(--as-accent)' };
const help = { fontSize: 12, color: 'var(--as-text-tertiary)', marginTop: 8 };
