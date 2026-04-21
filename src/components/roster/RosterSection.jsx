import RosterControls from './RosterControls';
import CopyRosterButton from './CopyRosterButton';
import PlayerRow from './PlayerRow';
import UpcomingEvents from './UpcomingEvents';

// Populated-roster view for TeamDetailPage: controls (search + sort),
// ROSTER section header with copy button, the player list itself, and
// the trailing UpcomingEvents block. Pure presentational — all state
// (search, sortBy) lives in the parent.
export default function RosterSection({ team, sortedPlayers, search, setSearch, sortBy, setSortBy }) {
  return (
    <>
      <RosterControls
        search={search}
        setSearch={setSearch}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
          textTransform: 'uppercase', color: 'var(--sf-text-tertiary)',
        }}>ROSTER</div>
        <CopyRosterButton team={team} sortedPlayers={sortedPlayers} />
      </div>
      <div style={{
        backgroundColor: 'var(--sf-bg-card)',
        borderRadius: 10,
        border: '1px solid var(--sf-border-default)',
        boxShadow: 'var(--sf-shadow-sm)',
        overflow: 'hidden',
      }}>
        {sortedPlayers.map((player, i) => (
          <div key={player.id} className={`sf-stagger-${Math.min(i + 1, 8)}`}>
            <PlayerRow
              player={player}
              teamColor={team.team_color}
              isLast={i === sortedPlayers.length - 1}
            />
          </div>
        ))}
      </div>
      <UpcomingEvents />
    </>
  );
}
