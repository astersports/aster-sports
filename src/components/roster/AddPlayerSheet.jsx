import { useMemo, useState } from 'react';
import { Check, Plus, Search } from 'lucide-react';
import FullScreenForm from '../shared/FullScreenForm';
import { useTeamCandidates } from '../../hooks/useTeamCandidates';
import { useToast } from '../../context/useToast';

// Teams PR-2 Part A — FullScreenForm (AP #15: a multi-field picker, not a
// BottomSheet) listing org players not on this team. A top mode toggle sets
// whether taps add to Roster or Academy (team_players.roster_type); each row
// adds immediately via add_roster_member and flips to an "Added" check.
export default function AddPlayerSheet({ open, onClose, teamId, orgId, teamColor, addPlayer }) {
  const { candidates, loading } = useTeamCandidates(teamId, orgId, open);
  const { showToast } = useToast();
  const [q, setQ] = useState('');
  const [mode, setMode] = useState('rostered'); // 'rostered' | 'futures'
  const [added, setAdded] = useState({}); // playerId -> true
  const [busyId, setBusyId] = useState(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return candidates.filter((p) => !s || `${p.first_name} ${p.last_name}`.toLowerCase().includes(s));
  }, [candidates, q]);

  const handleAdd = async (p) => {
    setBusyId(p.id);
    try {
      await addPlayer(p.id, mode);
      setAdded((a) => ({ ...a, [p.id]: true }));
      showToast(`Added ${p.first_name} to ${mode === 'futures' ? 'the Academy' : 'the roster'}`, 'success');
    } catch {
      showToast('Looks like that didn’t go through. Try again?', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <FullScreenForm
      open={open} onClose={onClose} title="Add player"
      footer={<button type="button" onClick={onClose} className="as-press" style={{ minHeight: 44, padding: '0 20px', borderRadius: 10, backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 15, fontWeight: 600, border: 'none' }}>Done</button>}
    >
      <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
        <button type="button" onClick={() => setMode('rostered')} className="as-press" style={seg(mode === 'rostered')}>Roster</button>
        <button type="button" onClick={() => setMode('futures')} className="as-press" style={seg(mode === 'futures')}>Academy</button>
      </div>
      <div className="flex items-center" style={{ gap: 8, marginBottom: 12, padding: '0 12px', height: 44, borderRadius: 10, backgroundColor: 'var(--as-bg-tertiary)', border: '1.5px solid var(--as-border-default)' }}>
        <Search size={16} strokeWidth={1.75} color="var(--as-text-tertiary)" aria-hidden="true" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search players" aria-label="Search players"
          style={{ flex: 1, border: 'none', background: 'none', fontSize: 15, color: 'var(--as-text-primary)', outline: 'none' }} />
      </div>
      {loading ? (
        <div style={empty}>Loading players…</div>
      ) : filtered.length === 0 ? (
        <div style={empty}>{q ? 'No players match.' : 'Everyone in the org is already on this team.'}</div>
      ) : (
        <div style={{ backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)', overflow: 'hidden' }}>
          {filtered.map((p, i) => {
            const done = added[p.id];
            return (
              <div key={p.id} className="flex items-center" style={{ padding: '10px 14px', gap: 12, borderBottom: i === filtered.length - 1 ? 'none' : '1px solid var(--as-border-subtle)' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: teamColor || 'var(--as-neutral)', color: 'var(--as-text-inverse)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                  {(p.last_name || p.first_name || '?').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="truncate" style={{ fontSize: 15, fontWeight: 600, color: 'var(--as-text-primary)' }}>{p.first_name} {p.last_name}</div>
                  {p.grade != null && <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)' }}>{ordinal(p.grade)} grade</div>}
                </div>
                <button
                  type="button" disabled={done || busyId === p.id} onClick={() => handleAdd(p)}
                  aria-label={done ? `${p.first_name} ${p.last_name} added` : `Add ${p.first_name} ${p.last_name}`}
                  className="as-press flex items-center"
                  style={{ minHeight: 36, padding: '0 12px', gap: 4, borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', backgroundColor: done ? 'var(--as-success-soft)' : 'var(--as-accent-soft)', color: done ? 'var(--as-success)' : 'var(--as-accent)', opacity: busyId === p.id ? 0.6 : 1 }}
                >
                  {done ? <><Check size={15} strokeWidth={2} aria-hidden="true" /> Added</> : <><Plus size={15} strokeWidth={2} aria-hidden="true" /> Add</>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </FullScreenForm>
  );
}

const seg = (active) => ({ flex: 1, minHeight: 36, borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid var(--as-border-default)', backgroundColor: active ? 'var(--as-accent)' : 'var(--as-bg-card)', color: active ? 'var(--as-text-inverse)' : 'var(--as-text-secondary)' });
const empty = { padding: 20, textAlign: 'center', color: 'var(--as-text-tertiary)', fontSize: 14 };

function ordinal(g) {
  if (g === 1) return '1st';
  if (g === 2) return '2nd';
  if (g === 3) return '3rd';
  return `${g}th`;
}
