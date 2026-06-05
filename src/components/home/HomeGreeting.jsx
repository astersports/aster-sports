import { greetingFor } from '../../lib/greetings';

// HomeGreeting — slot 2 of the shell contract v2. Shared across all three
// role homes; the role page passes the resolved display name + an optional
// context sublabel (e.g. "Legacy Hoopers · 2 teams", "Director · all 5
// teams"). Generalizes the former ParentHomeHeader.
//
// Greeting + sublabel use --as-text-meta (#6B7280, 4.6:1) rather than
// --as-text-tertiary (#8896AB, 3.8:1) so meta-rank text clears WCAG AA per
// the CLAUDE.md §0 accessibility corollary.
export default function HomeGreeting({ name, sublabel }) {
  return (
    <section>
      <div style={{ color: 'var(--as-text-meta)', fontSize: 13 }}>{greetingFor()},</div>
      <h1
        className="font-bold"
        style={{ color: 'var(--as-text-primary)', fontSize: 24, letterSpacing: '-0.025em', lineHeight: 1.2 }}
      >
        {name}
      </h1>
      {sublabel && (
        <div style={{ color: 'var(--as-text-meta)', fontSize: 13, marginTop: 2 }}>{sublabel}</div>
      )}
    </section>
  );
}
