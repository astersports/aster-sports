import { useState } from 'react';
import { applySeasonPreset, SEASON_QUARTERS } from '../../../lib/seasonPresets';

// Quarter-preset chips for season programs (ported from SeasonFormSheet,
// PR-A1 one-door). Fills name + start/end dates from a quarter × year. Render
// only for program_type='season'. onApply receives { name, start_date, end_date }.
export default function SeasonPresetPicker({ onApply }) {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);

  return (
    <div style={{ marginBottom: 12 }}>
      <span style={label}>Quick preset</span>
      <div style={row}>
        {SEASON_QUARTERS.map((q) => (
          <button key={q} type="button" className="as-press" style={chip} onClick={() => onApply(applySeasonPreset(q, year))}>
            {q} {year}
          </button>
        ))}
      </div>
      <div style={{ ...row, marginTop: 8 }}>
        {[thisYear, thisYear + 1].map((y) => (
          <button
            key={y} type="button" className="as-press" aria-pressed={y === year}
            style={{ ...chip, ...(y === year ? chipOn : null) }} onClick={() => setYear(y)}
          >
            {y}
          </button>
        ))}
      </div>
    </div>
  );
}

const label = { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--as-text-tertiary)', display: 'block', marginBottom: 6 };
const row = { display: 'flex', flexWrap: 'wrap', gap: 8 };
const chip = { minHeight: 44, padding: '0 14px', borderRadius: 999, fontSize: 13, fontWeight: 500, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', color: 'var(--as-text-primary)', cursor: 'pointer' };
const chipOn = { borderColor: 'var(--as-accent)', backgroundColor: 'var(--as-accent-soft)', color: 'var(--as-accent)' };
