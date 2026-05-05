import { Check, Circle } from 'lucide-react';
import { useCheckIns } from '../../hooks/useCheckIns';
import LoadingSkeleton from '../shared/LoadingSkeleton';

// Check-in tab — one toggle per player (present / absent). Writes
// upserts into check_ins with checked_in bool + timestamp. Count
// of checked-in players shown at the top.
export default function EventCheckinTab({ eventId, roster, teamColor }) {
  const { checkIns, loading, toggle } = useCheckIns(eventId);

  if (loading) {
    return <div style={{ padding: 16 }}><LoadingSkeleton variant="list" count={5} /></div>;
  }
  if (roster.length === 0) {
    return <div style={{ padding: 16, color: 'var(--em-text-tertiary)', fontSize: 15 }}>No players on this team yet.</div>;
  }

  const map = {};
  checkIns.forEach((c) => { map[c.player_id] = c.checked_in; });
  const checkedCount = roster.filter((p) => map[p.id]).length;

  return (
    <div style={{ padding: '16px 16px 32px' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--em-text-secondary)', marginBottom: 12 }}>
        {checkedCount} of {roster.length} checked in
      </div>
      {roster.map((player) => {
        const on = !!map[player.id];
        return (
          <button key={player.id} type="button" onClick={() => toggle(player.id, on)}
            className="sf-press"
            aria-label={`${on ? 'Uncheck' : 'Check in'} ${player.first_name}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 0', width: '100%', background: 'none', border: 'none',
              borderBottom: '1px solid var(--em-border-subtle)',
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
            }}>
            <div style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: teamColor || 'var(--em-bg-tertiary)',
              color: 'var(--em-text-inverse)', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {player.jersey_number || '—'}
            </div>
            <div style={{ flex: 1, fontSize: 15, color: 'var(--em-text-primary)', fontWeight: 500 }}>
              {player.first_name} {player.last_name}
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: on ? 'var(--em-success-soft)' : 'transparent',
              border: on ? 'none' : '1px solid var(--em-border-default)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {on
                ? <Check size={18} strokeWidth={2.5} color="var(--em-success)" />
                : <Circle size={18} strokeWidth={1.5} color="var(--em-text-tertiary)" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}
