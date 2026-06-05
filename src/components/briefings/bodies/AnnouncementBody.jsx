/* eslint-disable react-refresh/only-export-components */
// Wave 3.11 follow-up — announcement body editor.

import { fieldGap, inputStyle, labelStyle, textareaStyle } from './_styles';
import TokenInsertMenu from '../TokenInsertMenu';
import TokenChipPreview from '../TokenChipPreview';

export const defaultValue = { headline: '', body_text: '' };

export function validate(v) {
  if (!v?.headline?.trim()) return ['Headline is required.'];
  return [];
}

export default function AnnouncementBody({ value, onChange }) {
  const v = { ...defaultValue, ...(value || {}) };
  const set = (patch) => onChange?.(patch);
  return (
    <div style={fieldGap}>
      <label>
        <span style={labelStyle}>Headline</span>
        <input type="text" value={v.headline} onChange={(e) => set({ headline: e.target.value })} style={inputStyle} placeholder="Practice canceled tomorrow" />
      </label>
      <label>
        <span style={labelStyle}>Body</span>
        <textarea value={v.body_text} onChange={(e) => set({ body_text: e.target.value })} style={{ ...textareaStyle, minHeight: 160 }} placeholder="WCC unavailable due to facility issue. Back to normal Wednesday." />
      </label>
      <TokenInsertMenu onInsert={(placeholder) => {
        const sep = v.body_text && !v.body_text.endsWith(' ') ? ' ' : '';
        set({ body_text: `${v.body_text}${sep}${placeholder} ` });
      }} />
      <TokenChipPreview text={v.body_text} />
    </div>
  );
}
