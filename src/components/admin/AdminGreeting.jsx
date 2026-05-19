import { firstNameFrom, greetingFor } from '../../lib/greetings';

// Greeting block at the top of AdminHomePage: "Good morning, Frank" with
// an accent-colored underline. Pure presentational — reads only the
// user for first-name derivation. Greeting is NY-pinned per
// `greetings.js` (Cluster 7 fix, 2026-05-19) — the previous local
// implementation used browser-local time and skewed the greeting for
// admins traveling outside ET.
export default function AdminGreeting({ user }) {
  return (
    <section className="min-w-0">
      <div style={{ color: 'var(--em-text-tertiary)', fontSize: 13 }}>
        {greetingFor()},
      </div>
      <h1 className="font-bold" style={{ color: 'var(--em-text-primary)', fontSize: 24, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
        {firstNameFrom(user)}
      </h1>
    </section>
  );
}
