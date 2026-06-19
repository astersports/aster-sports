import { useMemo, useState } from 'react';
import { UserPlus } from 'lucide-react';
import CollapsibleSection from '../shared/CollapsibleSection';
import StaffRow from './StaffRow';
import StaffRowMenu from './StaffRowMenu';
import CoachCompForm from './CoachCompForm';
import { useTeamStaff } from '../../hooks/useTeamStaff';
import { useCoachActions } from '../../hooks/useCoachActions';
import { useAuth } from '../../context/AuthContext';
import { useHomeRole } from '../../hooks/useHomeRole';
import { compSummary } from '../../lib/roster/coachComp';

// Teams PR-2 Part B — the team's Staff (coaches) + comp. Admin assigns / edits /
// removes; a coach sees the list read-only and only their OWN comp. Parents
// don't reach this (gated at the page). isAdmin = realRole (actions match the
// roster ⋯ precedent); comp visibility + summary = activeRole + own-userId so
// view-as-coach faithfully hides peers' pay (mirrors the roster money signal).
export default function StaffSection({ team }) {
  const { role: realRole, user, orgId } = useAuth();
  const { activeRole } = useHomeRole();
  const { staff, loading, refetch } = useTeamStaff(team.id);
  const actions = useCoachActions(team.id, refetch);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [menuCoach, setMenuCoach] = useState(null);

  const isAdmin = realRole === 'admin';
  const existingUserIds = useMemo(() => staff.map((s) => s.userId), [staff]);
  const summary = activeRole === 'admin' ? compSummary(staff) : null;
  const subtitle = staff.length ? `${staff.length} coach${staff.length === 1 ? '' : 'es'}${summary ? ` · ${summary}` : ''}` : null;

  if (loading && staff.length === 0) return null;

  return (
    <CollapsibleSection title="Staff" sectionKey="staff" count={`${staff.length}`} subtitle={subtitle} defaultOpen={false}>
      {isAdmin && (
        <div className="flex items-center justify-end" style={{ marginBottom: 8 }}>
          <button type="button" aria-label="Assign coach to team" onClick={() => { navigator.vibrate?.(10); setAssignOpen(true); }}
            className="as-press flex items-center" style={{ minHeight: 36, padding: '0 12px', gap: 6, borderRadius: 8, border: '1px solid var(--as-accent)', backgroundColor: 'var(--as-accent-soft)', color: 'var(--as-accent)', fontSize: 13, fontWeight: 600 }}>
            <UserPlus size={16} strokeWidth={1.75} aria-hidden="true" /> Assign coach
          </button>
        </div>
      )}
      {staff.length === 0 ? (
        <div style={{ padding: 16, textAlign: 'center', fontSize: 13, color: 'var(--as-text-tertiary)' }}>No coaches assigned yet.</div>
      ) : (
        <div style={{ backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)', overflow: 'hidden' }}>
          {staff.map((c, i) => (
            <StaffRow key={c.userId} coach={c} teamColor={team.team_color} isLast={i === staff.length - 1}
              isAdmin={isAdmin} canSeeComp={activeRole === 'admin' || c.userId === user?.id} onMenu={setMenuCoach} />
          ))}
        </div>
      )}
      {isAdmin && (
        <>
          <CoachCompForm key={`${editing ? `e-${editing.userId}` : 'a'}-${assignOpen || !!editing ? 1 : 0}`}
            open={assignOpen || !!editing} onClose={() => { setAssignOpen(false); setEditing(null); }}
            orgId={orgId} coach={editing} existingUserIds={existingUserIds} assignCoach={actions.assignCoach} onDone={refetch} />
          <StaffRowMenu open={!!menuCoach} onClose={() => setMenuCoach(null)} coach={menuCoach}
            onEditComp={setEditing} removeCoach={actions.removeCoach} />
        </>
      )}
    </CollapsibleSection>
  );
}
