import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import RecurrenceSelector from './RecurrenceSelector';

const DURATIONS = [
  { label: '1h', minutes: 60 },
  { label: '1.5h', minutes: 90 },
  { label: '2h', minutes: 120 },
];

const ARRIVAL = [0, 5, 10, 15, 20, 30, 45, 60];

function addMinutes(time, mins) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export default function StepWhen({ data, onChange, isEdit, orgId }) {
  const [locations, setLocations] = useState([]);
  const [customMode, setCustomMode] = useState(false);

  useEffect(() => {
    let query = supabase.from('locations').select('name').order('name');
    if (orgId) query = query.eq('org_id', orgId);
    query.then(({ data: rows }) => {
      setLocations((rows || []).map((r) => r.name));
    });
  }, [orgId]);

  const set = (key, val) => onChange({ ...data, [key]: val });

  // When a user picks Weekly/Biweekly without setting Until, default it
  // to 12 weeks (84 days) from the event's start date — one season-ish.
  // Prevents expandDates from looping to its 100-event cap on empty until.
  const setRecurrence = (r) => {
    if (r.pattern !== 'once' && !r.until && data.date) {
      const defaultUntil = new Date(`${data.date}T00:00:00`);
      defaultUntil.setDate(defaultUntil.getDate() + 84);
      onChange({ ...data, recurrence: { pattern: r.pattern, until: defaultUntil.toISOString().slice(0, 10) } });
    } else {
      onChange({ ...data, recurrence: r });
    }
  };

  const setStartTime = (time) => {
    const updates = { ...data, startTime: time };
    if (data.durationMinutes) updates.endTime = addMinutes(time, data.durationMinutes);
    onChange(updates);
  };

  const setDuration = (mins) => {
    setCustomMode(false);
    const updates = { ...data, durationMinutes: mins };
    if (data.startTime) updates.endTime = addMinutes(data.startTime, mins);
    onChange(updates);
  };

  const enterCustomMode = () => {
    setCustomMode(true);
    onChange({ ...data, durationMinutes: null });
  };

  const setCustomEndTime = (time) => {
    onChange({ ...data, durationMinutes: null, endTime: time });
  };

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--sf-text-primary)' }}>When and where?</h2>

      <label style={fieldStyle}>
        <span style={labelStyle}>Date</span>
        <input type="date" value={data.date || ''} onChange={(e) => set('date', e.target.value)} style={inputStyle} />
      </label>

      {!isEdit && <RecurrenceSelector value={data.recurrence} onChange={setRecurrence} />}

      <label style={fieldStyle}>
        <span style={labelStyle}>Start time</span>
        <input type="time" value={data.startTime || ''} onChange={(e) => setStartTime(e.target.value)} step="300" style={inputStyle} />
      </label>

      <div>
        <span style={{ ...labelStyle, marginBottom: 6, display: 'block' }}>Duration</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {DURATIONS.map((d) => (
            <button key={d.minutes} type="button" onClick={() => setDuration(d.minutes)}
              className="sf-press" style={chipStyle(!customMode && data.durationMinutes === d.minutes)}>
              {d.label}
            </button>
          ))}
          <button type="button" onClick={enterCustomMode}
            className="sf-press" style={chipStyle(customMode)}>
            Custom
          </button>
        </div>
        {customMode ? (
          <input type="time" value={data.endTime || ''}
            onChange={(e) => setCustomEndTime(e.target.value)} step="300"
            style={{ ...inputStyle, marginTop: 8 }} />
        ) : (
          data.endTime && <span style={{ fontSize: 12, color: 'var(--sf-text-tertiary)', marginTop: 4, display: 'block' }}>Ends at {data.endTime}</span>
        )}
      </div>

      <label style={fieldStyle}>
        <span style={labelStyle}>Location</span>
        <select value={data.location || ''} onChange={(e) => set('location', e.target.value)} style={inputStyle}>
          <option value="">Select location</option>
          {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
        </select>
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>Court / room (optional)</span>
        <input type="text" value={data.subLocation || ''} onChange={(e) => set('subLocation', e.target.value)}
          placeholder="e.g. Court 3, Main Gym" style={inputStyle} />
      </label>

      <div>
        <span style={{ ...labelStyle, marginBottom: 6, display: 'block' }}>Arrive early</span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ARRIVAL.map((m) => (
            <button key={m} type="button" onClick={() => set('arrivalMinutes', m)}
              className="sf-press" style={chipStyle(data.arrivalMinutes === m)}>
              {m === 0 ? 'On time' : `${m}m`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 6 };
const labelStyle = { fontSize: 13, fontWeight: 500, color: 'var(--sf-text-secondary)' };
const inputStyle = {
  minHeight: 44, borderRadius: 10, border: '1px solid var(--sf-border-default)',
  backgroundColor: 'var(--sf-bg-card)', padding: '0 12px', fontSize: 15,
  color: 'var(--sf-text-primary)', width: '100%',
};
const chipStyle = (sel) => ({
  minHeight: 40, minWidth: 56, borderRadius: 10,
  border: sel ? '2px solid var(--sf-accent)' : '1px solid var(--sf-border-default)',
  backgroundColor: sel ? 'var(--sf-accent)' : 'var(--sf-bg-card)',
  color: sel ? 'var(--sf-text-inverse)' : 'var(--sf-text-primary)',
  fontSize: 14, fontWeight: 500, padding: '0 12px',
});
