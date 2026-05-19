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

import { Link } from 'react-router-dom';
import Label from '../shared/Label';

export default function PendingQueuesLanes({ lanes, loading }) {
  if (loading) return null;
  const visible = (lanes || []).filter((l) => (l?.count || 0) > 0);
  if (!visible.length) return null;

  return (
    <section aria-label="Pending queues">
      <Label>PENDING QUEUES</Label>
      <ul
        style={{
          backgroundColor: 'var(--em-bg-card)',
          borderRadius: 10,
          border: '1px solid var(--em-border-default)',
          boxShadow: 'var(--em-shadow-sm)',
          overflow: 'hidden',
          padding: 0,
          margin: 0,
          listStyle: 'none',
        }}
      >
        {visible.map((lane, idx) => (
          <li
            key={lane.kind}
            style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--em-border-subtle)' }}
          >
            <Link
              to={lane.href}
              className="sf-press"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                color: 'var(--em-text-primary)',
                textDecoration: 'none',
                fontSize: 14,
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>
                {lane.emoji}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{lane.label}</div>
                <div style={{ color: 'var(--em-text-secondary)', fontSize: 13, marginTop: 2 }}>
                  {lane.count === 1 ? '1 pending' : `${lane.count} pending`}
                </div>
              </div>
              <span
                aria-hidden="true"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--em-accent)',
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
    </section>
  );
}
