import { memo } from 'react';
import { ArrowLeft } from 'lucide-react';

export default memo(function Scoreboard({ teamName, opponentName, ourScore, oppScore, period, onPeriodChange, teamColor, onBack }) {
  return (
    <div style={{ backgroundColor: 'var(--em-header)', padding: '12px 16px', paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        {onBack && (
          <button type="button" onClick={onBack} className="em-press" aria-label="Exit live scoring" style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>
            <ArrowLeft size={20} strokeWidth={1.75} color="var(--em-text-on-dark)" />
          </button>
        )}
        <select value={period} onChange={(e) => onPeriodChange(Number(e.target.value))}
          aria-label="Period"
          style={{ fontSize: 14, fontWeight: 600, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--em-text-on-dark)', fontFamily: 'inherit', minHeight: 44 }}>
          <option value={1}>Half 1</option>
          <option value={2}>Half 2</option>
          <option value={3}>OT</option>
        </select>
        <div style={{ width: 44 }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: teamColor || 'var(--em-accent)' }}>{teamName || 'Home'}</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--em-text-on-dark)', fontFamily: "'Barlow Condensed', sans-serif" }}>{ourScore}</div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--em-text-on-dark)', opacity: 0.4, padding: '0 12px' }}>vs</div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--em-text-on-dark)', opacity: 0.7 }}>{opponentName || 'Opponent'}</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--em-text-on-dark)', fontFamily: "'Barlow Condensed', sans-serif" }}>{oppScore}</div>
        </div>
      </div>
    </div>
  );
});
