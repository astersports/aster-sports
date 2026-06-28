import { ChevronRight } from 'lucide-react';
import Badge from '../shared/Badge';

const CIRCUIT_LABELS = { aau: 'AAU', league_play: 'League Play', tournament: 'Tournament' };
const DAY_LABELS = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

// One team card-row for AdminTeamsPage. Density-aware (CLAUDE.md §16.2):
// `maximum` shows the practice/circuit meta line; `minimal` keeps the
// row to name + badges. team_color is the ONLY allowed inline hex
// (read from DB, §0 rule 4). 44px tap target; full aria-label so the
// whole card reads as one actionable element to screen readers.
export default function TeamRow({ team: p, density = 'maximum', onEdit }) {
  const compact = density === 'minimal';
  const meta = [
    p.practice_day ? DAY_LABELS[p.practice_day] : 'No practice day set',
    p.practice_location || null,
    p.circuit === 'aau' && p.circuit_name ? p.circuit_name : null,
  ].filter(Boolean).join(' · ');

  return (
    <button
      type="button"
      onClick={() => onEdit(p)}
      aria-label={`Edit ${p.name}, ${p.age_group}, ${CIRCUIT_LABELS[p.circuit] || p.circuit}`}
      className="w-full text-left as-press"
      style={{
        minHeight: 44,
        padding: compact ? 12 : 16,
        backgroundColor: 'var(--as-bg-card)',
        borderRadius: 10,
        border: '1px solid var(--as-border-subtle)',
        borderLeft: `4px solid ${p.team_color || 'var(--as-border-default)'}`,
        boxShadow: 'var(--as-shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: compact ? 0 : 4, gap: 8 }}>
          <span className="font-semibold" style={{ color: 'var(--as-text-primary)', fontSize: 17, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.name}
          </span>
          <div className="flex gap-1" style={{ flexShrink: 0 }}>
            <Badge>{p.age_group}</Badge>
            <Badge variant="info">{CIRCUIT_LABELS[p.circuit] || p.circuit}</Badge>
          </div>
        </div>
        {!compact && (
          <div style={{ color: 'var(--as-text-secondary)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {meta}
          </div>
        )}
      </div>
      <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" style={{ color: 'var(--as-text-tertiary)', flexShrink: 0 }} />
    </button>
  );
}
