import { useState } from 'react';
import Label from '../shared/Label';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import PlayerStatsTable from '../records/PlayerStatsTable';

export default function TeamPlayerStats({ players, stats, loading }) {
  const [showAvg, setShowAvg] = useState(false);
  if (!players?.length) return null;

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Label>Player Stats</Label>
        <button type="button" onClick={() => setShowAvg((v) => !v)} className="sf-press" style={{ minHeight: 32, padding: '0 10px', borderRadius: 9999, fontSize: 11, fontWeight: 500, border: '1px solid var(--em-border-default)', backgroundColor: showAvg ? 'var(--em-accent)' : 'var(--em-bg-card)', color: showAvg ? 'var(--em-text-inverse)' : 'var(--em-text-secondary)' }}>
          {showAvg ? 'Per Game' : 'Totals'}
        </button>
      </div>
      <div style={{ backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', overflow: 'hidden' }}>
        {loading ? <LoadingSkeleton variant="list" count={3} /> : <PlayerStatsTable players={players} stats={stats} showAvg={showAvg} />}
      </div>
    </div>
  );
}
