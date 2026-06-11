import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import Label from '../shared/Label';

// Per anti-pattern #42: `balances` is the per-account balance map from
// useSeasonFinancials — the canonical source. This component used to
// recompute balance inline (anti-pattern #42 violation, PR #306 catch).
// F-2 (money-seam): the per-family meta line reads billed/net_paid from
// `byAccount` (the family_balances view, via the hook), NOT the raw
// season_fee_cents/discount_cents columns — STEP 2 zeroes those, which
// would otherwise flip every family's line to "$0" the instant it lands.
export default function FamilyBalanceList({ accounts, balances, byAccount, fmt, onRecordPayment, onNudge, initialOwing = false }) {
  const [search, setSearch] = useState('');
  // ROSTER-2: an "Owing only" filter so an admin arriving from the
  // payment_overdue alert can find the owing family without a name.
  const [owingOnly, setOwingOnly] = useState(initialOwing);

  const families = useMemo(() => {
    return accounts.map((a) => {
      const view = byAccount?.[a.id];
      const balance = view?.balance ?? balances?.[a.id] ?? 0;
      const name = a.guardians ? `${a.guardians.first_name} ${a.guardians.last_name}` : 'Unknown';
      return { ...a, name, balance, billed: view?.billed ?? 0, netPaid: view?.netPaid ?? 0 };
    });
  }, [accounts, balances, byAccount]);

  const filtered = useMemo(() => {
    let list = owingOnly ? families.filter((f) => f.balance > 0) : families;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q));
    }
    return list;
  }, [families, search, owingOnly]);
  const owingCount = useMemo(() => families.filter((f) => f.balance > 0).length, [families]);

  return (
    <>
      <Label>Families</Label>
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <Search size={16} strokeWidth={1.75} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--as-text-tertiary)', pointerEvents: 'none' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search families..."
          aria-label="Search families"
          style={{
            width: '100%', height: 44, paddingLeft: 36, paddingRight: 12,
            backgroundColor: 'var(--as-bg-tertiary)', border: '1.5px solid var(--as-border-default)',
            borderRadius: 10, fontSize: 15, color: 'var(--as-text-primary)',
            outline: 'none', boxSizing: 'border-box',
          }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--as-accent)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--as-border-default)'; }}
        />
      </div>
      {owingCount > 0 && (
        <button type="button" onClick={() => setOwingOnly((v) => !v)} className="as-press" aria-pressed={owingOnly}
          style={{
            minHeight: 36, padding: '0 12px', marginBottom: 8, borderRadius: 9999, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            border: owingOnly ? 'none' : '1px solid var(--as-border-default)',
            backgroundColor: owingOnly ? 'var(--as-danger)' : 'var(--as-bg-card)',
            color: owingOnly ? 'var(--as-text-inverse)' : 'var(--as-text-secondary)',
          }}>
          Owing only · {owingCount}
        </button>
      )}
      <div style={{ backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)', overflow: 'hidden' }}>
        {filtered.length === 0 && (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--as-text-tertiary)', fontSize: 13 }}>
            {accounts.length === 0 ? 'No accounts for this season yet.' : 'No families match your search.'}
          </div>
        )}
        {filtered.map((f, i) => (
          <button key={f.id} type="button" onClick={() => f.balance > 0 && onRecordPayment(f)} className="as-press" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', minHeight: 44, width: '100%', background: 'none',
            border: 'none', borderTopStyle: i ? 'solid' : 'none', borderTopWidth: i ? 1 : 0,
            borderTopColor: 'var(--as-border-subtle)', textAlign: 'left',
            cursor: f.balance > 0 ? 'pointer' : 'default',
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--as-text-primary)' }}>{f.name}</div>
              <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)' }}>
                Billed: {fmt(f.billed)} · Paid: {fmt(f.netPaid)}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {f.balance > 0 && onNudge && (
                <button type="button" onClick={(e) => { e.stopPropagation(); onNudge(f); }} className="as-press"
                  style={{ minHeight: 32, padding: '0 10px', borderRadius: 8, border: '1px solid var(--as-accent)', backgroundColor: 'transparent', color: 'var(--as-accent)', fontSize: 11, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>
                  Message
                </button>
              )}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: f.balance > 0 ? 'var(--as-danger)' : 'var(--as-success)' }}>
                  {f.balance > 0 ? fmt(f.balance) : 'Paid'}
                </div>
                {f.balance > 0 && <div style={{ fontSize: 11, color: 'var(--as-text-tertiary)' }}>Tap to record</div>}
              </div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
