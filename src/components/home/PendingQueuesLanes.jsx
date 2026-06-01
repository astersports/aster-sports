// §4.C Sprint D — Admin PENDING QUEUES per HOME_DESIGN_SPEC §3.1.4.
// Signal-agnostic lanes shell: each lane is { emoji, label, count,
// href, color }. Hides lane entirely when count=0; hides section
// entirely when all lanes are empty (presence-driven, same discipline
// as ActionZone).
//
// Distinct from ActionZone: ActionZone enumerates per-item rows;
// PendingQueuesLanes aggregates a count per signal with a Review CTA.
// Both shells are role-agnostic; this one is wired to admin home
// today, available to coach/parent surfaces later if a need surfaces.
//
// Density (PR #313): two states via useDensity hook —
//   - Compact (minimal): single-line summary "N queues need review"
//   - Detailed (maximum, DEFAULT): full lanes with emoji + Review CTA
// Mirrors the ActionZone density pattern from PR #308. Default
// override is 'maximum' (Detailed) — see PR #308 for the
// useDensity null-preferences honor-defaultDensity discipline.

import { Link } from 'react-router-dom';
import Label from '../shared/Label';
import DensityToggle from './DensityToggle';
import { useDensity } from '../../hooks/useDensity';

export default function PendingQueuesLanes({ lanes, loading, sectionKey = 'pending-queues' }) {
  const { density } = useDensity(sectionKey, 'maximum');
  if (loading) return null;
  const visible = (lanes || []).filter((l) => (l?.count || 0) > 0);
  if (!visible.length) return null;
  const isMinimal = density === 'minimal';
  const totalCount = visible.reduce((sum, l) => sum + (l.count || 0), 0);

  return (
    <section aria-label="Pending queues">
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <Label style={{ marginBottom: 0 }}>PENDING QUEUES</Label>
        <DensityToggle sectionKey={sectionKey} />
      </div>
      {isMinimal && (
        <div
          style={{
            backgroundColor: 'var(--as-bg-card)',
            borderRadius: 10,
            border: '1px solid var(--as-border-default)',
            boxShadow: 'var(--as-shadow-sm)',
            padding: '12px 14px',
            fontSize: 14,
            color: 'var(--as-text-secondary)',
          }}
        >
          {visible.length === 1 ? '1 queue' : `${visible.length} queues`} · {totalCount} item{totalCount === 1 ? '' : 's'} pending — tap the density toggle to expand.
        </div>
      )}
      {!isMinimal && (
      <ul
        style={{
          backgroundColor: 'var(--as-bg-card)',
          borderRadius: 10,
          border: '1px solid var(--as-border-default)',
          boxShadow: 'var(--as-shadow-sm)',
          overflow: 'hidden',
          padding: 0,
          margin: 0,
          listStyle: 'none',
        }}
      >
        {visible.map((lane, idx) => (
          <li
            key={lane.kind}
            style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--as-border-subtle)' }}
          >
            <Link
              to={lane.href}
              className="as-press"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                color: 'var(--as-text-primary)',
                textDecoration: 'none',
                fontSize: 14,
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>
                {lane.emoji}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{lane.label}</div>
                <div style={{ color: 'var(--as-text-secondary)', fontSize: 13, marginTop: 2 }}>
                  {lane.count === 1 ? '1 pending' : `${lane.count} pending`}
                </div>
              </div>
              <span
                aria-hidden="true"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--as-accent)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Review ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
      )}
    </section>
  );
}
