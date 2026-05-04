const made = { backgroundColor: 'var(--em-success)', color: '#fff', fontWeight: 700 };
const miss = { backgroundColor: 'var(--em-danger)', color: '#fff', fontWeight: 700 };
const stat = { backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-primary)', border: '1px solid var(--em-border-default)' };
const ft = { backgroundColor: 'var(--em-warning)', color: '#fff', fontWeight: 700 };

const base = { minHeight: 52, borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 };

function Btn({ label, sub, style, onClick }) {
  return (
    <button type="button" onClick={onClick} className="sf-press" style={{ ...base, ...style }}>
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
        <Btn sub="+2" label="PT FG" style={made} onClick={() => fire('fg2_made')} />
        <Btn label="Free Throw" style={ft} onClick={() => fire('ft_made')} />
        <Btn sub="+3" label="PT FG" style={made} onClick={() => fire('fg3_made')} />
        {!isOpponent && <Btn label="REB" style={stat} onClick={() => fire('rebound')} />}
        {!isOpponent && <Btn label={isOpponent ? 'Foul' : 'AST'} style={stat} onClick={() => fire(isOpponent ? 'foul' : 'assist')} />}
        {!isOpponent && <Btn label="Foul" style={stat} onClick={() => fire('foul')} />}
        <Btn sub="2PT" label="Miss" style={miss} onClick={() => fire('fg2_miss')} />
        {!isOpponent && <Btn label="TO" style={stat} onClick={() => fire('turnover')} />}
        <Btn sub="3PT" label="Miss" style={miss} onClick={() => fire('fg3_miss')} />
        {!isOpponent && <Btn label="STL" style={stat} onClick={() => fire('steal')} />}
        {!isOpponent && <Btn label="BLK" style={stat} onClick={() => fire('block')} />}
      </div>
    </div>
  );
}
