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
  const { user } = useAuth();
  const { activeSeason } = useSeason();
  const stats = useAdminStats();
  const { seasons } = useSeasons();
  const { programs } = usePrograms();

  const name = firstNameFrom(user);

  return (
    <div className="px-4 py-4 flex flex-col gap-5 sf-fade-in">
      <section>
        <div style={{ color: 'var(--sf-text-tertiary)', fontSize: 13 }}>
          Welcome back,
        </div>
        <h1
          className="font-bold"
          style={{ color: 'var(--sf-text-primary)', fontSize: 24, lineHeight: 1.2 }}
        >
          {name}
        </h1>
      </section>

      <section aria-label="Key metrics">
        <KpiGrid stats={stats} />
      </section>

      <section aria-label="Quick actions">
        <div
          className="font-semibold mb-2"
          style={{ color: 'var(--sf-text-secondary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}
        >
          Quick actions
        </div>
        <QuickActions />
      </section>

      <section aria-label="Active season">
        <div
          className="font-semibold mb-2"
          style={{ color: 'var(--sf-text-secondary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}
        >
          Season
        </div>
        <ActiveSeasonCard season={activeSeason} />
      </section>

      <section>
        <GettingStarted
          hasSeasons={seasons.length > 0}
          hasPrograms={programs.length > 0}
        />
      </section>
    </div>
  );
}
