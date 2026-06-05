/* eslint-disable react-refresh/only-export-components */
// Wave 4.2-A-4 alignment — body fields match composeTournamentRecap's
// overrides contract in src/lib/engine/resolvers/tournamentRecap.js.
// Composer reads: standout_moments, coach_reflection, coach_note,
// parent_shoutout. signoff_message is a top-level state field handled
// by bodyOverrides (not part of state.body).
//
// Placement + per-game results auto-render from DB (placement_block +
// framed recap_game_cell "The Run" + bracket path in compose). No body
// editor needed for those. standings_paste is the one paste-fed section.

import { fieldGap, inputStyle, labelStyle, textareaStyle } from './_styles';

export const defaultValue = {
  standout_moments: '',
  coach_reflection: '',
  coach_note: '',
  parent_shoutout: '',
  // Full-depth (2026-06-05): FINAL pool standings. Operator pastes from
  // SortableEngine / TourneyMachine / league site — one team per line.
  // Empty = section omitted. Mirrors TournamentPrelimBody.standings_paste;
  // composeTournamentRecap feeds it to buildStandingsSection -> pool_standings.
  standings_paste: '',
};

export function validate(v) {
  const hasContent = v?.standout_moments?.trim()
    || v?.coach_reflection?.trim()
    || v?.coach_note?.trim()
    || v?.parent_shoutout?.trim()
    || v?.standings_paste?.trim();
  if (!hasContent) return ['Add at least one section — coach reflection, standout moments, coach note, parent shoutout, or final standings.'];
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
      <label>
        <span style={labelStyle}>Final standings (paste · one team per line)</span>
        <textarea value={v.standings_paste} onChange={(e) => set({ standings_paste: e.target.value })} style={textareaStyle} placeholder="ASA (MA)&#10;Legacy Hoopers (NY)&#10;Team Spartans Academy (MA)" />
      </label>
    </div>
  );
}
