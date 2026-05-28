import RosterControls from './RosterControls';
import CopyRosterButton from './CopyRosterButton';
import PlayerRow from './PlayerRow';
import CollapsibleSection from '../shared/CollapsibleSection';
import { useAuth } from '../../context/AuthContext';
import { isStaff } from '../../lib/permissions';

export default function RosterSection({ team, sortedPlayers, search, setSearch, sortBy, setSortBy, lastFetchedAt, onRefresh }) {
  const { role, myChildren } = useAuth();
  const myPlayerIds = (myChildren || []).map((c) => c.playerId);
  // 2026-05-21 (Teams PR A / B3) — subtitle gives staff/parents a peek of
  // state without expanding. Use most-recent-event response count derived
  // from the same enriched players already in scope (no extra fetch).
  const responded = sortedPlayers.filter((p) =>
    (p.goingCount || 0) + (p.maybeCount || 0) + (p.declinedCount || 0) > 0
  ).length;
  const subtitle = responded > 0 ? `${responded} responded last event` : null;
  return (
    <CollapsibleSection title="Roster" sectionKey="roster" count={`${sortedPlayers.length}`} subtitle={subtitle} defaultOpen={false}>
      <RosterControls search={search} setSearch={setSearch} sortBy={sortBy} setSortBy={setSortBy} role={role}
        lastFetchedAt={lastFetchedAt} onRefresh={onRefresh} />
      <div className="flex items-center justify-end" style={{ marginBottom: 8 }}>
        {isStaff(role) && <CopyRosterButton team={team} sortedPlayers={sortedPlayers} />}
      </div>
      <div style={{
        backgroundColor: 'var(--em-bg-card)', borderRadius: 10,
        border: '1px solid var(--em-border-default)',
        boxShadow: 'var(--em-shadow-sm)', overflow: 'hidden',
      }}>
        {sortedPlayers.map((player, i) => (
          <div key={player.id} className={`em-stagger-${Math.min(i + 1, 8)}`}>
            <PlayerRow player={player} teamColor={team.team_color} isLast={i === sortedPlayers.length - 1} isMyChild={myPlayerIds.includes(player.id)} teamId={team.id} />
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}
