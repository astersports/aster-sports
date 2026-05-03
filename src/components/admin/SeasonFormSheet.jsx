import { useState } from 'react';
import FullScreenForm from '../shared/FullScreenForm';
import Input from '../shared/Input';

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

// FullScreenForm unmounts its children when closed, so Body mounts fresh
// on every open and initializes useState directly from the season prop —
// no effect-based reset needed. The `key` also remounts Body when the
// edited season changes while the sheet is already open.
export default function SeasonFormSheet({ open, season, onClose, onSave }) {
  const title = season ? 'Edit season' : 'New season';
  return (
    <FullScreenForm open={open} onClose={onClose} title={title}>
      <Body key={season?.id ?? 'new'} season={season} onSave={onSave} />
    </FullScreenForm>
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
    minHeight: 44, padding: '0 16px', borderRadius: 999, fontSize: 13,
    border: `1px solid ${active ? 'var(--em-accent)' : 'var(--em-border-default)'}`,
    backgroundColor: active ? 'var(--em-accent-soft)' : 'var(--em-bg-card)',
    color: active ? 'var(--em-accent)' : 'var(--em-text-primary)',
    fontWeight: 500,
  });
  const label = { color: 'var(--em-text-secondary)', fontSize: 13, marginBottom: 6, display: 'block' };

  return (
    <div>
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

        <div className="block mb-3">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Spring 2026" />
        </div>

        <div className="block mb-3">
          <Input type="date" label="Start date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>

        <div className="block mb-5">
          <Input type="date" label="End date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

        <button
          type="button"
          onClick={submit}
          className="w-full font-semibold sf-press sf-bounce-tap"
          style={{
            minHeight: 44, borderRadius: 10,
            backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)', fontSize: 15,
          }}
        >
        {editing ? 'Save changes' : 'Create season'}
      </button>
    </div>
  );
}
