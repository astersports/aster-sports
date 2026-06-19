import { useState } from 'react';
import { Hash, Shuffle, Trash2, UserMinus } from 'lucide-react';
import BottomSheet from '../shared/BottomSheet';
import { useToast } from '../../context/useToast';

// Teams PR-2 Part A — per-row manage menu (admin/coach). A row action sheet,
// not a multi-field form: one jersey field + a roster-type toggle + two
// removal actions (AP #15 — BottomSheet is appropriate for a 1-field action
// menu). Writes flow through the PR-0 RPCs (set_jersey / set_roster_type /
// drop_roster_member). Hard delete is server-guarded (ROSTER_HARD_DELETE_
// BLOCKED) and surfaced as kindness microcopy when a player has history.
export default function RosterRowMenu({ open, onClose, player, setJersey, setRosterType, removePlayer }) {
  const { showToast } = useToast();
  const [jersey, setJerseyVal] = useState(player.jersey_number ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const isAcademy = player.roster_type === 'futures';
  const name = `${player.first_name} ${player.last_name}`;

  const wrap = async (fn, okMsg) => {
    setBusy(true);
    try {
      await fn();
      if (okMsg) showToast(okMsg, 'success');
      onClose();
    } catch (e) {
      if (String(e?.message).includes('ROSTER_HARD_DELETE_BLOCKED')) {
        showToast('Can’t delete — this player has payment or registration history. Remove from roster instead.', 'error');
      } else {
        showToast('Looks like that didn’t go through. Try again?', 'error');
      }
    } finally {
      setBusy(false);
    }
  };

  const saveJersey = () => {
    const n = jersey === '' ? null : Number(jersey);
    if (n !== null && (Number.isNaN(n) || n < 0 || n > 99)) { showToast('Jersey must be 0–99.', 'error'); return; }
    wrap(() => setJersey(player.id, n), `Jersey saved for ${player.first_name}`);
  };

  return (
    <BottomSheet open={open} onClose={onClose} initialHeight="62%" expandedHeight="82%">
      <div style={{ paddingTop: 4 }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--as-text-primary)', marginBottom: 2 }}>{name}</div>
        <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)', marginBottom: 18 }}>{isAcademy ? 'Academy' : 'Roster'}{player.jersey_number != null ? ` · #${player.jersey_number}` : ''}</div>

        <label htmlFor="rm-jersey" style={LBL}><Hash size={14} strokeWidth={1.75} aria-hidden="true" /> Jersey number</label>
        <div className="flex items-center" style={{ gap: 8, marginBottom: 18 }}>
          <input id="rm-jersey" value={jersey} inputMode="numeric" aria-label="Jersey number"
            onChange={(e) => setJerseyVal(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
            style={{ flex: 1, height: 44, borderRadius: 10, border: '1.5px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-tertiary)', padding: '0 12px', fontSize: 15, color: 'var(--as-text-primary)' }} />
          <button type="button" disabled={busy} onClick={saveJersey} className="as-press" style={BTN_PRIMARY}>Save</button>
        </div>

        <span style={LBL}><Shuffle size={14} strokeWidth={1.75} aria-hidden="true" /> Roster type</span>
        <div className="flex items-center gap-2" style={{ marginTop: 8, marginBottom: 18 }}>
          <button type="button" disabled={busy} style={seg(!isAcademy)}
            onClick={() => { if (isAcademy) wrap(() => setRosterType(player.id, 'rostered'), `${player.first_name} moved to Roster`); }}>Roster</button>
          <button type="button" disabled={busy} style={seg(isAcademy)}
            onClick={() => { if (!isAcademy) wrap(() => setRosterType(player.id, 'futures'), `${player.first_name} moved to Academy`); }}>Academy</button>
        </div>

        <button type="button" disabled={busy} onClick={() => wrap(() => removePlayer(player.id, 'inactivate'), `${player.first_name} removed from roster`)}
          className="as-press flex items-center" style={ROW_WARN}>
          <UserMinus size={18} strokeWidth={1.75} aria-hidden="true" /> Remove from roster
        </button>
        <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)', margin: '4px 2px 16px' }}>Keeps history; the player leaves the active roster.</div>

        {!confirmDelete ? (
          <button type="button" disabled={busy} onClick={() => setConfirmDelete(true)} className="as-press flex items-center" style={ROW_DANGER}>
            <Trash2 size={18} strokeWidth={1.75} aria-hidden="true" /> Delete permanently
          </button>
        ) : (
          <div style={{ border: '1px solid var(--as-danger)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--as-text-primary)', marginBottom: 4 }}>Delete {name}?</div>
            <div style={{ fontSize: 13, color: 'var(--as-text-secondary)', marginBottom: 12 }}>This removes the player from the team entirely. Blocked if they have payment or registration history — use Remove instead.</div>
            <div className="flex items-center gap-2">
              <button type="button" disabled={busy} onClick={() => setConfirmDelete(false)} style={BTN_GHOST}>Cancel</button>
              <button type="button" disabled={busy} onClick={() => wrap(() => removePlayer(player.id, 'hard'), `${name} deleted`)} style={BTN_DANGER}>Delete</button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

const LBL = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--as-text-tertiary)' };
const BTN_PRIMARY = { minHeight: 44, padding: '0 18px', borderRadius: 10, backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 15, fontWeight: 600, border: 'none' };
const BTN_GHOST = { flex: 1, minHeight: 44, borderRadius: 10, backgroundColor: 'var(--as-bg-secondary)', color: 'var(--as-text-secondary)', fontSize: 15, fontWeight: 600, border: 'none' };
const BTN_DANGER = { flex: 1, minHeight: 44, borderRadius: 10, backgroundColor: 'var(--as-danger)', color: 'var(--as-text-inverse)', fontSize: 15, fontWeight: 600, border: 'none' };
const ROW_WARN = { width: '100%', minHeight: 48, gap: 10, padding: '0 12px', borderRadius: 10, backgroundColor: 'var(--as-warning-soft)', color: 'var(--as-warning)', fontSize: 15, fontWeight: 600, border: 'none', justifyContent: 'flex-start' };
const ROW_DANGER = { width: '100%', minHeight: 48, gap: 10, padding: '0 12px', borderRadius: 10, backgroundColor: 'var(--as-danger-soft)', color: 'var(--as-danger)', fontSize: 15, fontWeight: 600, border: 'none', justifyContent: 'flex-start' };
const seg = (active) => ({ flex: 1, minHeight: 40, borderRadius: 8, fontSize: 14, fontWeight: 600, border: '1px solid var(--as-border-default)', backgroundColor: active ? 'var(--as-accent)' : 'var(--as-bg-card)', color: active ? 'var(--as-text-inverse)' : 'var(--as-text-secondary)' });
