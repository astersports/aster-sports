import { useState } from 'react';
import FullScreenForm from '../shared/FullScreenForm';
import { useToast } from '../../context/useToast';
import { COACH_ROLES, COACH_SCOPES, toCompRole } from '../../lib/roster/coachComp';
import { useStaffCandidates } from '../../hooks/useStaffCandidates';

// Teams PR-2 Part B — assign a coach (coach=null: pick from staff) OR edit an
// existing coach's comp (coach set: fixed + prefilled). Both write
// assign_team_coach (upsert); effective_start defaults to today in the RPC.
// 3+ controls → FullScreenForm (AP #15). StaffSection passes a remount `key`
// per open/target, so useState initializes fresh from `coach` each open (no
// prop-sync effect — react-hooks/set-state-in-effect).
export default function CoachCompForm({ open, onClose, orgId, coach, existingUserIds, assignCoach, onDone }) {
  const { showToast } = useToast();
  const editing = !!coach;
  const { candidates } = useStaffCandidates(orgId, existingUserIds, open && !editing);
  const [userId, setUserId] = useState(coach?.userId || '');
  const [role, setRole] = useState(toCompRole(coach?.comp?.role || coach?.role) || 'head_coach');
  const [paid, setPaid] = useState(coach ? !!coach.comp : true);
  const [rate, setRate] = useState(coach?.comp ? String(Math.round(coach.comp.rateCents / 100)) : '');
  const [scope, setScope] = useState(coach?.comp?.scope || 'all_events');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!userId) { showToast('Pick a coach first.', 'error'); return; }
    const rateCents = paid ? Math.round(Number(rate) * 100) : null;
    if (paid && (!rateCents || rateCents <= 0)) { showToast('Enter a rate per session.', 'error'); return; }
    setBusy(true);
    try {
      await assignCoach({ userId, role, paid, rateCents, scope });
      showToast(editing ? 'Comp updated' : 'Coach assigned', 'success');
      onDone?.(); onClose();
    } catch {
      showToast('Looks like that didn’t go through. Try again?', 'error');
    } finally { setBusy(false); }
  };

  return (
    <FullScreenForm
      open={open} onClose={onClose} title={editing ? `${coach.name} — comp` : 'Assign coach'}
      footer={<button type="button" disabled={busy} onClick={submit} className="as-press" style={{ minHeight: 44, padding: '0 20px', borderRadius: 10, backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 15, fontWeight: 600, border: 'none', opacity: busy ? 0.6 : 1 }}>{editing ? 'Save' : 'Assign coach'}</button>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {!editing && (
          <div>
            <span style={LABEL}>Coach</span>
            {candidates.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)' }}>All staff are already on this team.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {candidates.map((c) => (
                  <button key={c.userId} type="button" onClick={() => setUserId(c.userId)} className="as-press" style={pick(userId === c.userId)}>
                    {c.name}{c.title ? ` · ${c.title}` : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div>
          <label style={LABEL} htmlFor="cc-role">Role</label>
          <select id="cc-role" value={role} onChange={(e) => setRole(e.target.value)} style={FIELD}>
            {COACH_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <span style={LABEL}>Compensation</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPaid(true)} style={seg(paid)}>Paid</button>
            <button type="button" onClick={() => setPaid(false)} style={seg(!paid)}>Volunteer</button>
          </div>
        </div>
        {paid && (
          <>
            <div>
              <label style={LABEL} htmlFor="cc-rate">Rate ($/session)</label>
              <input id="cc-rate" value={rate} inputMode="numeric" placeholder="120"
                onChange={(e) => setRate(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))} style={FIELD} />
            </div>
            <div>
              <label style={LABEL} htmlFor="cc-scope">Applies to</label>
              <select id="cc-scope" value={scope} onChange={(e) => setScope(e.target.value)} style={FIELD}>
                {COACH_SCOPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </>
        )}
      </div>
    </FullScreenForm>
  );
}

const FIELD = { width: '100%', minHeight: 44, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-tertiary)', color: 'var(--as-text-primary)', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' };
const LABEL = { display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--as-text-tertiary)', marginBottom: 6 };
const seg = (on) => ({ flex: 1, minHeight: 44, borderRadius: 10, fontSize: 15, fontWeight: 600, border: '1px solid var(--as-border-default)', backgroundColor: on ? 'var(--as-accent)' : 'var(--as-bg-card)', color: on ? 'var(--as-text-inverse)' : 'var(--as-text-secondary)' });
const pick = (on) => ({ width: '100%', minHeight: 44, padding: '0 12px', textAlign: 'left', borderRadius: 10, fontSize: 15, fontWeight: 500, border: `1.5px solid ${on ? 'var(--as-accent)' : 'var(--as-border-default)'}`, backgroundColor: on ? 'var(--as-accent-soft)' : 'var(--as-bg-card)', color: on ? 'var(--as-accent)' : 'var(--as-text-primary)' });
