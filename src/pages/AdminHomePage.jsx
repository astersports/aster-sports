import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';
import { useAdminStats } from '../hooks/useAdminStats';
import { useSeasons } from '../hooks/useSeasons';
import { usePrograms } from '../hooks/usePrograms';
import { useActivities } from '../hooks/useActivities';
import { useRefetchOnVisible } from '../hooks/useRefetchOnVisible';
import { useOrgTeamRecords } from '../hooks/useOrgTeamRecords';
import KpiGrid from '../components/admin/KpiGrid';
import QuickActions from '../components/admin/QuickActions';
import ActiveSeasonCard from '../components/admin/ActiveSeasonCard';
import AdminScheduleSection from '../components/admin/AdminScheduleSection';
import TeamPerformanceStrip from '../components/admin/TeamPerformanceStrip';
import GettingStarted from '../components/admin/GettingStarted';
import AdminGreeting from '../components/admin/AdminGreeting';
import NotificationHistory from '../components/admin/NotificationHistory';
import Label from '../components/shared/Label';

export default function AdminHomePage() {
  const { user, orgId } = useAuth();
  const { activeSeason } = useSeason();
  const stats = useAdminStats();
  const { seasons } = useSeasons();
  const { programs } = usePrograms();
  const { activities, refetch } = useActivities();
  const { byTeamId: recordsByTeam } = useOrgTeamRecords(orgId);
  useRefetchOnVisible(refetch);
  const navigate = useNavigate();

  // overflow-x-hidden + max-w-full on the page wrapper is defense in
  // depth — even if a child component escapes its box, nothing drags
  // the page horizontally. `min-w-0` on each section lets flex children
  // actually shrink below their content width (the default is auto,
  // which refuses to shrink and widens the parent).
  return (
    <div className="px-4 py-5 flex flex-col gap-6 sf-fade-in">
      <AdminGreeting user={user} />

      <section className="min-w-0" aria-label="Key metrics">
        <KpiGrid stats={stats} />
      </section>

      <section className="min-w-0" aria-label="Quick actions">
        <Label>QUICK ACTIONS</Label>
        <QuickActions />
      </section>

      <section className="min-w-0" aria-label="Teams">
        <Label>TEAMS</Label>
        <TeamPerformanceStrip programs={programs} recordsByTeam={recordsByTeam} navigate={navigate} />
      </section>

      <section className="min-w-0" aria-label="Active season">
        <Label>SEASON</Label>
        <ActiveSeasonCard season={activeSeason} />
      </section>

      <section className="min-w-0" aria-label="This week">
        <Label>THIS WEEK</Label>
        <AdminScheduleSection activities={activities} />
      </section>

      <section className="min-w-0" aria-label="Notification history">
        <Label>RECENT NOTIFICATIONS</Label>
        <NotificationHistory orgId={orgId} />
      </section>

      <GettingStarted
        hasSeasons={seasons.length > 0}
        hasPrograms={programs.length > 0}
      />
    </div>
  );
}
