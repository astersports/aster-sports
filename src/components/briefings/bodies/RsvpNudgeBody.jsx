/* eslint-disable react-refresh/only-export-components */
// Wave 4.0 — rsvp_nudge body editor. Replaces the wave 3.11 stub.
//
// Body fields consumed by RsvpNudgeBody:
//   { headline_override?, custom_message?, ask_comment_field? }
//
// The actual one-tap buttons are NOT body fields — they're injected
// at per-recipient render time by rsvpNudgeSend.js, which calls
// public.mint_rsvp_token() RPC three times (going/maybe/not_going)
// per player the recipient is RSVPing for.

import { fieldGap, inputStyle, labelStyle, textareaStyle } from './_styles';

export const defaultValue = {
  headline_override: '',
  custom_message: '',
  ask_comment_field: false,
};

export function validate() { return []; } // all fields optional

export default function RsvpNudgeBody({ value, onChange }) {
  const v = { ...defaultValue, ...(value || {}) };
  const set = (patch) => onChange?.(patch);
  return (
    <div style={fieldGap}>
      <label>
        <span style={labelStyle}>Headline override (optional)</span>
        <input type="text" value={v.headline_override} onChange={(e) => set({ headline_override: e.target.value })} style={inputStyle} placeholder="Quick RSVP for {event}" />
      </label>
      <label>
        <span style={labelStyle}>Custom message (optional)</span>
        <textarea value={v.custom_message} onChange={(e) => set({ custom_message: e.target.value })} style={textareaStyle} placeholder="A short note above the buttons. Leave empty for a clean nudge." />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--as-text-secondary)' }}>
        <input type="checkbox" checked={v.ask_comment_field} onChange={(e) => set({ ask_comment_field: e.target.checked })} />
        Ask for an optional comment in the reply
      </label>
    </div>
  );
}
