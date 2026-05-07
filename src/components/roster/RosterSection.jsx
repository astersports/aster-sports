import RosterControls from './RosterControls';
import CopyRosterButton from './CopyRosterButton';
import PlayerRow from './PlayerRow';
import UpcomingEvents from './UpcomingEvents';
import CollapsibleSection from '../shared/CollapsibleSection';
import { useAuth } from '../../context/AuthContext';
import { isStaff } from '../../lib/permissions';

export default function RosterSection({ team, sortedPlayers, search, setSearch, sortBy, setSortBy }) {
  const { role } = useAuth();
  return (
    <>
      <RosterControls search={search} setSearch={setSearch} sortBy={sortBy} setSortBy={setSortBy} role={role} />
      <CollapsibleSection title="Roster" sectionKey="roster" count={`${sortedPlayers.length}`} defaultOpen={isStaff(role)}>
        <div className="flex items-center justify-end" style={{ marginBottom: 8 }}>
          {isStaff(role) && <CopyRosterButton team={team} sortedPlayers={sortedPlayers} />}
        </div>
        <div style={{
          backgroundColor: 'var(--em-bg-card)', borderRadius: 10,
          border: '1px solid var(--em-border-default)',
          boxShadow: 'var(--em-shadow-sm)', overflow: 'hidden',
        }}>
          {sortedPlayers.map((player, i) => (
            <div key={player.id} className={`sf-stagger-${Math.min(i + 1, 8)}`}>
              <PlayerRow player={player} teamColor={team.team_color} isLast={i === sortedPlayers.length - 1} />
            </div>
          ))}
        </div>
      </CollapsibleSection>
      <UpcomingEvents teamId={team.id} />
    </>
  );
}
