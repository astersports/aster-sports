import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import Label from '../shared/Label';

export default function FamilyBalanceList({ accounts, transactions, fmt, onRecordPayment, onNudge }) {
  const [search, setSearch] = useState('');

  const families = useMemo(() => {
    return accounts.map((a) => {
      const paid = transactions
        .filter((t) => t.account_id === a.id && t.transaction_type === 'payment')
        .reduce((s, t) => s + t.amount_cents, 0);
      const balance = (a.season_fee_cents - a.discount_cents) - paid;
      const name = a.guardians ? `${a.guardians.first_name} ${a.guardians.last_name}` : 'Unknown';
      return { ...a, name, balance, paid };
    });
  }, [accounts, transactions]);

  const filtered = useMemo(() => {
    if (!search.trim()) return families;
    const q = search.trim().toLowerCase();
    return families.filter((f) => f.name.toLowerCase().includes(q));
  }, [families, search]);

  return (
    <>
      <Label>Families</Label>
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <Search size={16} strokeWidth={1.75} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--em-text-tertiary)', pointerEvents: 'none' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search families..."
          aria-label="Search families"
          style={{
            width: '100%', height: 44, paddingLeft: 36, paddingRight: 12,
            backgroundColor: 'var(--em-bg-tertiary)', border: '1.5px solid var(--em-border-default)',
            borderRadius: 10, fontSize: 15, color: 'var(--em-text-primary)',
            outline: 'none', boxSizing: 'border-box',
          }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--em-accent)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--em-border-default)'; }}
        />
      </div>
      <div style={{ backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', overflow: 'hidden' }}>
        {filtered.length === 0 && (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--em-text-tertiary)', fontSize: 13 }}>
            {accounts.length === 0 ? 'No accounts for this season yet.' : 'No families match your search.'}
          </div>
        )}
        {filtered.map((f, i) => (
          <button key={f.id} type="button" onClick={() => f.balance > 0 && onRecordPayment(f)} className="sf-press" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', minHeight: 44, width: '100%', background: 'none',
            border: 'none', borderTopStyle: i ? 'solid' : 'none', borderTopWidth: i ? 1 : 0,
            borderTopColor: 'var(--em-border-subtle)', textAlign: 'left',
            cursor: f.balance > 0 ? 'pointer' : 'default',
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--em-text-primary)' }}>{f.name}</div>
              <div style={{ fontSize: 12, color: 'var(--em-text-tertiary)' }}>
                Fee: {fmt(f.season_fee_cents)}{f.discount_cents > 0 ? ` · Discount: ${fmt(f.discount_cents)}` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {f.balance > 0 && onNudge && (
                <button type="button" onClick={(e) => { e.stopPropagation(); onNudge(f); }} className="sf-press"
                  style={{ minHeight: 32, padding: '0 10px', borderRadius: 8, border: '1px solid var(--em-accent)', backgroundColor: 'transparent', color: 'var(--em-accent)', fontSize: 11, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>
                  Message
                </button>
              )}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: f.balance > 0 ? 'var(--em-danger)' : 'var(--em-success)' }}>
                  {f.balance > 0 ? fmt(f.balance) : 'Paid'}
                </div>
                {f.balance > 0 && <div style={{ fontSize: 11, color: 'var(--em-text-tertiary)' }}>Tap to record</div>}
              </div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
