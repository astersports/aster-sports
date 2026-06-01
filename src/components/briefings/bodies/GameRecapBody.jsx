/* eslint-disable react-refresh/only-export-components */
// Wave 4.2-A-2 — game_recap body editor.
// Wave 4.2-A-8a: useEffect bridge replaced by useResolverPreview.
// Data displays read from resolver context; free-form fields persist
// to state.body.* unchanged. composerSubmit dispatches via registry,
// so legacy auto-populate is no longer needed.

import { Link } from 'react-router-dom';
import { fieldGap, inputStyle, labelStyle, textareaStyle } from './_styles';
import { GameRecapNotPublishedError, resolveGameRecap } from '../../../lib/engine/resolvers/gameRecap';
import { useResolverPreview } from '../../../lib/engine/useResolverPreview';

export const defaultValue = {
  our_highlights: '', opp_highlights: '',
  coach_note: '',
  tourney_link_label: '',
};

export function validate(v) {
  const errs = [];
  if (!v?.our_highlights?.trim() && !v?.coach_note?.trim()) errs.push('Add at least one of: highlights, coach note.');
  return errs;
}

const cardStyle = { padding: 12, borderRadius: 10, backgroundColor: 'var(--as-bg-secondary)', border: '1px solid var(--as-border-default)' };
const valueStyle = { fontSize: 15, color: 'var(--as-text-primary)', fontWeight: 500 };
const mutedStyle = { fontSize: 13, color: 'var(--as-text-tertiary)' };
const editLink = { fontSize: 12, color: 'var(--as-accent)', textDecoration: 'none', marginLeft: 8 };

function ReadOnlyRow({ label, present, value, missing, eventId, linkLabel = 'Update in Quick Score' }) {
  return (
    <div style={cardStyle}>
      <div style={{ ...labelStyle, marginBottom: 4 }}>{label}</div>
      {present
        ? <div style={valueStyle}>{value}</div>
        : <div style={mutedStyle}>{missing}</div>}
      {eventId && <Link to={`/events/${eventId}/live`} style={editLink}>{linkLabel} →</Link>}
    </div>
  );
}

export default function GameRecapBody({ value, onChange, hasParentTournament, anchorId }) {
  const v = { ...defaultValue, ...(value || {}) };
  const set = (patch) => onChange?.(patch);
  const anchor = anchorId ? { eventId: anchorId, pilotOnly: false } : null;
  const { data, isLoading, error } = useResolverPreview({ resolve: resolveGameRecap, anchor });

  if (error && error.name === 'GameRecapNotPublishedError') {
    return (
      <div style={{ ...cardStyle, borderColor: 'var(--as-warning)', backgroundColor: 'var(--as-warning-soft)' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--as-text-primary)' }}>Score not published yet</div>
        <div style={{ ...mutedStyle, marginTop: 4 }}>Publish via Quick Score first, then return here.</div>
        {anchorId && <Link to={`/events/${anchorId}/live`} style={{ ...editLink, marginLeft: 0, marginTop: 8, display: 'inline-block' }}>Open Quick Score →</Link>}
      </div>
    );
  }

  const gr = data?.context?.game_result;
  const pog = data?.context?.player_of_game;
  const hasScore = gr && gr.our_score != null && gr.opponent_score != null;

  return (
    <div style={fieldGap}>
      <ReadOnlyRow
        label="Score" eventId={anchorId}
        present={hasScore}
        value={hasScore ? `${gr.our_score} – ${gr.opponent_score} (${gr.result})` : (isLoading ? 'Loading…' : '—')}
        missing="No score logged" />
      <ReadOnlyRow
        label="Player of the Game" eventId={anchorId}
        present={!!pog?.first_name}
        value={pog?.first_name || (isLoading ? 'Loading…' : '—')}
        missing="No Player of the Game logged" />
      <ReadOnlyRow
        label="Coach highlight" eventId={anchorId}
        present={!!gr?.coach_highlight}
        value={gr?.coach_highlight || (isLoading ? 'Loading…' : '—')}
        missing="No coach highlight logged" />
      <label>
        <span style={labelStyle}>Opponent highlights (optional)</span>
        <textarea value={v.opp_highlights} onChange={(e) => set({ opp_highlights: e.target.value })} style={{ ...textareaStyle, minHeight: 64 }} placeholder="#12 had a hot first half." />
      </label>
      <label>
        <span style={labelStyle}>Coach note (optional)</span>
        <textarea value={v.coach_note} onChange={(e) => set({ coach_note: e.target.value })} style={textareaStyle} placeholder="What I want the team thinking about until next practice…" />
      </label>
      {hasParentTournament && (
        <label>
          <span style={labelStyle}>League/bracket CTA label (optional)</span>
          <input type="text" value={v.tourney_link_label} onChange={(e) => set({ tourney_link_label: e.target.value })} style={inputStyle} placeholder="VIEW LEAGUE STANDINGS" />
          <span style={{ fontSize: 12, color: 'var(--as-text-tertiary)', marginTop: 4, display: 'block' }}>
            URL is pulled from this game's parent tournament/league SE Tourney link.
          </span>
        </label>
      )}
    </div>
  );
}
// Re-export for callers that import GameRecapNotPublishedError from this module path
export { GameRecapNotPublishedError };
