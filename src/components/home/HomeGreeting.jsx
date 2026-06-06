import { greetingFor } from '../../lib/greetings';

// HomeGreeting — slot 2 of shell contract v2. Shared across all three role
// homes. Parent passes `kids` (colored chips: { playerId, label, color });
// coach/admin pass a `sublabel` string ("Director · all 5 teams"). The
// optional `action` slot holds the density toggle (right-aligned).
//
// Greeting + sublabel use --as-text-meta (#6B7280, 4.6:1) not
// --as-text-tertiary (3.8:1) so meta-rank text clears WCAG AA (§0 corollary).
export default function HomeGreeting({ name, kids = [], sublabel, action }) {
  return (
    <section style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: 'var(--as-text-meta)', fontSize: 13 }}>{greetingFor()},</div>
        <h1
          className="font-bold"
          style={{ color: 'var(--as-text-primary)', fontSize: 24, letterSpacing: '-0.025em', lineHeight: 1.2 }}
        >
          {name}
        </h1>
        {kids.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 5 }}>
            {kids.map((k) => (
              <span
                key={k.playerId}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: k.color || 'var(--as-text-secondary)' }}
              >
                <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: k.color || 'var(--as-neutral)' }} />
                {k.label}
              </span>
            ))}
          </div>
        ) : (
          sublabel && <div style={{ color: 'var(--as-text-meta)', fontSize: 13, marginTop: 2 }}>{sublabel}</div>
        )}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </section>
  );
}
