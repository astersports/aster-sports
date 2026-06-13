import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import BottomSheet from '../shared/BottomSheet';
import Label from '../shared/Label';
import Toggle from '../shared/Toggle';

// Edit ONE coach session's pay (event_coach_assignments, Schema-2): the amount
// owed for this session + whether it counts toward pay (exclude). "Edit each of
// the sessions." 1-2 controls → BottomSheet (AP#15).
const field = { width: '100%', minHeight: 44, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-tertiary)', color: 'var(--as-text-primary)', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' };

export default function CoachSessionSheet({ session, onClose, onSaved }) {
  const [amount, setAmount] = useState(session.pay_cents ? String(session.pay_cents / 100) : '');
  const [excluded, setExcluded] = useState(session.pay_status === 'excluded');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const cents = Math.max(0, Math.round(parseFloat(amount) * 100) || 0);

  const handleSave = async () => {
    setSaving(true); setErr(null);
    const { error } = await supabase.from('event_coach_assignments')
      .update({ pay_cents: cents, pay_status: excluded ? 'excluded' : (session.pay_status === 'paid' ? 'paid' : 'owed') })
      .eq('id', session.id);
    setSaving(false);
    if (error) { setErr('Looks like that didn’t go through. Try again?'); return; }
    onSaved();
  };

  return (
    <BottomSheet open onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--as-text-primary)' }}>Session pay</div>
          <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)' }}>{session.teamName} · {session.title}</div>
        </div>
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
      </div>
    </BottomSheet>
  );
}
