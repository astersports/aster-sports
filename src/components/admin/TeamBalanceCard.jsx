import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import FamilyBalanceRow from './FamilyBalanceRow';

// Per-team summary card for Financials → Families (mirrors CoachPayoutCard).
// Header: team (color dot + name) · "N families · M players" · Outstanding
// headline (or "All paid") + collected. Expand: a Billed/Collected/Outstanding
// stat row + the family rows (owing-first). NOTE: billing is per family per
// season (no team split), so a multi-team family counts in each of its teams —
// team subtotals can sum slightly above the season total. Labeled, not a bug.
export default function TeamBalanceCard({ team, families, playerCount, fmt, onOpen, onNudge }) {
  const [open, setOpen] = useState(false);
  const billed = families.reduce((s, f) => s + f.billed, 0);
  const paid = families.reduce((s, f) => s + f.netPaid, 0);
  const outstanding = families.reduce((s, f) => s + (f.balance > 0 ? f.balance : 0), 0);
  const owingCount = families.filter((f) => f.balance > 0).length;

  return (
    <div style={{ backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)', overflow: 'hidden', marginBottom: 8 }}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="as-press"
        style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', minHeight: 44, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ width: 8, height: 32, borderRadius: 4, flexShrink: 0, backgroundColor: team.team_color || 'var(--as-border-default)' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--as-text-primary)' }}>{team.name}</div>
          <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)' }}>
            {families.length} famil{families.length === 1 ? 'y' : 'ies'}{playerCount != null ? ` · ${playerCount} player${playerCount === 1 ? '' : 's'}` : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {outstanding > 0 ? (
            <>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--as-danger)' }}>{fmt(outstanding)}</div>
              <div style={{ fontSize: 11, color: 'var(--as-text-tertiary)' }}>{owingCount} owing · {fmt(paid)} collected</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--as-success)' }}>All paid</div>
              <div style={{ fontSize: 11, color: 'var(--as-text-tertiary)' }}>{fmt(paid)} collected</div>
            </>
          )}
        </div>
        <ChevronDown size={18} strokeWidth={1.75} color="var(--as-text-tertiary)" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 200ms ease-out' }} />
      </button>
      {open && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderTop: '1px solid var(--as-border-subtle)', fontSize: 12, color: 'var(--as-text-secondary)' }}>
            <span>Billed {fmt(billed)}</span>
            <span>Collected {fmt(paid)}</span>
            <span>Outstanding {fmt(outstanding)}</span>
          </div>
          {[...families].sort((a, b) => b.balance - a.balance).map((f) => (
            <div key={f.id} style={{ borderTop: '1px solid var(--as-border-subtle)' }}>
              <FamilyBalanceRow family={f} fmt={fmt} onOpen={onOpen} onNudge={onNudge} topBorder={false} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}
