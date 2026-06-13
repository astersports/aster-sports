import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import Label from '../shared/Label';
import CollapsibleSection from '../shared/CollapsibleSection';
import FamilyBalanceRow from './FamilyBalanceRow';

// Financials → Families. Accordion grouped by status (Owing open by default
// with its count + total; Paid collapsed) so a season's long flat list
// collapses into two scannable groups (2026-06-13 redesign). Search overrides
// the grouping with a flat filtered list. `balances`/`byAccount` are the
// canonical per-account maps from useSeasonFinancials (anti-pattern #42).
export default function FamilyBalanceList({ accounts, balances, byAccount, fmt, onRecordPayment, onNudge }) {
  const [search, setSearch] = useState('');

  const families = useMemo(() => accounts.map((a) => {
    const view = byAccount?.[a.id];
    const balance = view?.balance ?? balances?.[a.id] ?? 0;
    const name = a.guardians ? `${a.guardians.first_name} ${a.guardians.last_name}` : 'Unknown';
    return { ...a, name, balance, billed: view?.billed ?? 0, netPaid: view?.netPaid ?? 0 };
  }), [accounts, balances, byAccount]);

  const q = search.trim().toLowerCase();
  const searchResults = useMemo(() => (q ? families.filter((f) => f.name.toLowerCase().includes(q)) : null), [families, q]);
  const owing = useMemo(() => families.filter((f) => f.balance > 0).sort((a, b) => b.balance - a.balance), [families]);
  const paid = useMemo(() => families.filter((f) => f.balance <= 0), [families]);
  const owingTotal = useMemo(() => owing.reduce((s, f) => s + f.balance, 0), [owing]);

  const card = (rows) => (
    <div style={CARD}>
      {rows.length === 0
        ? <div style={EMPTY}>{accounts.length === 0 ? 'No accounts for this season yet.' : 'No families here.'}</div>
        : rows.map((f, i) => <FamilyBalanceRow key={f.id} family={f} topBorder={i > 0} fmt={fmt} onRecordPayment={onRecordPayment} onNudge={onNudge} />)}
    </div>
  );

  return (
    <>
      <Label>Families</Label>
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <Search size={16} strokeWidth={1.75} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--as-text-tertiary)', pointerEvents: 'none' }} />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search families..." aria-label="Search families"
          style={{ width: '100%', height: 44, paddingLeft: 36, paddingRight: 12, backgroundColor: 'var(--as-bg-tertiary)', border: '1.5px solid var(--as-border-default)', borderRadius: 10, fontSize: 15, color: 'var(--as-text-primary)', outline: 'none', boxSizing: 'border-box' }} />
      </div>
      {searchResults ? card(searchResults) : (
        <>
          <CollapsibleSection title="Owing" sectionKey="fam-owing" defaultOpen count={`${owing.length} · ${fmt(owingTotal)}`}>
            {card(owing)}
          </CollapsibleSection>
          <CollapsibleSection title="Paid" sectionKey="fam-paid" defaultOpen={false} count={`${paid.length}`}>
            {card(paid)}
          </CollapsibleSection>
        </>
      )}
    </>
  );
}

const CARD = { backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)', overflow: 'hidden' };
const EMPTY = { padding: 16, textAlign: 'center', color: 'var(--as-text-tertiary)', fontSize: 13 };
