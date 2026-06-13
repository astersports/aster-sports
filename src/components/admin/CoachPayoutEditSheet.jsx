import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import BottomSheet from '../shared/BottomSheet';
import Label from '../shared/Label';

// Edit or delete a recorded coach payout (coach_payouts, ALL RLS). Deleting
// also un-settles any sessions it had settled (back to 'owed').
const METHODS = [
  { value: 'zelle', label: 'Zelle' }, { value: 'venmo', label: 'Venmo' }, { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' }, { value: 'stripe', label: 'Card/Stripe' }, { value: 'other', label: 'Other' },
];
const field = { width: '100%', minHeight: 44, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-tertiary)', color: 'var(--as-text-primary)', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' };

export default function CoachPayoutEditSheet({ payout, onClose, onSaved }) {
  const [amount, setAmount] = useState(payout.amount_cents ? String(payout.amount_cents / 100) : '');
  const [status, setStatus] = useState(payout.status || 'paid');
  const [method, setMethod] = useState(payout.payment_method || 'venmo');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const cents = Math.max(0, Math.round(parseFloat(amount) * 100) || 0);

  const handleSave = async () => {
    if (cents <= 0) return;
    setSaving(true); setErr(null);
    const { error } = await supabase.from('coach_payouts')
      .update({ amount_cents: cents, status, payment_method: method, paid_at: status === 'paid' ? (payout.paid_at || new Date().toISOString()) : null })
      .eq('id', payout.id);
    setSaving(false);
    if (error) { setErr('Looks like that didn’t go through. Try again?'); return; }
    onSaved();
  };

  const handleDelete = async () => {
    setSaving(true); setErr(null);
    await supabase.from('event_coach_assignments').update({ pay_status: 'owed', settled_by_payout_id: null }).eq('settled_by_payout_id', payout.id);
    const { error } = await supabase.from('coach_payouts').delete().eq('id', payout.id);
    setSaving(false);
    if (error) { setErr('Looks like that didn’t go through. Try again?'); return; }
    onSaved();
  };

  return (
    <BottomSheet open onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--as-text-primary)' }}>Edit payout</div>
        <div><Label>Amount ($)</Label><input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Amount" style={field} /></div>
        <div><Label>Status</Label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status" style={field}>
            <option value="paid">Paid</option><option value="pending">Pending</option><option value="disputed">Disputed</option>
          </select>
        </div>
        <div><Label>Method</Label>
          <select value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Method" style={field}>
            {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        {err && <div style={{ fontSize: 13, color: 'var(--as-danger)' }}>{err}</div>}
        <button type="button" onClick={handleSave} disabled={saving || cents <= 0} className="as-press"
          style={{ minHeight: 48, borderRadius: 10, border: 'none', backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 16, fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={handleDelete} disabled={saving} className="as-press"
          style={{ minHeight: 44, borderRadius: 10, border: '1px solid var(--as-danger)', background: 'none', color: 'var(--as-danger)', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          Delete payout
        </button>
      </div>
    </BottomSheet>
  );
}
