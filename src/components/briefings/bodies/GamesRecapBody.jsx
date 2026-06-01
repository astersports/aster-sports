/* eslint-disable react-refresh/only-export-components */
// Wave 5 games_recap (G1) PR C — body editor. Pick which recently-played
// games to include: the selection writes audience_filter.event_ids (drives
// the audience = union of those games' teams) AND mirrors into the body
// value for validate(). Plus optional highlights + coach note. Mirrors the
// AcademyCallupBody dual-write pattern.

import { useAuth } from '../../../context/AuthContext';
import { useRecentPlayedGames } from '../../../hooks/useRecentPlayedGames';
import { fieldGap, labelStyle, textareaStyle } from './_styles';

export const defaultValue = { event_ids: [], our_highlights: '', coach_note: '' };

export function validate(v) {
  const errs = [];
  if (!v?.event_ids?.length) errs.push('Pick at least one game.');
  return errs;
}

const dateFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', month: 'short', day: 'numeric' });
function gameLabel(g) {
  const date = g.start_at ? dateFmt.format(new Date(g.start_at)) : 'TBD';
  const opp = g.opponent ? ` vs ${g.opponent}` : '';
  return `${date} · ${g.team_name}${opp} · ${g.our_score}-${g.opponent_score} (${g.result})`;
}

const rowStyle = (on) => ({
  display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 44, padding: '8px 10px',
  borderRadius: 10, border: `1px solid ${on ? 'var(--as-accent)' : 'var(--as-border-default)'}`,
  backgroundColor: on ? 'var(--as-accent-soft)' : 'var(--as-bg-card)', cursor: 'pointer', textAlign: 'left',
  fontSize: 13, color: 'var(--as-text-primary)',
});

export default function GamesRecapBody({ value, onChange, audienceFilter, onAudienceChange }) {
  const v = { ...defaultValue, ...(value || {}) };
  const { orgId } = useAuth();
  const { games, loading } = useRecentPlayedGames(orgId);
  const selected = audienceFilter?.event_ids || v.event_ids || [];
  const sel = new Set(selected);

  const toggle = (id) => {
    const next = sel.has(id) ? selected.filter((x) => x !== id) : [...selected, id];
    onChange?.({ event_ids: next });
    onAudienceChange?.({ event_ids: next });
  };

  return (
    <div style={fieldGap}>
      <div>
        <span style={labelStyle}>Games to include</span>
        {loading && <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)' }}>Loading recent games…</div>}
        {!loading && !games.length && (
          <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)' }}>No recently-played games with published scores in the last 60 days.</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {games.map((g) => {
            const on = sel.has(g.id);
            return (
              <button key={g.id} type="button" onClick={() => toggle(g.id)} aria-pressed={on} className="as-press" style={rowStyle(on)}>
                <input type="checkbox" checked={on} readOnly aria-hidden="true" tabIndex={-1} />
                <span style={{ flex: 1, minWidth: 0 }}>{gameLabel(g)}</span>
              </button>
            );
          })}
        </div>
        {selected.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--as-text-secondary)', marginTop: 6 }}>
            {selected.length} game{selected.length === 1 ? '' : 's'} selected · families across those teams receive this recap.
          </div>
        )}
      </div>
      <label>
        <span style={labelStyle}>Highlights (optional)</span>
        <textarea value={v.our_highlights} onChange={(e) => onChange?.({ our_highlights: e.target.value })} style={textareaStyle} placeholder="Standout moments across the games…" />
      </label>
      <label>
        <span style={labelStyle}>Coach note (optional)</span>
        <textarea value={v.coach_note} onChange={(e) => onChange?.({ coach_note: e.target.value })} style={textareaStyle} placeholder="A line from the coaching staff." />
      </label>
    </div>
  );
}
