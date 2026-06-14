import { useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/formatters';
import BottomSheet from '../shared/BottomSheet';
import Label from '../shared/Label';

// Edit or delete a recorded coach payout (coach_payouts, ALL RLS). A payout that
// SETTLED sessions (source_assignments populated) is amount/status-locked: its
// amount is derived from the linked sessions and its status must stay 'paid', or
// it desyncs from event_coach_assignments. Deleting it un-settles those sessions
// (back to 'owed') — error-checked + confirmed first so a half-failed un-settle
// can't strand them.
const METHODS = [
  { value: 'zelle', label: 'Zelle' }, { value: 'venmo', label: 'Venmo' }, { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' }, { value: 'stripe', label: 'Card/Stripe' }, { value: 'other', label: 'Other' },
];
const field = { width: '100%', minHeight: 44, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-tertiary)', color: 'var(--as-text-primary)', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' };

export default function CoachPayoutEditSheet({ payout, onClose, onSaved }) {
  const nSessions = payout.source_assignments?.length || 0;
  const settled = nSessions > 0;
  const [amount, setAmount] = useState(payout.amount_cents ? String(payout.amount_cents / 100) : '');
  const [status, setStatus] = useState(payout.status || 'paid');
  const [method, setMethod] = useState(payout.payment_method || 'venmo');
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [err, setErr] = useState(null);
  const savingRef = useRef(false);
  const cents = Math.max(0, Math.round(parseFloat(amount) * 100) || 0);

  const handleSave = async () => {
    if (savingRef.current || (!settled && cents <= 0)) return;
    savingRef.current = true; setSaving(true); setErr(null);
    // Settled payouts: amount + status are derived/locked; only method/paid_at move.
    const patch = settled
      ? { payment_method: method }
      : { amount_cents: cents, status, payment_method: method, paid_at: status === 'paid' ? (payout.paid_at || new Date().toISOString()) : null };
    const { error } = await supabase.from('coach_payouts').update(patch).eq('id', payout.id);
    if (error) { savingRef.current = false; setSaving(false); setErr('Looks like that didn’t go through. Try again?'); return; }
    onSaved();
  };

  const handleDelete = async () => {
    if (savingRef.current) return;
    if (settled && !confirmDel) { setConfirmDel(true); return; }
    savingRef.current = true; setSaving(true); setErr(null);
    // Un-settle first; ABORT the delete if it fails so sessions can't be stranded
    // paid against a deleted payout.
    if (settled) {
      const { error: unsettleErr } = await supabase.from('event_coach_assignments')
        .update({ pay_status: 'owed', settled_by_payout_id: null }).eq('settled_by_payout_id', payout.id);
      if (unsettleErr) { savingRef.current = false; setSaving(false); setErr('Couldn’t move the sessions back to owed. Nothing was deleted — try again.'); return; }
    }
    const { error } = await supabase.from('coach_payouts').delete().eq('id', payout.id);
    if (error) { savingRef.current = false; setSaving(false); setErr('Looks like that didn’t go through. Try again?'); return; }
    onSaved();
  };

  return (
    <BottomSheet open onClose={onClose} initialHeight="70%">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--as-text-primary)' }}>Edit payout</div>
        {settled && (
          <div style={{ fontSize: 12.5, color: 'var(--as-text-secondary)', backgroundColor: 'var(--as-bg-secondary)', borderRadius: 9, padding: '11px 12px' }}>
            Settles {nSessions} session{nSessions === 1 ? '' : 's'} ({formatCurrency(payout.amount_cents)}). Amount and status are locked to those sessions — only the method is editable. Delete to move them back to owed.
          </div>
        )}
        <div><Label>Amount ($)</Label><input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Amount" style={{ ...field, opacity: settled ? 0.6 : 1 }} disabled={settled} /></div>
        <div><Label>Status</Label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status" style={{ ...field, opacity: settled ? 0.6 : 1 }} disabled={settled}>
            <option value="paid">Paid</option><option value="pending">Pending</option><option value="disputed">Disputed</option>
          </select>
        </div>
        <div><Label>Method</Label>
          <select value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Method" style={field}>
            {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        {err && <div style={{ fontSize: 13, color: 'var(--as-danger)' }}>{err}</div>}
        <button type="button" onClick={handleSave} disabled={saving || (!settled && cents <= 0)} className="as-press"
          style={{ minHeight: 48, borderRadius: 10, border: 'none', backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 16, fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={handleDelete} disabled={saving} className="as-press"
          style={{ minHeight: 44, borderRadius: 10, border: '1px solid var(--as-danger)', background: 'none', color: 'var(--as-danger)', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          {confirmDel ? `Confirm — un-settle ${nSessions} session${nSessions === 1 ? '' : 's'} & delete` : 'Delete payout'}
        </button>
      </div>
    </BottomSheet>
  );
}
