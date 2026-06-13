// One family row in the Financials → Families list. Extracted from
// FamilyBalanceList for the accordion redesign (2026-06-13). Tapping an
// owing family opens the record-payment form; the Message button nudges.
export default function FamilyBalanceRow({ family, fmt, onRecordPayment, onNudge, topBorder }) {
  const owing = family.balance > 0;
  return (
    <button type="button" onClick={() => owing && onRecordPayment(family)} className="as-press" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 14px', minHeight: 44, width: '100%', background: 'none',
      border: 'none', borderTopStyle: topBorder ? 'solid' : 'none', borderTopWidth: topBorder ? 1 : 0,
      borderTopColor: 'var(--as-border-subtle)', textAlign: 'left',
      cursor: owing ? 'pointer' : 'default',
    }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--as-text-primary)' }}>{family.name}</div>
        <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)' }}>
          Billed: {fmt(family.billed)} · Paid: {fmt(family.netPaid)}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {owing && onNudge && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onNudge(family); }} className="as-press"
            style={{ minHeight: 32, padding: '0 10px', borderRadius: 8, border: '1px solid var(--as-accent)', backgroundColor: 'transparent', color: 'var(--as-accent)', fontSize: 11, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>
            Message
          </button>
        )}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: owing ? 'var(--as-danger)' : 'var(--as-success)' }}>
            {owing ? fmt(family.balance) : 'Paid'}
          </div>
          {owing && <div style={{ fontSize: 11, color: 'var(--as-text-tertiary)' }}>Tap to record</div>}
        </div>
      </div>
    </button>
  );
}
