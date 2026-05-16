/* eslint-disable react-refresh/only-export-components */
// Wave 4.2-A-4 alignment — body fields match composeTournamentRecap's
// overrides contract in src/lib/engine/resolvers/tournamentRecap.js.
// Composer reads: standout_moments, coach_reflection, coach_note,
// parent_shoutout. signoff_message is a top-level state field handled
// by bodyOverrides (not part of state.body).
//
// Placement + per-game results auto-render from DB (placement_block +
// game_log sections in compose). No body editor needed for those.

import { fieldGap, inputStyle, labelStyle, textareaStyle } from './_styles';

export const defaultValue = {
  standout_moments: '',
  coach_reflection: '',
  coach_note: '',
  parent_shoutout: '',
};

export function validate(v) {
  const hasContent = v?.standout_moments?.trim()
    || v?.coach_reflection?.trim()
    || v?.coach_note?.trim()
    || v?.parent_shoutout?.trim();
  if (!hasContent) return ['Add at least one section — coach reflection, standout moments, coach note, or parent shoutout.'];
  return [];
}

export default function TournamentRecapBody({ value, onChange }) {
  const v = { ...defaultValue, ...(value || {}) };
  const set = (patch) => onChange?.(patch);
  return (
    <div style={fieldGap}>
      <label>
        <span style={labelStyle}>Coach reflection</span>
        <textarea value={v.coach_reflection} onChange={(e) => set({ coach_reflection: e.target.value })} style={textareaStyle} placeholder="Defense in the second half was the difference in the bracket win." />
      </label>
      <label>
        <span style={labelStyle}>Standout moments</span>
        <textarea value={v.standout_moments} onChange={(e) => set({ standout_moments: e.target.value })} style={textareaStyle} placeholder="Sara K. with 18 points and the game-winning block." />
      </label>
      <label>
        <span style={labelStyle}>Coach note (optional)</span>
        <textarea value={v.coach_note} onChange={(e) => set({ coach_note: e.target.value })} style={textareaStyle} placeholder="Per-game blurbs, opponent notes, or anything else worth calling out." />
      </label>
      <label>
        <span style={labelStyle}>Parent shoutout (optional)</span>
        <input type="text" value={v.parent_shoutout} onChange={(e) => set({ parent_shoutout: e.target.value })} style={inputStyle} placeholder="Thanks to the carpool crew this weekend." />
      </label>
    </div>
  );
}
