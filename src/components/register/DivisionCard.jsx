import { formatCurrency } from '../../lib/formatters';

// Division row on the public registration entry. Pill state is program-level for v1
// (Q-2 locked: OPEN/CLOSED by reg window only — no per-division capacity/waitlist).
// Interactive only when the program is open AND an onSelect is provided (PR C wires
// the wizard navigation; PR B renders read-only).
const PILL = {
  open:     { label: 'OPEN',   bg: 'var(--as-success-soft)', fg: 'var(--as-success)' },
  upcoming: { label: null,     bg: 'var(--as-info-soft)',    fg: 'var(--as-info)' },
  closed:   { label: 'CLOSED', bg: 'var(--as-neutral-soft)', fg: 'var(--as-text-tertiary)' },
};

function gradeLabel(min, max) {
  if (min == null && max == null) return null;
  if (min != null && max != null) return min === max ? `Grade ${min}` : `Grades ${min}–${max}`;
  return `Grade ${min ?? max}`;
}

export default function DivisionCard({ division, regState, opensLabel, onSelect }) {
  const pill = PILL[regState] || PILL.closed;
  const pillLabel = regState === 'upcoming' ? `OPENS ${opensLabel}` : pill.label;
  const grades = gradeLabel(division.grade_min, division.grade_max);
  const interactive = regState === 'open' && typeof onSelect === 'function';
  // "from $X" when add-on fees exist — the base alone understates the total the
  // review/confirm shows (#63-money entry-card honesty).
  const hasAddOn = (division.fees || []).some((f) => f.fee_type === 'add_on');
  const priceLabel = `${hasAddOn ? 'from ' : ''}${formatCurrency(division.base_fee_cents)}`;

  return (
    <button
      type="button"
      onClick={interactive ? () => onSelect(division) : undefined}
      disabled={!interactive}
      className={interactive ? 'as-press' : undefined}
      aria-label={`${division.name}${pillLabel ? ` — ${pillLabel}` : ''}`}
      style={{
        display: 'flex', alignItems: 'stretch', width: '100%', textAlign: 'left',
        backgroundColor: 'var(--as-bg-card)', borderRadius: 10,
        border: '1px solid var(--as-border-default)', boxShadow: 'var(--as-shadow-sm)',
        overflow: 'hidden', marginBottom: 8, padding: 0,
        cursor: interactive ? 'pointer' : 'default', opacity: 1,
      }}
    >
      <div style={{ width: 4, flexShrink: 0, backgroundColor: division.team_color || 'var(--as-accent)' }} />
      <div style={{ flex: 1, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--as-text-primary)' }}>{division.name}</span>
          {pillLabel && (
            <span style={{
              fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6,
              backgroundColor: pill.bg, color: pill.fg, whiteSpace: 'nowrap',
            }}>{pillLabel}</span>
          )}
        </div>
        <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)', marginTop: 2 }}>
          {[grades, priceLabel].filter(Boolean).join(' · ')}
        </div>
      </div>
    </button>
  );
}
