import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

// Shown when RequireAuth detects a user whose role isn't in the route's
// allowedRoles list — e.g. a parent trying to reach /score.
export default function UnauthorizedPage() {
  return (
    <div
      className="sf-fullscreen flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--sf-bg-page)' }}
    >
      <div className="text-center" style={{ maxWidth: 360 }}>
        <div
          className="inline-flex items-center justify-center mb-4"
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            backgroundColor: 'var(--sf-warning-soft)',
            color: 'var(--sf-warning)',
          }}
          aria-hidden="true"
        >
          <ShieldAlert size={32} strokeWidth={1.75} />
        </div>
        <h1
          className="font-semibold"
          style={{ color: 'var(--sf-text-primary)', fontSize: 20, marginBottom: 8 }}
        >
          You don't have access to this page
        </h1>
        <p style={{ color: 'var(--sf-text-secondary)', fontSize: 14, marginBottom: 20 }}>
          Ask an admin if you think this is a mistake.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center font-semibold sf-press"
          style={{
            minHeight: 44,
            padding: '0 20px',
            borderRadius: 10,
            backgroundColor: 'var(--sf-accent)',
            color: 'var(--sf-text-inverse)',
            fontSize: 15,
          }}
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
