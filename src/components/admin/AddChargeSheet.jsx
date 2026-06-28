import { useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import BottomSheet from '../shared/BottomSheet';
import Label from '../shared/Label';

// Add a charge to a family's invoice — a 'fee' ledger transaction (billed comes
// from fee transactions; season_fee_cents is legacy/unused). Append-only; remove
// a wrong charge by voiding it. Single amount + reason → BottomSheet (AP#15).
const field = { width: '100%', minHeight: 44, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-tertiary)', color: 'var(--as-text-primary)', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' };

export default function AddChargeSheet({ accountId, orgId, onClose, onSaved }) {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const savingRef = useRef(false);
  const cents = Math.max(0, Math.round(parseFloat(amount) * 100) || 0);

  const handleSave = async () => {
    if (savingRef.current || cents <= 0) return;
    savingRef.current = true; setSaving(true); setErr(null);
    const { error } = await supabase.from('financial_transactions').insert({
      account_id: accountId, org_id: orgId, transaction_type: 'fee', amount_cents: cents,
      reference: reason || null, occurred_at: new Date().toISOString(), recorded_by: user.id,
    });
    if (error) { savingRef.current = false; setSaving(false); setErr('Looks like that didn’t go through. Try again?'); return; }
    onSaved();
  };

  return (
    <BottomSheet open onClose={onClose} initialHeight="55%">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--as-text-primary)' }}>Add charge</div>
        <div>
          <Label>Amount ($)</Label>
          <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" aria-label="Charge amount" style={field} />
        </div>
        <div>
          <Label>Reason (optional)</Label>
          <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Late registration, uniform" aria-label="Reason" style={field} />
        </div>
        {err && <div style={{ fontSize: 13, color: 'var(--as-danger)' }}>{err}</div>}
        <button type="button" onClick={handleSave} disabled={saving || cents <= 0} className="as-press"
          style={{ minHeight: 48, borderRadius: 10, border: 'none', backgroundColor: cents > 0 ? 'var(--as-accent)' : 'var(--as-bg-tertiary)', color: cents > 0 ? 'var(--as-text-inverse)' : 'var(--as-text-tertiary)', fontSize: 16, fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Add charge'}
        </button>
      </div>
    </BottomSheet>
  );
}
