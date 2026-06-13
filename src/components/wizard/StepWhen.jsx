import { useState } from 'react';
import RecurrenceSelector from './RecurrenceSelector';
import { useActiveSeasonEnd } from '../../hooks/useActiveSeasonEnd';
import { useSeason } from '../../context/SeasonContext';
import { useSeasonScopedLocations } from '../../hooks/useSeasonScopedLocations';
import { computeDefaultUntil } from '../../lib/recurrenceHelpers';
import { chipStyle, controlStyle, fieldLabelStyle } from './wizardStyles';
import Input from '../shared/Input';

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

export default function StepWhen({ data, onChange, orgId }) {
  const [customMode, setCustomMode] = useState(false);
  const seasonEnd = useActiveSeasonEnd(orgId);
  const { activeSeason } = useSeason();
  const locations = useSeasonScopedLocations(orgId, activeSeason?.id);

  const set = (key, val) => onChange({ ...data, [key]: val });

  // Default Until to last matching weekday before season_end on pick.
  const setRecurrence = (r) => {
    if (r.pattern !== 'once' && !r.until && data.date) {
      const until = computeDefaultUntil(data.date, r.pattern, seasonEnd);
      onChange({ ...data, recurrence: { pattern: r.pattern, until } });
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
      <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--as-text-primary)' }}>When and where?</h2>

      <div style={fieldStyle}>
        <Input type="date" label="Date" value={data.date || ''} onChange={(e) => set('date', e.target.value)} />
      </div>

      <RecurrenceSelector value={data.recurrence} onChange={setRecurrence} />

      <div style={fieldStyle}>
        <Input type="time" label="Start time" value={data.startTime || ''} onChange={(e) => setStartTime(e.target.value)} step="300" />
      </div>

      <div>
        <span style={{ ...fieldLabelStyle, marginBottom: 6, display: 'block' }}>Duration</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {DURATIONS.map((d) => (
            <button key={d.minutes} type="button" onClick={() => setDuration(d.minutes)}
              aria-pressed={!customMode && data.durationMinutes === d.minutes}
              className="as-press" style={chipStyle(!customMode && data.durationMinutes === d.minutes, { minWidth: 56, fontSize: 15, padding: '0 12px' })}>
              {d.label}
            </button>
          ))}
          <button type="button" onClick={enterCustomMode} aria-pressed={customMode}
            className="as-press" style={chipStyle(customMode, { minWidth: 56, fontSize: 15, padding: '0 12px' })}>
            Custom
          </button>
        </div>
        {customMode ? (
          <Input type="time" value={data.endTime || ''}
            onChange={(e) => setCustomEndTime(e.target.value)} step="300"
            style={{ marginTop: 8 }} />
        ) : (
          data.endTime && <span style={{ fontSize: 13, color: 'var(--as-text-tertiary)', marginTop: 4, display: 'block' }}>Ends at {data.endTime}</span>
        )}
      </div>

      <label style={fieldStyle}>
        <span style={fieldLabelStyle}>Location</span>
        {/* ONE onChange carrying both keys — `set` spreads stale `data`,
            so two sequential set() calls would clobber each other. The id
            rides along so events carry the location_id FK (2026-06-13). */}
        <select value={data.location || ''} style={controlStyle}
          onChange={(e) => { const row = locations.find((l) => l.name === e.target.value); onChange({ ...data, location: e.target.value, locationId: row?.id ?? null }); }}>
          <option value="">Select location</option>
          {/* A4 (L99 audit): an EDIT whose saved venue is off the current
              season-scoped list keeps showing its value instead of going
              blank (which read as "location cleared"). */}
          {data.location && !locations.some((l) => l.name === data.location) && (
            <option value={data.location}>{data.location}</option>
          )}
          {locations.map((loc) => <option key={loc.id} value={loc.name}>{loc.name}</option>)}
        </select>
      </label>

      <div style={fieldStyle}>
        <Input type="text" label="Court / room (optional)" value={data.subLocation || ''} onChange={(e) => set('subLocation', e.target.value)}
          placeholder="e.g. Court 3, Main Gym" />
      </div>

      <div>
        <span style={{ ...fieldLabelStyle, marginBottom: 6, display: 'block' }}>Arrive early</span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ARRIVAL.map((m) => (
            <button key={m} type="button" onClick={() => set('arrivalMinutes', m)}
              aria-pressed={data.arrivalMinutes === m}
              className="as-press" style={chipStyle(data.arrivalMinutes === m)}>
              {m === 0 ? 'On time' : `${m}m`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 6 };
