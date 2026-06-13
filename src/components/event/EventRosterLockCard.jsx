import { useEffect, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import BottomSheet from '../shared/BottomSheet';
import { formatRelativeTime } from '../../lib/formatters';
import { rsvpBreakdown } from '../../lib/rsvpEligibility';

const VISIBLE_TYPES = new Set(['game', 'tournament']);
const HOLD_MS = 800;

function pickPlayerIdsForLock(rsvps, roster) {
  const eligible = new Set(
    (rsvps || [])
      .filter((r) => r.response === 'going' || r.response === 'maybe')
      .map((r) => r.player_id),
  );
  return (roster || []).filter((p) => eligible.has(p.id)).map((p) => p.id);
}

const cardStyle = {
  margin: '12px 16px', padding: 14, borderRadius: 10,
  backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)',
  boxShadow: 'var(--as-shadow-sm)',
};
const labelStyle = { fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--as-text-secondary)' };
const lockBtn = { width: '100%', minHeight: 44, borderRadius: 10, fontSize: 15, fontWeight: 600, border: '1px solid var(--as-accent)', backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', cursor: 'pointer' };
const unlockBtn = { ...lockBtn, backgroundColor: 'var(--as-bg-card)', color: 'var(--as-accent)' };

function HoldButton({ onConfirm }) {
  const [holding, setHolding] = useState(false);
  const timerRef = useRef(null);
  const start = () => { setHolding(true); timerRef.current = setTimeout(() => { setHolding(false); timerRef.current = null; onConfirm(); }, HOLD_MS); };
  const cancel = () => { setHolding(false); if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  return (
    <button type="button"
      onPointerDown={start} onPointerUp={cancel} onPointerLeave={cancel} onPointerCancel={cancel}
      style={{ ...lockBtn, backgroundColor: holding ? 'var(--as-warning)' : 'var(--as-accent)', borderColor: holding ? 'var(--as-warning)' : 'var(--as-accent)', transition: 'background-color 800ms linear, border-color 800ms linear' }}>
      {holding ? 'Hold…' : 'Hold to lock'}
    </button>
  );
}

export default function EventRosterLockCard({ event, isStaff, rsvps, roster, lock, onChange }) {
  const [showLockSheet, setShowLockSheet] = useState(false);
  const [showUnlockSheet, setShowUnlockSheet] = useState(false);
  const [unlockReason, setUnlockReason] = useState('');

  if (!event || !VISIBLE_TYPES.has(event.event_type)) return null;
  if (lock.loading) return null;

  const counts = rsvpBreakdown(rsvps, roster);
  const goingMaybe = counts.going + counts.maybe;
  const lockableNow = goingMaybe > 0;

  const onLock = async () => {
    const ids = pickPlayerIdsForLock(rsvps, roster);
    if (ids.length === 0) { setShowLockSheet(false); return; }
    const ok = await lock.lock(ids);
    if (ok) { setShowLockSheet(false); onChange?.(); }
  };
  const onUnlock = async () => {
    if (unlockReason.trim().length < 3) return;
    const ok = await lock.unlock(unlockReason.trim());
    if (ok) { setShowUnlockSheet(false); setUnlockReason(''); onChange?.(); }
  };

  if (lock.isLocked && !isStaff) {
    return (
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--as-text-secondary)' }}>
          <Lock size={14} strokeWidth={1.75} />
          Roster locked {formatRelativeTime(lock.lockedAt)}. RSVP changes after this need a coach.
        </div>
      </div>
    );
  }
  if (!isStaff) return null;

  return (
    <div style={cardStyle}>
      <div style={{ ...labelStyle, marginBottom: 8 }}>Roster Lock</div>
      {lock.isLocked ? (
        <>
          <div style={{ fontSize: 13, color: 'var(--as-text-primary)', marginBottom: 4 }}>
            Locked {formatRelativeTime(lock.lockedAt)} · {lock.lockedRosterPlayerIds.length} {lock.lockedRosterPlayerIds.length === 1 ? 'player' : 'players'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)', marginBottom: 12 }}>
            Parents can no longer change RSVP. Use Unlock to reopen.
          </div>
          <button type="button" onClick={() => setShowUnlockSheet(true)} className="as-press" style={unlockBtn}>Unlock</button>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--as-text-secondary)', marginBottom: 12, flexWrap: 'wrap' }}>
            <span><strong style={{ color: 'var(--as-text-primary)' }}>{counts.going}</strong> Going</span>
            <span><strong style={{ color: 'var(--as-text-primary)' }}>{counts.maybe}</strong> Maybe</span>
            <span><strong style={{ color: 'var(--as-text-primary)' }}>{counts.out}</strong> Out</span>
            <span><strong style={{ color: 'var(--as-text-primary)' }}>{counts.noReply}</strong> No reply</span>
          </div>
          <button type="button" onClick={() => setShowLockSheet(true)} disabled={!lockableNow} className="as-press"
            style={{ ...lockBtn, opacity: lockableNow ? 1 : 0.5, cursor: lockableNow ? 'pointer' : 'default' }}>
            Lock roster
          </button>
        </>
      )}

      <BottomSheet open={showLockSheet} onClose={() => setShowLockSheet(false)} initialHeight="40%" expandedHeight="50%">
        <div style={{ padding: '8px 0 16px 0' }}>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--as-text-primary)', marginBottom: 8 }}>Lock roster?</h3>
          <p style={{ fontSize: 14, color: 'var(--as-text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
            Locking captures the {goingMaybe} Going + Maybe {goingMaybe === 1 ? 'player' : 'players'} as the final roster. Parents can no longer change RSVP after this.
          </p>
          <HoldButton onConfirm={onLock} />
        </div>
      </BottomSheet>

      <BottomSheet open={showUnlockSheet} onClose={() => { setShowUnlockSheet(false); setUnlockReason(''); }} initialHeight="50%" expandedHeight="70%">
        <div style={{ padding: '8px 0 16px 0' }}>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--as-text-primary)', marginBottom: 8 }}>Unlock roster?</h3>
          <p style={{ fontSize: 13, color: 'var(--as-text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
            The locked roster snapshot is preserved. Reason must be at least 3 characters.
          </p>
          <input type="text" value={unlockReason} onChange={(e) => setUnlockReason(e.target.value)}
            placeholder="e.g. Coach added late callup" autoFocus
            style={{ width: '100%', minHeight: 44, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-tertiary)', color: 'var(--as-text-primary)', fontSize: 15, fontFamily: 'inherit', marginBottom: 12 }} />
          <button type="button" onClick={onUnlock} disabled={unlockReason.trim().length < 3} className="as-press"
            style={{ ...lockBtn, opacity: unlockReason.trim().length >= 3 ? 1 : 0.5 }}>
            Unlock
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
