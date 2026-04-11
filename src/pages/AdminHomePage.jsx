import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';
import { useAdminStats } from '../hooks/useAdminStats';
import { useSeasons } from '../hooks/useSeasons';
import { usePrograms } from '../hooks/usePrograms';
import KpiGrid from '../components/admin/KpiGrid';
import QuickActions from '../components/admin/QuickActions';
import ActiveSeasonCard from '../components/admin/ActiveSeasonCard';
import GettingStarted from '../components/admin/GettingStarted';

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

export default function AdminHomePage() {
  const { user, signOut } = useAuth();
  const { activeSeason } = useSeason();
  const stats = useAdminStats();
  const { seasons } = useSeasons();
  const { programs } = usePrograms();
  const navigate = useNavigate();

  const name = firstNameFrom(user);

  // Temporary sign-out affordance until the Account page is built. Lives
  // at the bottom of the admin dashboard so it's reachable without
  // needing a top-nav menu yet.
  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  // overflow-x-hidden + max-w-full on the page wrapper is defense in
  // depth — even if a child component escapes its box, nothing drags
  // the page horizontally. `min-w-0` on each section lets flex children
  // actually shrink below their content width (the default is auto,
  // which refuses to shrink and widens the parent).
  return (
    <div
      className="px-4 py-4 flex flex-col gap-5 sf-fade-in overflow-x-hidden"
      style={{ maxWidth: '100%' }}
    >
      <section className="min-w-0">
        <div style={{ color: 'var(--sf-text-tertiary)', fontSize: 13 }}>
          Welcome back,
        </div>
        <h1
          className="font-bold truncate"
          style={{ color: 'var(--sf-text-primary)', fontSize: 24, lineHeight: 1.2 }}
        >
          {name}
        </h1>
      </section>

      <section className="min-w-0" aria-label="Key metrics">
        <KpiGrid stats={stats} />
      </section>

      <section className="min-w-0" aria-label="Quick actions">
        <div
          className="font-semibold mb-2"
          style={{ color: 'var(--sf-text-secondary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}
        >
          Quick actions
        </div>
        <QuickActions />
      </section>

      <section className="min-w-0" aria-label="Active season">
        <div
          className="font-semibold mb-2"
          style={{ color: 'var(--sf-text-secondary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}
        >
          Season
        </div>
        <ActiveSeasonCard season={activeSeason} />
      </section>

      <section className="min-w-0">
        <GettingStarted
          hasSeasons={seasons.length > 0}
          hasPrograms={programs.length > 0}
        />
      </section>

      {/* TEMP: sign-out affordance until the Account page is built. */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={handleSignOut}
          className="sf-press"
          style={{
            minHeight: 44,
            padding: '0 16px',
            background: 'none',
            border: 'none',
            color: 'var(--sf-danger)',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
