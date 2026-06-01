import { formatCurrency } from '../../lib/formatters';

// Division row on the public registration entry. Pill state is program-level for v1
// (Q-2 locked: OPEN/CLOSED by reg window only — no per-division capacity/waitlist).
// Interactive only when the program is open AND an onSelect is provided (PR C wires
// the wizard navigation; PR B renders read-only).
const PILL = {
  open:     { label: 'OPEN',   bg: 'var(--em-success-soft)', fg: 'var(--em-success)' },
  upcoming: { label: null,     bg: 'var(--em-info-soft)',    fg: 'var(--em-info)' },
  closed:   { label: 'CLOSED', bg: 'var(--em-neutral-soft)', fg: 'var(--em-text-tertiary)' },
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

  return (
    <button
      type="button"
      onClick={interactive ? () => onSelect(division) : undefined}
      disabled={!interactive}
      className={interactive ? 'em-press' : undefined}
      aria-label={`${division.name}${pillLabel ? ` — ${pillLabel}` : ''}`}
      style={{
        display: 'flex', alignItems: 'stretch', width: '100%', textAlign: 'left',
        backgroundColor: 'var(--em-bg-card)', borderRadius: 10,
        border: '1px solid var(--em-border-default)', boxShadow: 'var(--em-shadow-sm)',
        overflow: 'hidden', marginBottom: 8, padding: 0,
        cursor: interactive ? 'pointer' : 'default', opacity: 1,
      }}
    >
      <div style={{ width: 4, flexShrink: 0, backgroundColor: division.team_color || 'var(--em-accent)' }} />
      <div style={{ flex: 1, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--em-text-primary)' }}>{division.name}</span>
          {pillLabel && (
            <span style={{
              fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6,
              backgroundColor: pill.bg, color: pill.fg, whiteSpace: 'nowrap',
            }}>{pillLabel}</span>
          )}
        </div>
        <div style={{ fontSize: 13, color: 'var(--em-text-tertiary)', marginTop: 2 }}>
          {[grades, formatCurrency(division.base_fee_cents)].filter(Boolean).join(' · ')}
        </div>
      </div>
    </button>
  );
}
