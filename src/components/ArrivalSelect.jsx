import { useState } from 'react';
import { ARRIVAL_PRESETS } from '../lib/constants';
import { INPUT_CLS, LABEL_CLS } from '../lib/styles';

// Shared "arrive early" selector — preset minutes (15/20/25/30/45/60) plus a
// custom number input. Used by EventModal and RecurringModal.
//
// Why this is its own component:
//
// The previous inline implementation had a bug where picking "Custom..." set
// the value to '' which caused the custom-input visibility check
// (`val !== '' && !PRESETS.includes(val)`) to evaluate to false — so the
// number input never appeared and the user couldn't type anything.
//
// We fix it by tracking custom mode in a *separate* state variable from the
// numeric value. The select toggles `customMode`; the input writes to
// `value`. The two stay decoupled so an empty value during custom mode
// still keeps the input visible.
//
// `value` is either '' (none) or a number of minutes.

export default function ArrivalSelect({ value, onChange, idPrefix = 'ev' }) {
  // Initialize from the incoming value: if it's set and not a preset,
  // assume the parent stored a custom number → start in custom mode.
  const [customMode, setCustomMode] = useState(
    () => value !== '' && value != null && !ARRIVAL_PRESETS.includes(Number(value))
  );

  function handleSelectChange(e) {
    const v = e.target.value;
    if (v === 'custom') {
      setCustomMode(true);
      // Leave the value alone if it was already a custom number, otherwise clear it.
      if (ARRIVAL_PRESETS.includes(Number(value))) onChange('');
    } else if (v === '') {
      setCustomMode(false);
      onChange('');
    } else {
      setCustomMode(false);
      onChange(Number(v));
    }
  }

  function handleNumberChange(e) {
    const v = e.target.value;
    onChange(v === '' ? '' : Number(v));
  }

  const selectValue = customMode
    ? 'custom'
    : value !== '' && value != null
    ? String(value)
    : '';

  return (
    <div>
      <label htmlFor={`${idPrefix}-arrival`} className={LABEL_CLS}>
        Arrive early
      </label>
      <div className="flex gap-2">
        <select
          id={`${idPrefix}-arrival`}
          value={selectValue}
          onChange={handleSelectChange}
          className={INPUT_CLS}
        >
          <option value="">None</option>
          {ARRIVAL_PRESETS.map((m) => (
            <option key={m} value={m}>
              {m} min
            </option>
          ))}
          <option value="custom">Custom...</option>
        </select>
        {customMode && (
          <input
            type="number"
            min="1"
            max="120"
            value={value}
            onChange={handleNumberChange}
            className={`${INPUT_CLS} w-24`}
            placeholder="min"
            aria-label="Custom arrival minutes"
          />
        )}
      </div>
    </div>
  );
}
