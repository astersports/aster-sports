import { Lock } from 'lucide-react';
import RosterControls from './RosterControls';
import CopyRosterButton from './CopyRosterButton';
import PlayerRow from './PlayerRow';
import CollapsibleSection from '../shared/CollapsibleSection';
import { useAuth } from '../../context/AuthContext';
import { isStaff } from '../../lib/permissions';
import { useRosterHidden } from '../../hooks/useRosterHidden';

export default function RosterSection({ team, sortedPlayers, search, setSearch, sortBy, setSortBy, lastFetchedAt, onRefresh }) {
  const { role, myChildren } = useAuth();
  const myPlayerIds = (myChildren || []).map((c) => c.playerId);
  // R3: a hidden roster (tryout/camp) returns only the parent's own child via RLS;
  // this line frames that one-child view as privacy-by-design rather than a bug.
  const rosterHidden = useRosterHidden(team.id);
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
        backgroundColor: 'var(--as-bg-card)', borderRadius: 10,
        border: '1px solid var(--as-border-default)',
        boxShadow: 'var(--as-shadow-sm)', overflow: 'hidden',
      }}>
        {sortedPlayers.map((player, i) => (
          <div key={player.id} className={`as-stagger-${Math.min(i + 1, 8)}`}>
            <PlayerRow player={player} teamColor={team.team_color} isLast={i === sortedPlayers.length - 1} isMyChild={myPlayerIds.includes(player.id)} teamId={team.id} />
          </div>
        ))}
        {role === 'parent' && rosterHidden && (
          <div style={privacyRow}>
            <Lock size={16} strokeWidth={1.75} color="var(--as-text-tertiary)" aria-hidden="true" style={{ flex: 'none', marginTop: 1 }} />
            <span><b style={{ color: 'var(--as-text-primary)', fontWeight: 600 }}>Rosters are private for tryouts and camps.</b> You’ll only see your own child here.</span>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}

const privacyRow = { display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', borderTop: '1px solid var(--as-border-subtle)', backgroundColor: 'var(--as-bg-card-hover)', fontSize: 12.5, color: 'var(--as-text-secondary)', lineHeight: 1.45 };
