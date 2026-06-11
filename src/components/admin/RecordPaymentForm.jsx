import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import FullScreenForm from '../shared/FullScreenForm';
import Label from '../shared/Label';
import { formatCurrency } from '../../lib/formatters';
import { balanceAfter, MONEY_MODES, txnForMode } from '../../lib/recordMoney';

// F-4 "record money" (render f4-record-money-out): ONE form, three modes over the
// same fields, each writing ONE ledger transaction the family_balances view buckets.
// Refund increases what's owed (red); adjustment can credit (−balance) or charge
// (+balance) (blue). onSaved refetches the authoritative view (#63), so the recorded
// number is the server's, never a client estimate.
const METHODS = [
  { value: 'zelle', label: 'Zelle' }, { value: 'venmo', label: 'Venmo' }, { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' }, { value: 'stripe', label: 'Card/Stripe' }, { value: 'other', label: 'Other' },
];
const META = {
  payment: { label: 'Payment', verb: 'Record payment', color: 'var(--as-accent)' },
  refund: { label: 'Refund', verb: 'Record refund', color: 'var(--as-danger)' },
  adjustment: { label: 'Adjustment', verb: 'Record adjustment', color: 'var(--as-info)' },
};

export default function RecordPaymentForm({ account, onClose, onSaved }) {
  const { orgId, user } = useAuth();
  const [mode, setMode] = useState('payment');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('zelle');
  const [reason, setReason] = useState('');
  const [charge, setCharge] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const name = account.guardians ? `${account.guardians.first_name} ${account.guardians.last_name}` : 'Unknown';
  const balanceCents = account.balance ?? 0;
  const cents = Math.max(0, Math.round(parseFloat(amount) * 100) || 0);
  const after = balanceAfter(mode, balanceCents, cents, charge);
  const meta = META[mode];

  const handleSave = async () => {
    if (cents <= 0) return;
    setSaving(true); setErr(null);
    const { error } = await supabase.from('financial_transactions').insert({
      account_id: account.id, org_id: orgId, ...txnForMode(mode, cents, charge),
      payment_method: mode === 'payment' ? method : null,
      reference: mode === 'payment' ? (reason || null) : null,
      notes: mode === 'payment' ? null : (reason || null),
      occurred_at: new Date(`${date}T12:00:00`).toISOString(),
      recorded_by: user.id,
    });
    setSaving(false);
    if (error) { setErr('Looks like that didn’t go through. Try again?'); return; }
    onSaved();
  };

  return (
    <FullScreenForm open title="Record money" onClose={onClose}
      footer={(
        <button type="button" onClick={handleSave} disabled={saving || cents <= 0} className="as-press"
          style={{ ...saveBtn, backgroundColor: meta.color, opacity: cents <= 0 ? 0.5 : 1 }}>
          {saving ? 'Saving…' : `${meta.verb} · ${formatCurrency(cents)}`}
        </button>
      )}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={whoCard}>
          <div style={whoName}>{name}</div>
          <div style={whoBal}>{balanceCents > 0 ? `${formatCurrency(balanceCents)} outstanding` : 'Paid in full'}</div>
        </div>

        <div style={seg} role="group" aria-label="Transaction type">
          {MONEY_MODES.map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} aria-pressed={mode === m}
              className="as-press" style={segBtn(mode === m, META[m].color)}>{META[m].label}</button>
          ))}
        </div>

        <div>
          <Label htmlFor="rm-amount">Amount ($)</Label>
          <input id="rm-amount" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} style={inputStyle} />
          {mode === 'refund' && <div style={warnLine}>A refund increases what the family owes.</div>}
        </div>

        {mode === 'payment' ? (
          <div>
            <Label htmlFor="rm-method">Payment method</Label>
            <select id="rm-method" value={method} onChange={(e) => setMethod(e.target.value)} style={inputStyle}>
              {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        ) : (
          <div>
            <Label htmlFor="rm-reason">Reason</Label>
            <input id="rm-reason" type="text" placeholder="e.g. Tournament cancelled" value={reason} onChange={(e) => setReason(e.target.value)} style={inputStyle} />
          </div>
        )}

        {mode === 'adjustment' && (
          <div style={seg} role="group" aria-label="Adjustment direction">
            <button type="button" onClick={() => setCharge(false)} aria-pressed={!charge} aria-label="Credit — decreases the balance" className="as-press" style={segBtn(!charge, 'var(--as-info)')}>Credit · −balance</button>
            <button type="button" onClick={() => setCharge(true)} aria-pressed={charge} aria-label="Charge — increases the balance" className="as-press" style={segBtn(charge, 'var(--as-info)')}>Charge · +balance</button>
          </div>
        )}

        <div>
          <Label htmlFor="rm-date">Date</Label>
          <input id="rm-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
        </div>

        <div style={afterBox}>
          <span>Balance after</span>
          <b style={{ color: after > 0 ? 'var(--as-danger)' : 'var(--as-success)', fontVariantNumeric: 'tabular-nums' }}>
            {after > 0 ? `${formatCurrency(after)} due` : after < 0 ? `${formatCurrency(-after)} credit` : 'Paid in full'}
          </b>
        </div>
        {err && <div style={errStyle}>{err}</div>}
      </div>
    </FullScreenForm>
  );
}

const inputStyle = { width: '100%', minHeight: 44, padding: '0 12px', fontSize: 15, borderRadius: 10, border: '1.5px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-tertiary)', color: 'var(--as-text-primary)', fontFamily: 'inherit' };
const saveBtn = { width: '100%', minHeight: 48, borderRadius: 11, border: 'none', color: 'var(--as-text-inverse)', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' };
const whoCard = { backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 12, padding: '12px 14px' };
const whoName = { fontSize: 15, fontWeight: 700, color: 'var(--as-text-primary)' };
const whoBal = { fontSize: 12.5, color: 'var(--as-text-secondary)', marginTop: 3 };
const seg = { display: 'flex', gap: 6, backgroundColor: 'var(--as-bg-secondary)', borderRadius: 11, padding: 4 };
const segBtn = (on, color) => ({ flex: 1, minHeight: 42, borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', backgroundColor: on ? 'var(--as-bg-card)' : 'transparent', color: on ? color : 'var(--as-text-tertiary)', boxShadow: on ? 'var(--as-shadow-sm)' : 'none' });
const warnLine = { fontSize: 11.5, color: 'var(--as-warning)', marginTop: 6 };
const afterBox = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, backgroundColor: 'var(--as-bg-secondary)', fontSize: 13, color: 'var(--as-text-secondary)', fontWeight: 600 };
const errStyle = { fontSize: 13, color: 'var(--as-danger)', backgroundColor: 'var(--as-danger-soft)', borderRadius: 8, padding: '8px 10px' };
