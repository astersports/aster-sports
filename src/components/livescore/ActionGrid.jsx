const made = { backgroundColor: 'var(--em-success)', color: 'var(--em-text-inverse)', fontWeight: 700 };
const miss = { backgroundColor: 'var(--em-danger)', color: 'var(--em-text-inverse)', fontWeight: 700 };
const stat = { backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-primary)', border: '1px solid var(--em-border-default)' };
const ft = { backgroundColor: 'var(--em-warning)', color: 'var(--em-text-inverse)', fontWeight: 700 };
const base = { minHeight: 52, borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 };

function Btn({ label, sub, style, onClick, ariaLabel }) {
  return (
    <button type="button" onClick={onClick} className="sf-press" aria-label={ariaLabel || `${sub || ''} ${label}`} style={{ ...base, ...style }}>
      {sub && <span style={{ fontSize: 17, fontWeight: 800 }}>{sub}</span>}
      <span>{label}</span>
    </button>
  );
}

export default function ActionGrid({ isOpponent, onPlay, teamLabel }) {
  const fire = (type) => onPlay(type, { isOpponent });
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--em-text-secondary)', marginBottom: 8, paddingLeft: 4 }}>{teamLabel}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        <Btn sub="+2" label="PT FG" style={made} onClick={() => fire('fg2_made')} ariaLabel="2-point field goal made" />
        <Btn label="Free Throw" style={ft} onClick={() => fire('ft_made')} ariaLabel="Free throw made" />
        <Btn sub="+3" label="PT FG" style={made} onClick={() => fire('fg3_made')} ariaLabel="3-point field goal made" />
        <Btn sub="2PT" label="Miss" style={miss} onClick={() => fire('fg2_miss')} ariaLabel="2-point miss" />
        {isOpponent ? <Btn label="Foul" style={stat} onClick={() => fire('foul')} /> : <Btn label="AST" style={stat} onClick={() => fire('assist')} />}
        <Btn sub="3PT" label="Miss" style={miss} onClick={() => fire('fg3_miss')} ariaLabel="3-point miss" />
        {!isOpponent && <Btn label="REB" style={stat} onClick={() => fire('rebound')} />}
        {!isOpponent && <Btn label="TO" style={stat} onClick={() => fire('turnover')} />}
        {!isOpponent && <Btn label="Foul" style={stat} onClick={() => fire('foul')} />}
        {!isOpponent && <Btn label="STL" style={stat} onClick={() => fire('steal')} />}
        {!isOpponent && <Btn label="BLK" style={stat} onClick={() => fire('block')} />}
        <Btn label="FT Miss" style={miss} onClick={() => fire('ft_miss')} ariaLabel="Free throw miss" />
      </div>
    </div>
  );
}
