/* eslint-disable react-refresh/only-export-components */
// Wave 3.11 follow-up — custom_message body editor.

import { fieldGap, inputStyle, labelStyle, textareaStyle } from './_styles';

export const defaultValue = { subject: '', body_text: '' };

export function validate(v) {
  if (!v?.subject?.trim()) return ['Subject is required.'];
  if (!v?.body_text?.trim()) return ['Body is required.'];
  return [];
}

export default function CustomMessageBody({ value, onChange }) {
  const v = { ...defaultValue, ...(value || {}) };
  const set = (patch) => onChange?.(patch);
  return (
    <div style={fieldGap}>
      <label>
        <span style={labelStyle}>Subject</span>
        <input type="text" value={v.subject} onChange={(e) => set({ subject: e.target.value })} style={inputStyle} placeholder="Quick favor" />
      </label>
      <label>
        <span style={labelStyle}>Body</span>
        <textarea value={v.body_text} onChange={(e) => set({ body_text: e.target.value })} style={{ ...textareaStyle, minHeight: 200 }} placeholder="Need 2 volunteers for snack run Saturday — reply to this email if you can help." />
      </label>
    </div>
  );
}
