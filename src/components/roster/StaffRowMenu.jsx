import { useState } from 'react';
import { DollarSign, Trash2, UserMinus } from 'lucide-react';
import BottomSheet from '../shared/BottomSheet';
import { useToast } from '../../context/useToast';
import { compLine, roleLabel } from '../../lib/roster/coachComp';

// Teams PR-2 Part B — admin row actions for a coach. Edit comp re-opens the
// CoachCompForm (via onEditComp). Remove = unassign (keeps payout history);
// Delete is server-guarded (COACH_DELETE_BLOCKED when pay history exists) and
// surfaces as kindness microcopy.
export default function StaffRowMenu({ open, onClose, coach, onEditComp, removeCoach }) {
  const { showToast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!coach) return null;

  const wrap = async (mode, okMsg) => {
    setBusy(true);
    try { await removeCoach(coach.userId, mode); showToast(okMsg, 'success'); onClose(); }
    catch (e) {
      if (String(e?.message).includes('COACH_DELETE_BLOCKED')) {
        showToast('Can’t delete — this coach has pay history on this team. Use Remove instead.', 'error');
      } else {
        showToast('Looks like that didn’t go through. Try again?', 'error');
      }
    } finally { setBusy(false); }
  };

  return (
    <BottomSheet open={open} onClose={onClose} initialHeight="54%" expandedHeight="74%">
      <div style={{ paddingTop: 4 }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--as-text-primary)' }}>{coach.name}</div>
        <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)', marginBottom: 18 }}>{roleLabel(coach.comp?.role || coach.role)} · {compLine(coach.comp)}</div>
        <button type="button" disabled={busy} onClick={() => { onClose(); onEditComp(coach); }} className="as-press flex items-center" style={{ ...ROW, backgroundColor: 'var(--as-bg-secondary)', color: 'var(--as-text-primary)' }}>
          <DollarSign size={18} strokeWidth={1.75} aria-hidden="true" /> Edit comp
        </button>
        <button type="button" disabled={busy} onClick={() => wrap('unassign', `${coach.name} removed from team`)} className="as-press flex items-center" style={{ ...ROW, marginTop: 8, backgroundColor: 'var(--as-warning-soft)', color: 'var(--as-warning)' }}>
          <UserMinus size={18} strokeWidth={1.75} aria-hidden="true" /> Remove from team
        </button>
        <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)', margin: '4px 2px 16px' }}>Keeps payout history; the coach loses access + active rate.</div>
        {!confirmDelete ? (
          <button type="button" disabled={busy} onClick={() => setConfirmDelete(true)} className="as-press flex items-center" style={{ ...ROW, backgroundColor: 'var(--as-danger-soft)', color: 'var(--as-danger)' }}>
            <Trash2 size={18} strokeWidth={1.75} aria-hidden="true" /> Delete permanently
          </button>
        ) : (
          <div style={{ border: '1px solid var(--as-danger)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--as-text-primary)', marginBottom: 4 }}>Delete {coach.name}?</div>
            <div style={{ fontSize: 13, color: 'var(--as-text-secondary)', marginBottom: 12 }}>Removes the coach + their comp rows. Blocked if they have pay history — use Remove instead.</div>
            <div className="flex items-center gap-2">
              <button type="button" disabled={busy} onClick={() => setConfirmDelete(false)} style={GHOST}>Cancel</button>
              <button type="button" disabled={busy} onClick={() => wrap('delete', `${coach.name} deleted`)} style={DANGER}>Delete</button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

const ROW = { width: '100%', minHeight: 48, gap: 10, padding: '0 12px', borderRadius: 10, fontSize: 15, fontWeight: 600, border: 'none', justifyContent: 'flex-start' };
const GHOST = { flex: 1, minHeight: 44, borderRadius: 10, backgroundColor: 'var(--as-bg-secondary)', color: 'var(--as-text-secondary)', fontSize: 15, fontWeight: 600, border: 'none' };
const DANGER = { flex: 1, minHeight: 44, borderRadius: 10, backgroundColor: 'var(--as-danger)', color: 'var(--as-text-inverse)', fontSize: 15, fontWeight: 600, border: 'none' };
