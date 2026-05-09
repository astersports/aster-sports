/* eslint-disable react-refresh/only-export-components */
// Wave 3.11 follow-up — game_recap body editor.

import { fieldGap, inputStyle, labelStyle, textareaStyle } from './_styles';

export const defaultValue = {
  score: { ours: '', theirs: '' },
  our_highlights: '', opp_highlights: '',
  player_of_game_name: '', coach_note: '',
  // Wave 3.16.1: URL resolved from event.tournament_id → tournament.tourney_url.
  // For non-league/non-tournament games, parent_tourney_url is null and the
  // CTA hides regardless of label being set.
  tourney_link_label: '',
};

export function validate(v) {
  const errs = [];
  if (!v?.our_highlights?.trim() && !v?.coach_note?.trim()) errs.push('Add at least one of: highlights, coach note.');
  return errs;
}

export default function GameRecapBody({ value, onChange }) {
  const v = { ...defaultValue, ...(value || {}), score: { ...defaultValue.score, ...(value?.score || {}) } };
  const set = (patch) => onChange?.(patch);
  const setScore = (patch) => onChange?.({ score: { ...v.score, ...patch } });
  return (
    <div style={fieldGap}>
      <div style={{ display: 'flex', gap: 12 }}>
        <label style={{ flex: 1 }}>
          <span style={labelStyle}>Our score</span>
          <input type="number" inputMode="numeric" value={v.score.ours} onChange={(e) => setScore({ ours: e.target.value === '' ? '' : Number(e.target.value) })} style={inputStyle} placeholder="42" />
        </label>
        <label style={{ flex: 1 }}>
          <span style={labelStyle}>Their score</span>
          <input type="number" inputMode="numeric" value={v.score.theirs} onChange={(e) => setScore({ theirs: e.target.value === '' ? '' : Number(e.target.value) })} style={inputStyle} placeholder="38" />
        </label>
      </div>
      <label>
        <span style={labelStyle}>Our highlights</span>
        <textarea value={v.our_highlights} onChange={(e) => set({ our_highlights: e.target.value })} style={textareaStyle} placeholder="Strong third quarter, defensive stops on every possession." />
      </label>
      <label>
        <span style={labelStyle}>Opponent highlights (optional)</span>
        <textarea value={v.opp_highlights} onChange={(e) => set({ opp_highlights: e.target.value })} style={{ ...textareaStyle, minHeight: 64 }} placeholder="#12 had a hot first half." />
      </label>
      <label>
        <span style={labelStyle}>Player of the game</span>
        <input type="text" value={v.player_of_game_name} onChange={(e) => set({ player_of_game_name: e.target.value })} style={inputStyle} placeholder="Sara K." />
      </label>
      <label>
        <span style={labelStyle}>Coach note (optional)</span>
        <textarea value={v.coach_note} onChange={(e) => set({ coach_note: e.target.value })} style={textareaStyle} placeholder="What I want the team thinking about until next practice…" />
      </label>
      <label>
        <span style={labelStyle}>League/bracket CTA label (optional)</span>
        <input type="text" value={v.tourney_link_label} onChange={(e) => set({ tourney_link_label: e.target.value })} style={inputStyle} placeholder="VIEW LEAGUE STANDINGS" />
        <span style={{ fontSize: 12, color: 'var(--em-text-tertiary)', marginTop: 4, display: 'block' }}>
          URL is pulled from this game's parent tournament/league SE Tourney link, if the game is parented to one.
        </span>
      </label>
    </div>
  );
}
