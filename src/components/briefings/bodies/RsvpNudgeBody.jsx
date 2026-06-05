/* eslint-disable react-refresh/only-export-components */
// Wave 4.0 — rsvp_nudge body editor. Replaces the wave 3.11 stub.
//
// Body fields consumed by composeRsvpNudge (resolvers/rsvpNudge.js):
//   { coach_note?, parent_shoutout? }   -> each renders as a stats_narrative
//
// The prior body exposed headline_override / custom_message /
// ask_comment_field, but composeRsvpNudge never read them — they were a
// dead, misleading authoring surface. Replaced with the two override keys
// the composer actually consumes. (signoff_message is handled by the shared
// StepBodySignoff step, not here.) The one-tap RSVP buttons are NOT body
// fields — they're injected at per-recipient render time by rsvpNudgeSend.js
// via public.mint_rsvp_token().

import { fieldGap, labelStyle, textareaStyle } from './_styles';

export const defaultValue = {
  coach_note: '',
  parent_shoutout: '',
};

export function validate() { return []; } // all fields optional

export default function RsvpNudgeBody({ value, onChange }) {
  const v = { ...defaultValue, ...(value || {}) };
  const set = (patch) => onChange?.(patch);
  return (
    <div style={fieldGap}>
      <label>
        <span style={labelStyle}>Coach note (optional)</span>
        <textarea value={v.coach_note} onChange={(e) => set({ coach_note: e.target.value })} style={textareaStyle} placeholder="A short note above the event card. Leave empty for a clean nudge." />
      </label>
      <label>
        <span style={labelStyle}>Parent shoutout (optional)</span>
        <textarea value={v.parent_shoutout} onChange={(e) => set({ parent_shoutout: e.target.value })} style={textareaStyle} placeholder="Thank a volunteer or recognize a family." />
      </label>
    </div>
  );
}
