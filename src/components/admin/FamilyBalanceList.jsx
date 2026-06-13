import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import Label from '../shared/Label';
import CollapsibleSection from '../shared/CollapsibleSection';
import FamilyBalanceRow from './FamilyBalanceRow';

// Financials → Families. Grouped by TEAM (derived from the roster via
// useFamilyTeams — financial_accounts carry no team_id; billing is per family
// per season). A family with kids on >1 team appears under each; families with
// no rostered team fall to "Unassigned". Each team group header shows its
// count + owing total; groups with any owing open by default. Search overrides
// the grouping with a flat filtered list. `balances`/`byAccount` are the
// canonical per-account maps from useSeasonFinancials (anti-pattern #42).
export default function FamilyBalanceList({ accounts, balances, byAccount, fmt, onRecordPayment, onNudge, teamsByGuardian, teams }) {
  const [search, setSearch] = useState('');

  const families = useMemo(() => accounts.map((a) => {
    const view = byAccount?.[a.id];
    const balance = view?.balance ?? balances?.[a.id] ?? 0;
    const name = a.guardians ? `${a.guardians.first_name} ${a.guardians.last_name}` : 'Unknown';
    return { ...a, name, balance, billed: view?.billed ?? 0, netPaid: view?.netPaid ?? 0 };
  }), [accounts, balances, byAccount]);

  const q = search.trim().toLowerCase();
  const searchResults = useMemo(() => (q ? families.filter((f) => f.name.toLowerCase().includes(q)) : null), [families, q]);

  const groups = useMemo(() => {
    const byTeam = {};
    const unassigned = [];
    families.forEach((f) => {
      const tids = teamsByGuardian?.[f.guardian_id] || [];
      if (tids.length === 0) unassigned.push(f);
      else tids.forEach((tid) => { (byTeam[tid] ||= []).push(f); });
    });
    const sortRows = (rows) => [...rows].sort((a, b) => b.balance - a.balance);
    const out = (teams || []).filter((t) => byTeam[t.id]?.length).map((t) => ({ key: t.id, name: t.name, rows: sortRows(byTeam[t.id]) }));
    if (unassigned.length) out.push({ key: 'unassigned', name: 'Unassigned', rows: sortRows(unassigned) });
    return out;
  }, [families, teamsByGuardian, teams]);

  const card = (rows) => (
    <div style={CARD}>
      {rows.length === 0
        ? <div style={EMPTY}>{accounts.length === 0 ? 'No accounts for this season yet.' : 'No families here.'}</div>
        : rows.map((f, i) => <FamilyBalanceRow key={f.id} family={f} topBorder={i > 0} fmt={fmt} onRecordPayment={onRecordPayment} onNudge={onNudge} />)}
    </div>
  );

  const summary = (rows) => {
    const total = rows.reduce((s, f) => s + (f.balance > 0 ? f.balance : 0), 0);
    return total > 0 ? `${rows.length} · ${fmt(total)} owing` : `${rows.length} · all paid`;
  };

  return (
    <>
      <Label>Families</Label>
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <Search size={16} strokeWidth={1.75} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--as-text-tertiary)', pointerEvents: 'none' }} />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search families..." aria-label="Search families"
          style={{ width: '100%', height: 44, paddingLeft: 36, paddingRight: 12, backgroundColor: 'var(--as-bg-tertiary)', border: '1.5px solid var(--as-border-default)', borderRadius: 10, fontSize: 15, color: 'var(--as-text-primary)', outline: 'none', boxSizing: 'border-box' }} />
      </div>
      {searchResults ? card(searchResults) : groups.length === 0 ? card([]) : groups.map((g) => (
        <CollapsibleSection key={g.key} title={g.name} sectionKey={`fam-${g.key}`} defaultOpen={g.rows.some((f) => f.balance > 0)} count={summary(g.rows)}>
          {card(g.rows)}
        </CollapsibleSection>
      ))}
    </>
  );
}

const CARD = { backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)', overflow: 'hidden' };
const EMPTY = { padding: 16, textAlign: 'center', color: 'var(--as-text-tertiary)', fontSize: 13 };
