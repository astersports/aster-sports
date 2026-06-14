import { useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/formatters';
import BottomSheet from '../shared/BottomSheet';
import Label from '../shared/Label';
import Toggle from '../shared/Toggle';

// Edit ONE coach session's pay (event_coach_assignments, Schema-2): the amount
// owed for this session + whether it counts toward pay (exclude). "Edit each of
// the sessions." 1-2 controls → BottomSheet (AP#15). A SETTLED (paid) session is
// read-only — its pay is locked to the payout that settled it; editing here would
// desync the session amount from coach_payouts.amount_cents (the page already
// blocks opening this sheet for paid sessions; this is the defense-in-depth guard).
const field = { width: '100%', minHeight: 44, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-tertiary)', color: 'var(--as-text-primary)', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' };

export default function CoachSessionSheet({ session, onClose, onSaved }) {
  const settled = session.pay_status === 'paid';
  const [amount, setAmount] = useState(session.pay_cents ? String(session.pay_cents / 100) : '');
  const [excluded, setExcluded] = useState(session.pay_status === 'excluded');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const savingRef = useRef(false);
  const cents = Math.max(0, Math.round(parseFloat(amount) * 100) || 0);

  const handleSave = async () => {
    if (settled || savingRef.current) return;
    savingRef.current = true; setSaving(true); setErr(null);
    const { error } = await supabase.from('event_coach_assignments')
      .update({ pay_cents: cents, pay_status: excluded ? 'excluded' : 'owed' })
      .eq('id', session.id);
    if (error) { savingRef.current = false; setSaving(false); setErr('Looks like that didn’t go through. Try again?'); return; }
    onSaved();
  };

  return (
    <BottomSheet open onClose={onClose} initialHeight="60%">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--as-text-primary)' }}>Session pay</div>
          <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)' }}>{session.teamName} · {session.title}</div>
        </div>
        {settled ? (
          <div style={{ fontSize: 13, color: 'var(--as-text-secondary)', backgroundColor: 'var(--as-bg-secondary)', borderRadius: 9, padding: '11px 12px' }}>
            Settled under a payout ({formatCurrency(session.pay_cents)}). To change it, edit or delete that payout.
          </div>
        ) : (
          <>
            <div>
              <Label>Pay for this session ($)</Label>
              <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" aria-label="Session pay" style={field} disabled={excluded} />
            </div>
            <Toggle label="Don’t pay for this session" checked={excluded} onChange={setExcluded} />
            {err && <div style={{ fontSize: 13, color: 'var(--as-danger)' }}>{err}</div>}
            <button type="button" onClick={handleSave} disabled={saving} className="as-press"
              style={{ minHeight: 48, borderRadius: 10, border: 'none', backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 16, fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
