import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import FullScreenForm from '../shared/FullScreenForm';
import Label from '../shared/Label';

// Manual coach-payout log (the "record payout" half of coach comp). Writes one
// coach_payouts row; onSaved refetches so the card's paid/balance reflect it.
const METHODS = [
  { value: 'zelle', label: 'Zelle' }, { value: 'venmo', label: 'Venmo' }, { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' }, { value: 'stripe', label: 'Card/Stripe' }, { value: 'other', label: 'Other' },
];
const fieldStyle = { width: '100%', minHeight: 44, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-tertiary)', color: 'var(--as-text-primary)', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' };

export default function RecordCoachPayoutForm({ coach, orgId, seasonId, onClose, onSaved }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState(coach.defaultMethod || 'venmo');
  const [status, setStatus] = useState('paid');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const cents = Math.max(0, Math.round(parseFloat(amount) * 100) || 0);

  const handleSave = async () => {
    if (cents <= 0) return;
    setSaving(true); setErr(null);
    const { error } = await supabase.from('coach_payouts').insert({
      org_id: orgId, coach_user_id: coach.userId, season_id: seasonId,
      amount_cents: cents, status, payment_method: method,
      paid_at: status === 'paid' ? new Date(`${date}T12:00:00`).toISOString() : null,
    });
    setSaving(false);
    if (error) { setErr('Looks like that didn’t go through. Try again?'); return; }
    onSaved();
  };

  return (
    <FullScreenForm open title={`Pay ${coach.name}`} onClose={onClose}
      footer={(
        <button type="button" onClick={handleSave} disabled={saving || cents <= 0} className="as-press"
          style={{ minHeight: 44, padding: '0 20px', borderRadius: 10, border: 'none', backgroundColor: cents > 0 ? 'var(--as-accent)' : 'var(--as-bg-tertiary)', color: cents > 0 ? 'var(--as-text-inverse)' : 'var(--as-text-tertiary)', fontSize: 15, fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Record payout'}
        </button>
      )}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <Label>Amount</Label>
          <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" aria-label="Amount" style={fieldStyle} />
        </div>
        <div>
          <Label>Status</Label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status" style={fieldStyle}>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div>
          <Label>Method</Label>
          <select value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Payment method" style={fieldStyle}>
            {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        {status === 'paid' && (
          <div>
            <Label>Date paid</Label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date paid" style={fieldStyle} />
          </div>
        )}
        {err && <div style={{ fontSize: 13, color: 'var(--as-danger)' }}>{err}</div>}
      </div>
    </FullScreenForm>
  );
}
