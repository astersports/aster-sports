import { useEventArrivals } from '../../hooks/useEventArrivals';
import { useRoster } from '../../hooks/useRoster';
import { useNow } from '../../hooks/useNow';
import LoadingSkeleton from '../shared/LoadingSkeleton';

const STATUS_DISPLAY = {
  on_the_way: { icon: '🏃', label: 'On the way', bg: 'var(--as-warning-soft)', color: 'var(--as-warning)' },
  arrived: { icon: '✅', label: 'Here', bg: 'var(--as-success-soft)', color: 'var(--as-success)' },
  running_late: { icon: '⏰', label: 'Running late', bg: 'var(--as-danger-soft)', color: 'var(--as-danger)' },
};

export default function ArrivalBoard({ event }) {
  const { arrivals, loading, setArrival } = useEventArrivals(event.id);
  const { players } = useRoster(event.team_id);
  const now = useNow();
  const msUntil = new Date(event.start_at).getTime() - now;
  const msAfter = now - new Date(event.start_at).getTime();

  let ribbon = 'GAME DAY';
  if (msAfter > 0 && msAfter < 4 * 60 * 60 * 1000) ribbon = 'GAME LIVE';
  else if (msUntil > 0 && msUntil < 30 * 60 * 1000) ribbon = 'WARMING UP';
  else if (msUntil > 0) {
    const m = Math.floor(msUntil / 60000);
    ribbon = m > 60 ? `${Math.floor(m / 60)}h ${m % 60}m to tip` : `${m}m to tip`;
  }

  const arrivalMap = {};
  arrivals.forEach((a) => { arrivalMap[a.player_id] = a; });
  const arrived = arrivals.filter((a) => a.status === 'arrived').length;
  const STATUS_ORDER = { undefined: 0, running_late: 1, on_the_way: 2, arrived: 3 };
  const sortedPlayers = [...players].sort((a, b) => (STATUS_ORDER[arrivalMap[a.id]?.status] ?? 0) - (STATUS_ORDER[arrivalMap[b.id]?.status] ?? 0));

  if (loading) return <div style={{ padding: 16 }}><LoadingSkeleton variant="list" count={5} /></div>;

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--as-accent)' }}>{ribbon}</span>
        <span style={{ fontSize: 13, color: 'var(--as-text-tertiary)' }}>{arrived}/{players.length} arrived</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {sortedPlayers.map((p) => {
          const a = arrivalMap[p.id];
          const s = a ? STATUS_DISPLAY[a.status] : null;
          const time = a?.status_changed_at ? new Date(a.status_changed_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) : null;
          const nextStatus = !a ? 'arrived' : a.status === 'arrived' ? null : 'arrived';
          return (
            <button key={p.id} type="button" onClick={() => nextStatus && setArrival(p.id, nextStatus)} className="as-press"
              aria-label={`${p.first_name} ${p.last_name} — ${s ? s.label : 'tap to mark arrived'}`}
              style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10,
              backgroundColor: s?.bg || 'var(--as-bg-card)', border: '1px solid var(--as-border-subtle)',
              transition: 'background-color 300ms', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9999, backgroundColor: event.teams?.team_color || 'var(--as-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                fontSize: 12, fontWeight: 700, color: 'var(--as-text-inverse)',
              }}>{(p.first_name?.[0] || '')}{(p.last_name?.[0] || '')}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--as-text-primary)' }}>{p.first_name} {p.last_name}</div>
                <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)' }}>#{p.jersey_number || '—'}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {s ? (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 600, color: s.color }}>{s.icon} {a.status === 'running_late' ? `ETA ${a.eta_minutes}m` : s.label}</div>
                    {time && <div style={{ fontSize: 11, color: 'var(--as-text-tertiary)' }}>{time}</div>}
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)' }}>—</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
