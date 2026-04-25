// Derives a user-visible first name from either the Supabase user metadata
// (full_name / name) or the email local-part. Falls back to "Coach" so the
// greeting never reads "Welcome back, ".
function firstNameFrom(user) {
  if (!user) return 'Coach';
  const md = user.user_metadata || {};
  const raw = md.full_name || md.name || user.email || '';
  const first = String(raw).split(/[\s.@]/)[0];
  if (!first) return 'Coach';
  return first.charAt(0).toUpperCase() + first.slice(1);
}

// Time-of-day-aware greeting. Boundaries: <12:00 morning, 12:00-16:59
// afternoon, ≥17:00 evening. Uses the browser's local clock so the
// greeting tracks where the user actually is.
function greetingFor(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// Greeting block at the top of AdminHomePage: "Good morning, Frank" with
// an accent-colored underline. Pure presentational — reads only the
// user for first-name derivation.
export default function AdminGreeting({ user }) {
  return (
    <section className="min-w-0">
      <div style={{ color: 'var(--sf-text-tertiary)', fontSize: 13 }}>
        {greetingFor()},
      </div>
      <h1 className="font-bold" style={{ color: 'var(--sf-text-primary)', fontSize: 24, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
        {firstNameFrom(user)}
      </h1>
    </section>
  );
}
