import DutyEditor from './DutyEditor';
import { HOME_AWAY } from '../../lib/constants';

export default function StepDetails({ eventType, data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });
  const setHomeAway = (val) => {
    onChange({
      ...data,
      homeAway: val,
      jersey: val === 'home' ? 'Black' : val === 'away' ? 'White' : data.jersey,
    });
  };
  const isGame = eventType === 'game' || eventType === 'tournament';

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)' }}>Details</h2>

      <label style={fieldStyle}>
        <span style={labelStyle}>Title (optional)</span>
        <input type="text" value={data.title || ''} onChange={(e) => set('title', e.target.value)}
          placeholder={isGame ? 'vs. Storm AAU' : 'Practice'} style={inputStyle} />
      </label>

      {isGame && (
        <label style={fieldStyle}>
          <span style={labelStyle}>Opponent</span>
          <input type="text" value={data.opponent || ''} onChange={(e) => set('opponent', e.target.value)}
            placeholder="Enter opponent name" style={inputStyle} />
        </label>
      )}

      {isGame && (
        <label style={fieldStyle}>
          <span style={labelStyle}>Tournament name</span>
          <input type="text" value={data.tournamentName || ''} onChange={(e) => set('tournamentName', e.target.value)}
            placeholder="e.g. ZG NY Metro Showdown" style={inputStyle} />
        </label>
      )}

      {isGame && (
        <div>
          <span style={{ ...labelStyle, marginBottom: 6, display: 'block' }}>Home / Away</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {HOME_AWAY.map((v) => (
              <button key={v} type="button" onClick={() => setHomeAway(v)}
                className="sf-press" style={chipStyle(data.homeAway === v)}>
                {v === 'tbd' ? 'TBD' : v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {isGame && (
        <label style={fieldStyle}>
          <span style={labelStyle}>Jersey color</span>
          <input type="text" value={data.jersey || ''} onChange={(e) => set('jersey', e.target.value)}
            placeholder="e.g. White home, Black away" style={inputStyle} />
        </label>
      )}

      <label style={fieldStyle}>
        <span style={labelStyle}>Parent instructions</span>
        <textarea value={data.notes || ''} onChange={(e) => set('notes', e.target.value)}
          placeholder="Visible to parents" rows={3}
          style={{ ...inputStyle, minHeight: 80, padding: '10px 12px', resize: 'vertical' }} />
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>Coach notes</span>
        <span style={{ fontSize: 12, color: 'var(--em-text-tertiary)', marginTop: -4 }}>Not visible to parents</span>
        <textarea value={data.coachNotes || ''} onChange={(e) => set('coachNotes', e.target.value)}
          placeholder="Internal notes" rows={2}
          style={{ ...inputStyle, minHeight: 60, padding: '10px 12px', resize: 'vertical' }} />
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Toggle label="Indoor" checked={data.indoor ?? true} onChange={(v) => set('indoor', v)} />
        <Toggle label="Enable rides" checked={data.enableRides || false} onChange={(v) => set('enableRides', v)} />
        {isGame && <Toggle label="Scrimmage" checked={data.isScrimmage || false} onChange={(v) => set('isScrimmage', v)} />}
      </div>

      <DutyEditor value={data.duties} onChange={(duties) => set('duties', duties)} />
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      minHeight: 44, padding: '0 4px', cursor: 'pointer',
    }}>
      <span style={{ fontSize: 15, color: 'var(--em-text-primary)' }}>{label}</span>
      <div style={{
        width: 48, height: 28, borderRadius: 14, padding: 2,
        backgroundColor: checked ? 'var(--em-accent)' : 'var(--em-bg-tertiary)',
        transition: 'background-color 0.2s', display: 'flex', alignItems: 'center',
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: 12, backgroundColor: 'var(--em-text-inverse)',
          transform: checked ? 'translateX(20px)' : 'translateX(0)',
          transition: 'transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }} />
      </div>
    </div>
  );
}

const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 6 };
const labelStyle = { fontSize: 13, fontWeight: 500, color: 'var(--em-text-secondary)' };
const inputStyle = {
  minHeight: 44, borderRadius: 10, border: '1px solid var(--em-border-default)',
  backgroundColor: 'var(--em-bg-card)', padding: '0 12px', fontSize: 15,
  color: 'var(--em-text-primary)', width: '100%',
};
const chipStyle = (sel) => ({
  flex: 1, minHeight: 40, borderRadius: 10,
  border: sel ? '2px solid var(--em-accent)' : '1px solid var(--em-border-default)',
  backgroundColor: sel ? 'var(--em-accent)' : 'var(--em-bg-card)',
  color: sel ? 'var(--em-text-inverse)' : 'var(--em-text-primary)',
  fontSize: 13, fontWeight: 500,
});
