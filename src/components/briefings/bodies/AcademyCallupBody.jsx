/* eslint-disable react-refresh/only-export-components */
// Wave 4.1d-2 §5.1 — minimal body editor for academy_callup_notice (G2).
//
// Maps form fields to composeAcademyCallupNotice data shape. Player
// selection is handled by the audience picker (player_specific mode) —
// the chosen player's first_name + team flow into the renderer via
// composerSubmit data injection. This editor collects only the fields
// the admin authors directly: jersey color, RSVP URL, coach name, and
// optional intro line.

import { useState } from 'react';
import { fieldGap, inputStyle, labelStyle, textareaStyle } from './_styles';
import PlayerPicker from './PlayerPicker';

export const defaultValue = {
  player_ids: [],
  jerseyColor: '',
  coachName: '',
  rsvpUrl: '',
  introNote: '',
};

export function validate(v) {
  const errs = [];
  if (!v?.player_ids?.length) errs.push('Pick at least one player.');
  if (!v?.coachName?.trim()) errs.push('Add a coach name (signs the email).');
  return errs;
}

export default function AcademyCallupBody({ value, onChange, audienceFilter, onAudienceChange }) {
  const v = { ...defaultValue, ...(value || {}) };
  const [pickerOpen, setPickerOpen] = useState(false);
  const set = (patch) => onChange?.(patch);
  const selectedIds = audienceFilter?.player_ids || v.player_ids || [];

  return (
    <div style={fieldGap}>
      <div>
        <span style={labelStyle}>Player(s) being called up</span>
        <button type="button" onClick={() => setPickerOpen(true)} className="sf-press"
          style={{ ...inputStyle, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          {selectedIds.length ? `${selectedIds.length} player${selectedIds.length === 1 ? '' : 's'} selected` : 'Pick a player from Academy roster…'}
        </button>
        {pickerOpen && (
          <PlayerPicker selected={selectedIds} onClose={() => setPickerOpen(false)}
            onSelect={(ids) => { set({ player_ids: ids }); onAudienceChange?.({ player_ids: ids }); }} />
        )}
      </div>
      <label>
        <span style={labelStyle}>Coach name (signs the email)</span>
        <input type="text" value={v.coachName} onChange={(e) => set({ coachName: e.target.value })} style={inputStyle} placeholder="Coach Kenny" />
      </label>
      <label>
        <span style={labelStyle}>Jersey color (optional)</span>
        <input type="text" value={v.jerseyColor} onChange={(e) => set({ jerseyColor: e.target.value })} style={inputStyle} placeholder="Navy" />
      </label>
      <label>
        <span style={labelStyle}>RSVP link (optional)</span>
        <input type="text" value={v.rsvpUrl} onChange={(e) => set({ rsvpUrl: e.target.value })} style={inputStyle} placeholder="https://…" />
      </label>
      <label>
        <span style={labelStyle}>Intro note (optional)</span>
        <textarea value={v.introNote} onChange={(e) => set({ introNote: e.target.value })} style={textareaStyle}
          placeholder="Why we're inviting this player up — what to expect on game day." />
      </label>
      <div style={{ fontSize: 12, color: 'var(--em-text-tertiary)', lineHeight: 1.4 }}>
        Anchored to a specific game (Step 2). Email is delivered only to the chosen player(s) guardians, not the whole roster.
      </div>
    </div>
  );
}

