import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import FullScreenForm from '../shared/FullScreenForm';
import Button from '../shared/Button';
import Label from '../shared/Label';

const METHODS = [
  { value: 'zelle', label: 'Zelle' },
  { value: 'venmo', label: 'Venmo' },
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'stripe', label: 'Card/Stripe' },
  { value: 'other', label: 'Other' },
];

const INPUT_STYLE = {
  width: '100%', minHeight: 44, padding: '0 12px', fontSize: 15,
  borderRadius: 10, border: '1.5px solid var(--as-border-default)',
  backgroundColor: 'var(--as-bg-tertiary)', color: 'var(--as-text-primary)',
  fontFamily: 'inherit',
};

export default function RecordPaymentForm({ account, onClose, onSaved }) {
  const { orgId, user } = useAuth();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('zelle');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);

  const name = account.guardians
    ? `${account.guardians.first_name} ${account.guardians.last_name}`
    : 'Unknown';

  const handleSave = async () => {
    const cents = Math.round(parseFloat(amount) * 100);
    if (!cents || cents <= 0) return;
    setSaving(true);
    const { error } = await supabase.from('financial_transactions').insert({
      account_id: account.id,
      org_id: orgId,
      transaction_type: 'payment',
      amount_cents: cents,
      payment_method: method,
      reference: reference || null,
      occurred_at: new Date().toISOString(),
      recorded_by: user.id,
    });
    setSaving(false);
    if (!error) onSaved();
  };

  return (
    <FullScreenForm
      open
      title={`Payment — ${name}`}
      onClose={onClose}
      footer={<Button onClick={handleSave} disabled={saving || !amount || parseFloat(amount) <= 0} fullWidth>{saving ? 'Saving…' : 'Record Payment'}</Button>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <Label htmlFor="pay-amount">Amount ($)</Label>
          <input id="pay-amount" type="number" inputMode="decimal" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} style={INPUT_STYLE} />
        </div>
        <div>
          <Label htmlFor="pay-method">Payment Method</Label>
          <select id="pay-method" value={method} onChange={(e) => setMethod(e.target.value)} style={INPUT_STYLE}>
            {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div>
          <Label htmlFor="pay-ref">Reference / Memo</Label>
          <input id="pay-ref" type="text" placeholder="Optional" value={reference} onChange={(e) => setReference(e.target.value)} style={INPUT_STYLE} />
        </div>
      </div>
    </FullScreenForm>
  );
}
