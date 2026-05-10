/* eslint-disable react-refresh/only-export-components */
// Wave 4.2-A-2 — game_recap body editor.
// Score / POG / coach_highlight are now read-only displays backed by
// game_results. Free-form fields (opp_highlights, coach_note,
// tourney_link_label) remain as textareas. If the score is not yet
// published, the editor renders an error with a Quick Score link.

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { fieldGap, inputStyle, labelStyle, textareaStyle } from './_styles';
import { supabase } from '../../../lib/supabase';

export const defaultValue = {
  score: { ours: '', theirs: '' },
  our_highlights: '', opp_highlights: '',
  player_of_game_name: '', coach_note: '',
  tourney_link_label: '',
};

export function validate(v) {
  const errs = [];
  if (!v?.our_highlights?.trim() && !v?.coach_note?.trim()) errs.push('Add at least one of: highlights, coach note.');
  return errs;
}

const cardStyle = { padding: 12, borderRadius: 10, backgroundColor: 'var(--em-bg-secondary)', border: '1px solid var(--em-border-default)' };
const valueStyle = { fontSize: 15, color: 'var(--em-text-primary)', fontWeight: 500 };
const mutedStyle = { fontSize: 13, color: 'var(--em-text-tertiary)' };
const editLink = { fontSize: 12, color: 'var(--em-accent)', textDecoration: 'none', marginLeft: 8 };

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
  const v = { ...defaultValue, ...(value || {}), score: { ...defaultValue.score, ...(value?.score || {}) } };
  const set = (patch) => onChange?.(patch);
  const [display, setDisplay] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unpublished, setUnpublished] = useState(false);
  const populatedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    populatedRef.current = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      if (!anchorId) { setDisplay(null); setUnpublished(false); setLoading(false); return; }
      setLoading(true); setUnpublished(false);
      const { data: ev } = await supabase.from('events').select('id, opponent, start_at, location, locations(name)').eq('id', anchorId).maybeSingle();
      const { data: gr } = await supabase.from('game_results').select('our_score, opponent_score, result, coach_highlight, player_of_game_id, published_at').eq('event_id', anchorId).maybeSingle();
      let pog = null;
      if (gr?.player_of_game_id) {
        const { data: p } = await supabase.from('players').select('first_name').eq('id', gr.player_of_game_id).maybeSingle();
        pog = p || null;
      }
      if (cancelled) return;
      setLoading(false);
      if (!gr || !gr.published_at) { setDisplay(null); setUnpublished(true); return; }
      setDisplay({ event: ev, game_result: gr, pog });
    });
    return () => { cancelled = true; };
  }, [anchorId]);

  // Auto-populate state.body from db so the legacy send path still
  // produces correct output. One-shot, guarded; user edits to
  // free-form fields stay intact.
  useEffect(() => {
    if (!display || populatedRef.current) return;
    populatedRef.current = true;
    const patch = {};
    if (display.game_result.our_score != null && display.game_result.opponent_score != null) {
      patch.score = { ours: display.game_result.our_score, theirs: display.game_result.opponent_score };
    }
    if (display.pog?.first_name) patch.player_of_game_name = display.pog.first_name;
    if (display.game_result.coach_highlight) patch.our_highlights = display.game_result.coach_highlight;
    if (Object.keys(patch).length) onChange?.(patch);
  }, [display, onChange]);

  if (unpublished) {
    return (
      <div style={{ ...cardStyle, borderColor: 'var(--em-warning)', backgroundColor: 'var(--em-warning-soft)' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--em-text-primary)' }}>Score not published yet</div>
        <div style={{ ...mutedStyle, marginTop: 4 }}>Publish via Quick Score first, then return here.</div>
        {anchorId && <Link to={`/events/${anchorId}/live`} style={{ ...editLink, marginLeft: 0, marginTop: 8, display: 'inline-block' }}>Open Quick Score →</Link>}
      </div>
    );
  }

  return (
    <div style={fieldGap}>
      <ReadOnlyRow
        label="Score" eventId={anchorId}
        present={display?.game_result?.our_score != null}
        value={display ? `${display.game_result.our_score} – ${display.game_result.opponent_score} (${display.game_result.result})` : (loading ? 'Loading…' : '—')}
        missing="No score logged" />
      <ReadOnlyRow
        label="Player of the Game" eventId={anchorId}
        present={!!display?.pog?.first_name}
        value={display?.pog?.first_name || (loading ? 'Loading…' : '—')}
        missing="No Player of the Game logged" />
      <ReadOnlyRow
        label="Coach highlight" eventId={anchorId}
        present={!!display?.game_result?.coach_highlight}
        value={display?.game_result?.coach_highlight || (loading ? 'Loading…' : '—')}
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
          <span style={{ fontSize: 12, color: 'var(--em-text-tertiary)', marginTop: 4, display: 'block' }}>
            URL is pulled from this game's parent tournament/league SE Tourney link.
          </span>
        </label>
      )}
    </div>
  );
}
