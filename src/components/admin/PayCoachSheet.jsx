import { useMemo, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { buildSettlements } from '../../lib/coachComp';
import { formatCurrency } from '../../lib/formatters';
import FullScreenForm from '../shared/FullScreenForm';
import Label from '../shared/Label';

// PayCoachSheet — settle a coach's OWED sessions via pay_coach() (PR-2, DR-F1).
// Pick sessions → one paid coach_payouts row per season; those sessions flip to
// paid + settled_by_payout_id atomically (the RPC is paid-only, Migration D). The
// amount is read-only (Σ selected). Pessimistic (money out) + a double-submit
// guard. 3+ controls → FullScreenForm (AP#15).
const METHODS = [
  { value: 'venmo', label: 'Venmo' }, { value: 'zelle', label: 'Zelle' }, { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' }, { value: 'stripe', label: 'Card/Stripe' }, { value: 'other', label: 'Other' },
];
const NY = 'America/New_York';
const dateLabel = (iso) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: NY }) : '—');
const field = { width: '100%', minHeight: 44, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-tertiary)', color: 'var(--as-text-primary)', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' };

export default function PayCoachSheet({ coach, orgId, onClose, onSaved }) {
  const owed = useMemo(() => (coach.sessions || []).filter((s) => s.pay_status === 'owed'), [coach.sessions]);
  const [sel, setSel] = useState(() => new Set(owed.map((s) => s.id)));
  const [method, setMethod] = useState(coach.defaultMethod || 'venmo');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [err, setErr] = useState(null);
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);

  const selected = owed.filter((s) => sel.has(s.id));
  const totalCents = selected.reduce((n, s) => n + (s.pay_cents || 0), 0);
  const allOn = owed.length > 0 && sel.size === owed.length;
  const toggle = (id) => setSel((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () => setSel(allOn ? new Set() : new Set(owed.map((s) => s.id)));

  const settle = async () => {
    if (savingRef.current || selected.length === 0) return;
    if (selected.some((s) => !s.seasonId)) { setErr('A session is missing its season. Refresh and try again.'); return; }
    savingRef.current = true; setSaving(true); setErr(null);
    const payloads = buildSettlements(selected, {
      orgId, coachId: coach.userId, method, paidAt: new Date(`${date}T12:00:00`).toISOString(),
    });
    try {
      for (const p of payloads) {
        const { error } = await supabase.rpc('pay_coach', p);
        if (error) throw error;
      }
      onSaved();
    } catch (e) {
      console.error('pay_coach:', e.message);
      setErr('Looks like that didn’t go through. Try again?');
      savingRef.current = false; setSaving(false);
    }
  };

  return (
    <FullScreenForm open title={`Pay ${coach.name}`} onClose={onClose}
      footer={(
        <button type="button" onClick={settle} disabled={saving || totalCents <= 0} className="as-press"
          style={{ minHeight: 44, padding: '0 20px', borderRadius: 10, border: 'none', backgroundColor: totalCents > 0 ? 'var(--as-success)' : 'var(--as-bg-tertiary)', color: totalCents > 0 ? 'var(--as-text-inverse)' : 'var(--as-text-tertiary)', fontSize: 15, fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Settling…' : `Pay ${formatCurrency(totalCents)}`}
        </button>
      )}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {owed.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--as-text-tertiary)', fontSize: 14 }}>Nothing owed — all sessions are settled.</div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Label>Owed sessions ({owed.length})</Label>
              <button type="button" onClick={toggleAll} className="as-press" style={{ minHeight: 32, background: 'none', border: 'none', color: 'var(--as-accent)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                {allOn ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <div style={{ backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)', overflow: 'hidden' }}>
              {owed.map((s, i) => {
                const on = sel.has(s.id);
                return (
                  <button type="button" key={s.id} onClick={() => toggle(s.id)} className="as-press" aria-pressed={on}
                    style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '10px 13px', minHeight: 44, borderTop: i ? '1px solid var(--as-border-subtle)' : 'none', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
                    <span style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: 'grid', placeItems: 'center', border: on ? 'none' : '1.5px solid var(--as-border-default)', backgroundColor: on ? 'var(--as-accent)' : 'transparent' }}>
                      {on && <Check size={13} strokeWidth={3} color="var(--as-text-inverse)" />}
                    </span>
                    <span style={{ width: 52, flexShrink: 0, fontSize: 13, fontWeight: 600, color: 'var(--as-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{dateLabel(s.startAt)}</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: 'var(--as-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.teamName}{s.title && s.title !== '—' ? ` · ${s.title}` : ''}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--as-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(s.pay_cents)}</span>
                  </button>
                );
              })}
            </div>
            <div>
              <Label>Method</Label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Payment method" style={field}>
                {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Date paid</Label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date paid" style={field} />
            </div>
          </>
        )}
        {err && <div style={{ fontSize: 13, color: 'var(--as-danger)' }}>{err}</div>}
      </div>
    </FullScreenForm>
  );
}
