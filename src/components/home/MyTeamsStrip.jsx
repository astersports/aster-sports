// MY TEAMS section on ParentHomePage. Extracted so the page's
// useOrgTeamRecords map flows to each card via prop instead of each
// card calling its own hook. Renders nothing when teams array is empty
// — the page already guards on myTeams.length > 0 before rendering.
import ParentHomeTeamCard from './ParentHomeTeamCard';
import Label from '../shared/Label';

export default function MyTeamsStrip({ teams, byTeamId, loading, onSelect }) {
  if (!teams || teams.length === 0) return null;
  return (
    <section>
      <Label>MY TEAMS</Label>
      <div className="flex gap-2 overflow-x-auto sf-no-scrollbar" style={{ paddingBottom: 4 }}>
        {teams.map((t) => (
          <ParentHomeTeamCard
            key={t.id}
            team={t}
            summary={byTeamId[t.id]}
            loading={loading}
            onClick={() => onSelect(t.id)}
          />
        ))}
      </div>
    </section>
  );
}
