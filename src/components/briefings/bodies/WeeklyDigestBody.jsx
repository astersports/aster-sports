/* eslint-disable react-refresh/only-export-components */
// Wave 3.11 follow-up — weekly_digest body editor. Ports the field
// shape from the existing DigestComposerForm: body_notes (intro line),
// ops_notes (BEFORE YOU GO bullets), and pulls signoff_message from
// the wizard's shared signoff field — not duplicated here.

import { fieldGap, labelStyle, textareaStyle } from './_styles';

export const defaultValue = { body_notes: '', ops_notes: '' };

export function validate() { return []; } // optional — empty digest is valid

export default function WeeklyDigestBody({ value, onChange }) {
  const v = { ...defaultValue, ...(value || {}) };
  const set = (patch) => onChange?.(patch);
  return (
    <div style={fieldGap}>
      <label>
        <span style={labelStyle}>Intro note (optional)</span>
        <textarea value={v.body_notes} onChange={(e) => set({ body_notes: e.target.value })}
          placeholder="One sentence above the schedule (e.g. 'Quick week — three teams on the road')"
          style={{ ...textareaStyle, minHeight: 64 }} />
      </label>
      <label>
        <span style={labelStyle}>Before you go (one bullet per line)</span>
        <textarea value={v.ops_notes} onChange={(e) => set({ ops_notes: e.target.value })}
          placeholder={"Carpool sign-up by Thursday\nReversible jerseys for tournament\nWater bottles"}
          style={textareaStyle} />
      </label>
    </div>
  );
}
