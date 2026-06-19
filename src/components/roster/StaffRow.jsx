import { MoreVertical } from 'lucide-react';
import { compLine, roleLabel } from '../../lib/roster/coachComp';

// Teams PR-2 Part B — one coach on the team. The comp line (rate or
// "Volunteer") renders only when canSeeComp (admin, or the coach's OWN row);
// a coach never sees a peer's rate. Admin gets the ⋯ (edit comp / remove).
export default function StaffRow({ coach, teamColor, canSeeComp, isAdmin, isLast, onMenu }) {
  const initial = (coach.name || 'C').replace(/^Coach\s+/i, '').charAt(0).toUpperCase();
  return (
    <div className="flex items-center" style={{ padding: '10px 14px', gap: 12, borderBottom: isLast ? 'none' : '1px solid var(--as-border-subtle)' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: teamColor || 'var(--as-neutral)', color: 'var(--as-text-inverse)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{initial}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="truncate" style={{ fontSize: 15, fontWeight: 600, color: 'var(--as-text-primary)' }}>{coach.name}</div>
        <div className="flex items-center gap-1" style={{ fontSize: 12, marginTop: 1 }}>
          <span style={{ color: 'var(--as-text-secondary)', fontWeight: 500 }}>{roleLabel(coach.comp?.role || coach.role)}</span>
          {canSeeComp && (
            <>
              <span style={{ color: 'var(--as-text-tertiary)' }}>·</span>
              <span style={{ color: coach.comp ? 'var(--as-success)' : 'var(--as-text-tertiary)', fontWeight: 500 }}>{compLine(coach.comp)}</span>
            </>
          )}
        </div>
      </div>
      {isAdmin && (
        <button type="button" aria-label={`Manage ${coach.name}`} onClick={() => { navigator.vibrate?.(10); onMenu(coach); }}
          className="as-press flex items-center justify-center" style={{ width: 44, height: 44, background: 'none', border: 'none', borderRadius: 8, flexShrink: 0 }}>
          <MoreVertical size={18} strokeWidth={1.75} color="var(--as-text-tertiary)" />
        </button>
      )}
    </div>
  );
}
