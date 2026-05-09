/* eslint-disable react-refresh/only-export-components */
// Wave 3.11 follow-up — tournament_recap body editor.
// Wave 3.16.1 — added optional tourney_link_label. The URL itself is
// resolved at compose/render time from the anchored tournament's
// tourney_url column (NOT stored on the body). Empty label hides the
// CTA; non-empty label + non-null tourney_url renders a primary CTA.

import { fieldGap, inputStyle, labelStyle, textareaStyle } from './_styles';

export const defaultValue = {
  final_standing: '', game_results: '', mvp_name: '', takeaways: '',
  tourney_link_label: '',
};

export function validate(v) {
  if (!v?.final_standing?.trim() && !v?.takeaways?.trim()) return ['Add at least final standing or takeaways.'];
  return [];
}

export default function TournamentRecapBody({ value, onChange }) {
  const v = { ...defaultValue, ...(value || {}) };
  const set = (patch) => onChange?.(patch);
  return (
    <div style={fieldGap}>
      <label>
        <span style={labelStyle}>Final standing</span>
        <input type="text" value={v.final_standing} onChange={(e) => set({ final_standing: e.target.value })} style={inputStyle} placeholder="Finished 3rd of 8 teams." />
      </label>
      <label>
        <span style={labelStyle}>Game-by-game results</span>
        <textarea value={v.game_results} onChange={(e) => set({ game_results: e.target.value })} style={textareaStyle} placeholder={"Sat: W 42-38 vs Storm Blue, L 30-40 vs Mavs\nSun: W 51-44 vs Heat"} />
      </label>
      <label>
        <span style={labelStyle}>MVP / standout</span>
        <input type="text" value={v.mvp_name} onChange={(e) => set({ mvp_name: e.target.value })} style={inputStyle} placeholder="Sara K." />
      </label>
      <label>
        <span style={labelStyle}>Coach takeaways</span>
        <textarea value={v.takeaways} onChange={(e) => set({ takeaways: e.target.value })} style={textareaStyle} placeholder="Defense in the second half was the difference in the bracket win." />
      </label>
      <label>
        <span style={labelStyle}>Bracket/schedule CTA label (optional)</span>
        <input type="text" value={v.tourney_link_label} onChange={(e) => set({ tourney_link_label: e.target.value })} style={inputStyle} placeholder="VIEW BRACKET ON SE TOURNEY" />
        <span style={{ fontSize: 12, color: 'var(--em-text-tertiary)', marginTop: 4, display: 'block' }}>
          URL is pulled from this tournament's SE Tourney link in tournament settings.
        </span>
      </label>
    </div>
  );
}
