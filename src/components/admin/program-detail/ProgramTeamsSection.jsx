import { useState } from 'react';
import TeamFormSheet from '../TeamFormSheet';
import Toast from '../../shared/Toast';
import { useProgramTeams } from '../../../hooks/useProgramTeams';
import { TEAM_TYPE_OPTIONS } from '../../../lib/teamTypes';

// Teams-in-place on the program detail page (render R3). Team create/edit is
// launched HERE so the program is implicit context — TeamFormSheet receives
// programType for its smart default, and useProgramTeams writes season_id =
// this program (so camp/clinic teams land on the right program).
const TYPE_LABEL = Object.fromEntries(TEAM_TYPE_OPTIONS.map((o) => [o.slug, o.label]));

export default function ProgramTeamsSection({ programId, programType }) {
  const { teams, loading, createTeam, updateTeam, deleteTeam } = useProgramTeams(programId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);

  const save = async (payload) => {
    const { error } = editing ? await updateTeam(editing.id, payload) : await createTeam(payload);
    if (error) setToast({ message: error, variant: 'error' });
    else { setToast({ message: editing ? 'Team updated' : 'Team created', variant: 'success' }); setSheetOpen(false); }
  };
  const remove = async (id) => {
    const { error } = await deleteTeam(id);
    if (error) setToast({ message: error, variant: 'error' });
    else { setToast({ message: 'Team deleted', variant: 'success' }); setSheetOpen(false); }
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div style={secLabel}>
        <span>Teams</span>
        <button type="button" onClick={() => { setEditing(null); setSheetOpen(true); }} style={addBtn}>+ Add team</button>
      </div>
      {loading ? (
        <div style={muted}>Loading teams…</div>
      ) : teams.length === 0 ? (
        <div style={muted}>No teams yet. Add the first one.</div>
      ) : (
        <div style={card}>
          {teams.map((t) => (
            <button key={t.id} type="button" onClick={() => { setEditing(t); setSheetOpen(true); }} style={row}>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 550, color: 'var(--as-text-primary)' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: t.team_color || 'var(--as-border-default)', marginRight: 8 }} />
                {t.name}
              </span>
              <span style={{ fontSize: 12, color: 'var(--as-text-secondary)' }}>{TYPE_LABEL[t.team_types?.slug] || 'Team'}</span>
            </button>
          ))}
        </div>
      )}
      <TeamFormSheet
        open={sheetOpen} program={editing} programType={programType}
        onClose={() => setSheetOpen(false)} onSave={save} onDelete={remove}
      />
      <Toast message={toast?.message} variant={toast?.variant} onDismiss={() => setToast(null)} />
    </div>
  );
}

const secLabel = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--as-text-tertiary)', margin: '0 4px 8px' };
const addBtn = { background: 'none', border: 'none', color: 'var(--as-accent)', fontSize: 13, fontWeight: 700, cursor: 'pointer' };
const muted = { fontSize: 13, color: 'var(--as-text-tertiary)', padding: '4px 4px 0' };
const card = { backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 10, boxShadow: 'var(--as-shadow-sm)', padding: '2px 12px' };
const row = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 2px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' };
