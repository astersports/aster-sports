import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../../shared/ConfirmDialog';
import Toast from '../../shared/Toast';
import ProgramEditSheet from './ProgramEditSheet';
import { useProgramAdmin } from '../../../hooks/useProgramAdmin';
import { dependencySummary } from '../../../lib/programDelete';

// Program manage zone on the detail page (PR-3 F14): Edit + Delete. Delete
// confirms with a dependency count and cascades; on success returns to the
// programs index. Archive/Activate is deferred to the draft-status build.
export default function ProgramManageZone({ program, onUpdated }) {
  const navigate = useNavigate();
  const { counts, refetchCounts, updateProgram, deleteProgram } = useProgramAdmin(program.id);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [toast, setToast] = useState(null);

  const save = async (fields) => {
    const { error } = await updateProgram(fields);
    if (error) { setToast({ message: error, variant: 'error' }); return; }
    setEditOpen(false);
    onUpdated?.();
    setToast({ message: 'Program updated', variant: 'success' });
  };

  const doDelete = async () => {
    const { error } = await deleteProgram();
    setConfirmDel(false);
    if (error) setToast({ message: error, variant: 'error' });
    else navigate('/admin/programs');
  };

  return (
    <div style={zone}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => setEditOpen(true)} className="as-press" style={editBtn}>Edit program</button>
        <button type="button" onClick={() => { refetchCounts(); setConfirmDel(true); }} className="as-press" style={delBtn}>Delete</button>
      </div>

      <ProgramEditSheet open={editOpen} program={program} onClose={() => setEditOpen(false)} onSave={save} />

      {confirmDel && <ConfirmDialog
        title={`Delete ${program.name}?`}
        message={`This permanently removes the program and everything under it: ${dependencySummary(counts)}. This can't be undone.`}
        confirmLabel="Delete program"
        destructive
        onCancel={() => setConfirmDel(false)}
        onConfirm={doDelete}
      />}

      <Toast message={toast?.message} variant={toast?.variant} onDismiss={() => setToast(null)} />
    </div>
  );
}

const zone = { marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--as-border-subtle)' };
const editBtn = { flex: 1, minHeight: 44, borderRadius: 10, fontSize: 15, fontWeight: 600, border: '1px solid var(--as-accent)', backgroundColor: 'var(--as-bg-card)', color: 'var(--as-accent)', cursor: 'pointer' };
const delBtn = { flex: 1, minHeight: 44, borderRadius: 10, fontSize: 15, fontWeight: 600, border: 'none', backgroundColor: 'var(--as-danger-soft)', color: 'var(--as-danger)', cursor: 'pointer' };
