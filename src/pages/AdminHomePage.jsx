import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';
import { useAdminStats } from '../hooks/useAdminStats';
import { useSeasons } from '../hooks/useSeasons';
import { usePrograms } from '../hooks/usePrograms';
import KpiGrid from '../components/admin/KpiGrid';
import QuickActions from '../components/admin/QuickActions';
import ActiveSeasonCard from '../components/admin/ActiveSeasonCard';
import NextEventCard from '../components/admin/NextEventCard';
import TeamPerformanceStrip from '../components/admin/TeamPerformanceStrip';
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

// Time-of-day-aware greeting. Boundaries: <12:00 morning, 12:00-16:59
// afternoon, ≥17:00 evening. Uses the browser's local clock so the
// greeting tracks where the user actually is.
function greetingFor(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
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
    <div className="px-4 py-5 flex flex-col gap-6 sf-fade-in">
      <section className="min-w-0">
        <div style={{ color: 'var(--sf-text-tertiary)', fontSize: 13 }}>
          {greetingFor()},
        </div>
        <h1 className="font-bold" style={{ color: 'var(--sf-text-primary)', fontSize: 24, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
          {name}
        </h1>
        <div style={{
          width: 40,
          height: 3,
          borderRadius: 999,
          backgroundColor: 'var(--sf-accent)',
          marginTop: 8,
        }} />
      </section>

      <section className="min-w-0" aria-label="Key metrics">
        <KpiGrid stats={stats} />
      </section>

      <section className="min-w-0" aria-label="Quick actions">
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--sf-text-tertiary)',
          marginBottom: 8,
        }}>QUICK ACTIONS</div>
        <QuickActions />
      </section>

      <section className="min-w-0">
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--sf-text-tertiary)', marginBottom: 8 }}>TEAMS</div>
        <TeamPerformanceStrip programs={programs} navigate={navigate} />
      </section>

      <section className="min-w-0" aria-label="Active season">
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--sf-text-tertiary)',
          marginBottom: 8,
        }}>SEASON</div>
        <ActiveSeasonCard season={activeSeason} />
        <NextEventCard />
      </section>

      <section className="min-w-0">
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--sf-text-tertiary)',
          marginBottom: 8,
        }}>GETTING STARTED</div>
        <GettingStarted
          hasSeasons={seasons.length > 0}
          hasPrograms={programs.length > 0}
        />
      </section>

      {/* TEMP: sign-out affordance until the Account page is built. */}
      <div style={{ borderTop: '1px solid var(--sf-border-subtle)', paddingTop: 12 }}>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full sf-press flex items-center justify-between"
          style={{
            minHeight: 44,
            padding: '0 4px',
            background: 'none',
            border: 'none',
            color: 'var(--sf-danger)',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <span>Sign out</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  );
}
