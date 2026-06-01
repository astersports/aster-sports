/* eslint-disable react-refresh/only-export-components */
// Wave 4.1d-2 §5.1 — minimal body editor for academy_callup_notice (G2).
// Wave 4.2-A-8c: cleanup post-registry-migration. Stale data-shaped
// fields (jerseyColor, coachName, rsvpUrl) preserved for backward-
// compat with legacy preview but unused by the registry compose path
// (which reads org.coaches from context.org and emits callup_token
// placeholders, not a single rsvpUrl). The `coach_note` field
// (renamed from introNote) flows into overrides.coach_note via
// bodyOverrides, picked up by composeAcademyCallupNotice's narrative
// loop. Player selection is the anchor (audience_filter.player_ids).
//
// Wave 4.8 BUG (5/13 incident) — when KIND_METADATA.academy_callup_notice
// .wizardSupported === false, this module short-circuits to a redirect
// card pointing admins at the canonical flow. The picker UI below is
// preserved for the day the flag flips back on (e.g. when the wizard
// learns to call add_academy_callup itself).

import { useState } from 'react';
import { KIND_METADATA } from '../../../lib/briefings/kindMetadata';
import { fieldGap, inputStyle, labelStyle, textareaStyle } from './_styles';
import AcademyCallupRedirectCard from './AcademyCallupRedirectCard';
import PlayerPicker from './PlayerPicker';

export const defaultValue = {
  player_ids: [],
  coach_note: '',
};

export function validate(v) {
  const errs = [];
  if (!v?.player_ids?.length) errs.push('Pick at least one player.');
  return errs;
}

export default function AcademyCallupBody({ value, onChange, audienceFilter, onAudienceChange }) {
  const v = { ...defaultValue, ...(value || {}) };
  const [pickerOpen, setPickerOpen] = useState(false);
  const set = (patch) => onChange?.(patch);
  const selectedIds = audienceFilter?.player_ids || v.player_ids || [];
  // Wave 4.8 BUG short-circuit. Returns the redirect card and never
  // renders the picker when the wizard can't complete this kind. Sits
  // AFTER hook declarations to keep the Rules of Hooks call order stable.
  if (KIND_METADATA.academy_callup_notice?.wizardSupported === false) {
    return <AcademyCallupRedirectCard />;
  }

  return (
    <div style={fieldGap}>
      <div>
        <span style={labelStyle}>Player(s) being called up</span>
        <button type="button" onClick={() => setPickerOpen(true)} className="as-press"
          style={{ ...inputStyle, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          {selectedIds.length ? `${selectedIds.length} player${selectedIds.length === 1 ? '' : 's'} selected` : 'Pick a player from Academy roster…'}
        </button>
        {pickerOpen && (
          <PlayerPicker selected={selectedIds} onClose={() => setPickerOpen(false)}
            onSelect={(ids) => { set({ player_ids: ids }); onAudienceChange?.({ player_ids: ids }); }} />
        )}
      </div>
      <label>
        <span style={labelStyle}>Coach note (optional)</span>
        <textarea value={v.coach_note} onChange={(e) => set({ coach_note: e.target.value })} style={textareaStyle}
          placeholder="Why we're inviting this player up — what to expect on game day." />
      </label>
      <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)', lineHeight: 1.4 }}>
        Anchored to a specific game (Step 2). Email is delivered only to the chosen player(s) guardians, not the whole roster. Coach signoff is auto-populated from org staff.
      </div>
    </div>
  );
}

