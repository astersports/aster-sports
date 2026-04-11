import { useState } from 'react';
import BottomSheet from '../shared/BottomSheet';

// Maps a preset quarter label to (monthStart, monthEnd) pairs that we'll
// combine with the chosen year to produce start_date / end_date. Months
// are 1-indexed here because it keeps the date string construction below
// a lot easier to read.
const PRESETS = {
  Spring: { start: [3, 1],  end: [6, 30] },
  Summer: { start: [7, 1],  end: [8, 31] },
  Fall:   { start: [9, 1],  end: [11, 30] },
  Winter: { start: [12, 1], end: [2, 28] }, // Winter rolls into next year
};

const ymd = (y, m, d) => `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

function applyPreset(quarter, year) {
  const p = PRESETS[quarter];
  const start = ymd(year, p.start[0], p.start[1]);
  const endYear = quarter === 'Winter' ? year + 1 : year;
  const end = ymd(endYear, p.end[0], p.end[1]);
  return { name: `${quarter} ${year}`, start_date: start, end_date: end };
}

// The BottomSheet returns null when closed so everything inside unmounts;
// that lets us drop useState initialization straight into a Body component
// that only exists while the sheet is open. No effect-based reset needed —
// a fresh mount starts from the right season every time.
export default function SeasonFormSheet({ open, season, onClose, onSave }) {
  return (
    <BottomSheet open={open} onClose={onClose} initialHeight="85dvh" expandedHeight="95dvh">
      <Body key={season?.id ?? 'new'} season={season} onSave={onSave} />
    </BottomSheet>
  );
}

function Body({ season, onSave }) {
  const editing = !!season;
  const [name, setName] = useState(season?.name ?? '');
  const [startDate, setStartDate] = useState(season?.start_date ?? '');
  const [endDate, setEndDate] = useState(season?.end_date ?? '');
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(
    season?.start_date ? new Date(season.start_date).getFullYear() : thisYear,
  );

  const pickPreset = (quarter) => {
    const preset = applyPreset(quarter, year);
    setName(preset.name);
    setStartDate(preset.start_date);
    setEndDate(preset.end_date);
  };

  const submit = () => {
    if (!name.trim() || !startDate || !endDate) return;
    onSave({ name: name.trim(), start_date: startDate, end_date: endDate });
  };

  const chip = (active) => ({
    minHeight: 36, padding: '0 14px', borderRadius: 999, fontSize: 13,
    border: `1px solid ${active ? 'var(--sf-accent)' : 'var(--sf-border-default)'}`,
    backgroundColor: active ? 'var(--sf-accent-soft)' : 'var(--sf-bg-card)',
    color: active ? 'var(--sf-accent)' : 'var(--sf-text-primary)',
    fontWeight: 500,
  });
  const inputStyle = {
    width: '100%', minHeight: 44, padding: '0 14px', borderRadius: 10,
    border: '1px solid var(--sf-border-default)',
    backgroundColor: 'var(--sf-bg-card)', color: 'var(--sf-text-primary)',
    fontSize: 15, outline: 'none',
  };
  const label = { color: 'var(--sf-text-secondary)', fontSize: 13, marginBottom: 6, display: 'block' };

  return (
    <div className="pt-2">
        <h2 className="font-semibold mb-4" style={{ color: 'var(--sf-text-primary)', fontSize: 18 }}>
          {editing ? 'Edit season' : 'New season'}
        </h2>

        <div className="mb-4">
          <span style={label}>Preset</span>
          <div className="flex flex-wrap gap-2 mb-2">
            {Object.keys(PRESETS).map((q) => (
              <button key={q} type="button" className="sf-press" style={chip(false)} onClick={() => pickPreset(q)}>
                {q} {year}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {[thisYear, thisYear + 1].map((y) => (
              <button
                key={y}
                type="button"
                className="sf-press"
                style={chip(y === year)}
                onClick={() => setYear(y)}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        <label className="block mb-3">
          <span style={label}>Name</span>
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Spring 2026" />
        </label>

        <label className="block mb-3">
          <span style={label}>Start date</span>
          <input type="date" style={inputStyle} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>

        <label className="block mb-5">
          <span style={label}>End date</span>
          <input type="date" style={inputStyle} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>

        <button
          type="button"
          onClick={submit}
          className="w-full font-semibold sf-press sf-bounce-tap"
          style={{
            minHeight: 44, borderRadius: 10,
            backgroundColor: 'var(--sf-accent)', color: '#FFFFFF', fontSize: 15,
          }}
        >
        {editing ? 'Save changes' : 'Create season'}
      </button>
    </div>
  );
}
