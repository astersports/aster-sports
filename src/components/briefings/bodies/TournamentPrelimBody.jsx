/* eslint-disable react-refresh/only-export-components */
// Wave 3.11 follow-up — tournament_prelim body editor.

import { fieldGap, inputStyle, labelStyle, textareaStyle } from './_styles';

export const defaultValue = {
  hotel_block: '', sat_notes: '', sun_notes: '',
  opponent_scouting: '', lineup_notes: '',
  // Wave 3.16.1: URL resolved from tournament.tourney_url at render.
  tourney_link_label: '',
};

export function validate(v) {
  const filled = ['hotel_block', 'sat_notes', 'sun_notes', 'opponent_scouting', 'lineup_notes'].filter((k) => v?.[k]?.trim());
  if (!filled.length) return ['Add at least one section so the briefing has body content.'];
  return [];
}

export default function TournamentPrelimBody({ value, onChange }) {
  const v = { ...defaultValue, ...(value || {}) };
  const set = (patch) => onChange?.(patch);
  const fields = [
    { key: 'hotel_block', label: 'Hotel + parking', placeholder: 'Hampton Inn block: $189/night through May 14. Code: LEGACY11U.' },
    { key: 'sat_notes', label: 'Saturday plan', placeholder: 'Pool play 9 AM, noon, 3 PM. Arrive 45 min before tip.' },
    { key: 'sun_notes', label: 'Sunday plan', placeholder: 'Bracket play TBD pending Saturday results.' },
    { key: 'opponent_scouting', label: 'Opponent scouting', placeholder: 'Saturday opponent leans on #12 — physical defender on her.' },
    { key: 'lineup_notes', label: 'Lineup considerations', placeholder: 'Start with Sara, Sienna, Stella, Sloane, Skyla.' },
  ];
  return (
    <div style={fieldGap}>
      {fields.map((f) => (
        <label key={f.key}>
          <span style={labelStyle}>{f.label}</span>
          <textarea value={v[f.key]} onChange={(e) => set({ [f.key]: e.target.value })} style={textareaStyle} placeholder={f.placeholder} />
        </label>
      ))}
      <label>
        <span style={labelStyle}>Bracket/schedule CTA label (optional)</span>
        <input type="text" value={v.tourney_link_label} onChange={(e) => set({ tourney_link_label: e.target.value })} style={inputStyle} placeholder="VIEW SCHEDULE ON SE TOURNEY" />
        <span style={{ fontSize: 12, color: 'var(--em-text-tertiary)', marginTop: 4, display: 'block' }}>
          URL is pulled from this tournament's SE Tourney link in tournament settings.
        </span>
      </label>
    </div>
  );
}
