import { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNow } from '../../hooks/useNow';
import DateGroupedList from './DateGroupedList';

export default function PastEventsSection({ activities, rsvpCounts, rideCounts, dutyCounts, gameResults, weather, onRsvpChange }) {
  const [open, setOpen] = useState(false);
  const now = useNow();

  const past7 = useMemo(() => {
    const cutoff = now - 7 * 24 * 60 * 60 * 1000;
    return activities
      .filter((a) => {
        if (!a.start_at || a.status === 'cancelled') return false;
        const t = new Date(a.start_at).getTime();
        return t >= cutoff && t < now;
      })
      .sort((a, b) => new Date(b.start_at) - new Date(a.start_at));
  }, [activities, now]);

  const summary = useMemo(() => {
    if (!gameResults) return null;
    const wCount = past7.filter(a => gameResults[a.id]?.result === 'W').length;
    const lCount = past7.filter(a => gameResults[a.id]?.result === 'L').length;
    return wCount + lCount > 0 ? `${wCount}W-${lCount}L` : null;
  }, [past7, gameResults]);

  if (past7.length === 0) return null;

  return (
    <div style={{ marginTop: 12 }}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="sf-press"
        aria-expanded={open}
        style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '4px 0', minHeight: 44, background: 'none', border: 'none', cursor: 'pointer' }}>
        <ChevronRight size={14} strokeWidth={1.75} color="var(--em-text-tertiary)"
          style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 200ms ease-out' }} />
        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--em-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Past 7 days
        </span>
        <span style={{ fontSize: 11, color: 'var(--em-text-tertiary)' }}>({past7.length}){!open && summary ? ` · ${summary}` : ''}</span>
      </button>
      {open && <DateGroupedList events={past7} rsvpCounts={rsvpCounts} rideCounts={rideCounts} dutyCounts={dutyCounts} gameResults={gameResults} weather={weather} onRsvpChange={onRsvpChange} />}
    </div>
  );
}
