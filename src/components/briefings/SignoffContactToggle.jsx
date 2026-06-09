// Per-message contact-info control for the signoff. Contact info (the coach
// signature line + name · title · phone block) is OFF by default on every
// message; the admin opts in here and picks who to include. The selected
// staff objects flow into composer state (signoff_coaches) and out through
// bodyOverrides → buildSignoffSection, uniform across every recipient.

import { useOrgStaff } from '../../hooks/useOrgStaff';
import { labelStyle } from './bodies/_styles';

const rowStyle = { display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, cursor: 'pointer' };
const checkStyle = { width: 18, height: 18, flexShrink: 0, accentColor: 'var(--as-accent)' };

export default function SignoffContactToggle({ state, dispatch, orgId }) {
  const { staff, loading } = useOrgStaff(orgId);
  const enabled = state.signoff_enabled === true;
  const selected = Array.isArray(state.signoff_coaches) ? state.signoff_coaches : [];
  const isPicked = (s) => selected.some((c) => c.user_id === s.user_id);

  const onToggle = (e) => {
    // Explicit-pick model: enabling does NOT pre-select staff — the admin checks
    // who to include (default = nobody → no signature). Off by default; compose
    // has no all-staff fallback either (see lib/briefings/signoffCoaches).
    dispatch({ type: 'TOGGLE_SIGNOFF', value: e.target.checked });
  };

  const onPick = (s) => {
    const next = isPicked(s)
      ? selected.filter((c) => c.user_id !== s.user_id)
      : [...selected, { user_id: s.user_id, display_name: s.display_name, title: s.title, phone: s.phone }];
    dispatch({ type: 'SET_SIGNOFF_COACHES', value: next });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, border: '1px solid var(--as-border-default)', borderRadius: 10, backgroundColor: 'var(--as-bg-card-hover)' }}>
      <label style={rowStyle}>
        <input type="checkbox" checked={enabled} onChange={onToggle} style={checkStyle}
          aria-label="Include coach contact information on this message" />
        <span style={labelStyle}>Include coach contact info</span>
      </label>
      <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)', lineHeight: 1.4, marginTop: -4 }}>
        Off by default. When on, the chosen names + phone numbers appear at the bottom of this message.
      </div>
      {enabled && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, borderTop: '1px solid var(--as-border-subtle)', paddingTop: 8 }}>
          <span style={{ ...labelStyle, marginBottom: 4 }}>Who to include</span>
          {loading && <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)' }}>Loading staff…</div>}
          {!loading && staff.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)' }}>No staff profiles found for this org.</div>
          )}
          {staff.map((s) => (
            <label key={s.user_id} style={rowStyle}>
              <input type="checkbox" checked={isPicked(s)} onChange={() => onPick(s)} style={checkStyle}
                aria-label={`Include ${s.display_name || 'staff member'}`} />
              <span style={{ fontSize: 14, color: 'var(--as-text-primary)' }}>
                {s.display_name}
                {s.title ? <span style={{ color: 'var(--as-text-tertiary)' }}> · {s.title}</span> : null}
                {!s.phone ? <span style={{ color: 'var(--as-text-tertiary)' }}> · no phone</span> : null}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
