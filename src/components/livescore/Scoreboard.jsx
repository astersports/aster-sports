export default function Scoreboard({ teamName, opponentName, ourScore, oppScore, period, onPeriodChange, teamColor }) {
  return (
    <div style={{ backgroundColor: 'var(--em-header)', padding: '12px 16px', paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
        <select value={period} onChange={(e) => onPeriodChange(Number(e.target.value))}
          aria-label="Period"
          style={{ fontSize: 13, fontWeight: 600, padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', fontFamily: 'inherit' }}>
          <option value={1}>Half 1</option>
          <option value={2}>Half 2</option>
          <option value={3}>OT</option>
        </select>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>{opponentName || 'Opponent'}</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', fontFamily: "'Barlow Condensed', sans-serif" }}>{oppScore}</div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)', padding: '0 12px' }}>vs</div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: teamColor || 'var(--em-accent)' }}>{teamName || 'Home'}</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', fontFamily: "'Barlow Condensed', sans-serif" }}>{ourScore}</div>
        </div>
      </div>
    </div>
  );
}
