import { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNow } from '../../hooks/useNow';
import { eventTimeState } from '../../lib/eventWindows';
import DateGroupedList from './DateGroupedList';

// COMPLETED section (spec §1.4): last 7 days, collapsed by default,
// newest-first, summary in the header. Membership reads eventTimeState
// 'completed' — in-progress events stay in the Happening-now band (the
// old start_at < now check pulled live games in here mid-game), and
// NULL-end_at events retire 2h after start via eventEnd (DB-8 tolerance).
export default function PastEventsSection({ activities, data, density }) {
  const [open, setOpen] = useState(false);
  const now = useNow();

  const past7 = useMemo(() => {
    const cutoff = now - 7 * 24 * 60 * 60 * 1000;
    return activities
      .filter((a) => {
        if (!a.start_at || a.status === 'cancelled') return false;
        return new Date(a.start_at).getTime() >= cutoff && eventTimeState(a, now) === 'completed';
      })
      .sort((a, b) => new Date(b.start_at) - new Date(a.start_at));
  }, [activities, now]);

  const summary = useMemo(() => {
    if (!data.gameResults) return null;
    const wCount = past7.filter((a) => data.gameResults[a.id]?.result === 'W').length;
    const lCount = past7.filter((a) => data.gameResults[a.id]?.result === 'L').length;
    return wCount + lCount > 0 ? `${wCount}W-${lCount}L` : null;
  }, [past7, data.gameResults]);

  if (past7.length === 0) return null;

  return (
    <div style={{ marginTop: 12 }}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="as-press"
        aria-expanded={open}
        style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '4px 0', minHeight: 44, background: 'none', border: 'none', cursor: 'pointer' }}>
        <ChevronRight size={14} strokeWidth={1.75} color="var(--as-text-tertiary)"
          style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 200ms ease-out' }} />
        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--as-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Past 7 days
        </span>
        <span style={{ fontSize: 11, color: 'var(--as-text-tertiary)' }}>({past7.length}){!open && summary ? ` · ${summary}` : ''}</span>
      </button>
      {open && <DateGroupedList events={past7} data={data} density={density} onRsvpChange={data.onRsvpSaved} />}
    </div>
  );
}
