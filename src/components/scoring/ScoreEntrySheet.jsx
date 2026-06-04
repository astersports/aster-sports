import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import ConfirmDialog from '../shared/ConfirmDialog';
import useScoreDraft from '../../hooks/useScoreDraft';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import QuarterScoreInput from './QuarterScoreInput';
import PlayerOfGamePicker from './PlayerOfGamePicker';
import OpponentInlineField from './OpponentInlineField';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' });
}

function SaveBadge({ state }) {
  const s = { fontSize: 13, fontStyle: 'italic' };
  if (state === 'saving') return <span style={{ ...s, color: 'var(--as-text-secondary)' }}>Saving…</span>;
  if (state === 'saved') return <span style={{ ...s, color: 'var(--as-success)' }}>Saved</span>;
  if (state === 'error') return <span style={{ ...s, color: 'var(--as-danger)' }}>Error</span>;
  if (state === 'dirty') return <span style={{ ...s, color: 'var(--as-warning)' }}>Unsaved</span>;
  return null;
}

const numInput = { width: '100%', minHeight: 52, padding: '0 14px', borderRadius: 10, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', color: 'var(--as-text-primary)', fontSize: 28, fontWeight: 700, fontFamily: 'inherit', textAlign: 'center' };
const lbl = { fontSize: 13, fontWeight: 500, color: 'var(--as-text-primary)', marginBottom: 6 };
const btn44 = { minHeight: 44, borderRadius: 10, fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' };

export default function ScoreEntrySheet({ event, team, onClose }) {
  const draft = useScoreDraft(event.id);
  const trapRef = useFocusTrap(true);
  const [confirmAction, setConfirmAction] = useState(null);
  // Opponent tracked in state so the inline setter (below) unblocks
  // Publish immediately after writing back to the event — no reopen.
  const [opponentName, setOpponentName] = useState(event.opponent || '');

  const handleDismiss = useCallback(() => {
    if (draft.state === 'dirty' || draft.state === 'saving') {
      setConfirmAction({ type: 'discard' });
      return;
    }
    onClose();
  }, [draft.state, onClose]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handleDismiss(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleDismiss]);

  // 2026-05-20 — opponent gate. Frank flagged on Records: 10U Black W
  // 37-30 TBD May 17 (game scored with blank opponent). Publish still
  // requires an opponent, but 2026-05-24 the dead-end ("leave and edit
  // the event") was replaced with an inline setter (OpponentInlineField)
  // so a new user can set it without leaving the sheet.
  const hasOpponent = !!(opponentName && opponentName.trim());
  const canPublish = draft.result.our_score != null && draft.result.opponent_score != null
    && hasOpponent && !draft.isPublished;

  const handlePublish = async () => { try { await draft.publish(); } catch { /* error in draft.error */ } };

  const numChange = (field) => (e) => draft.updateField(field, e.target.value === '' ? null : Number(e.target.value));

  return createPortal(
    <div ref={trapRef} role="dialog" aria-modal="true" aria-label={`Score entry vs ${opponentName || 'opponent'}`}
      style={{ position: 'fixed', inset: 0, background: 'var(--as-bg-page)', zIndex: 50, display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 4, background: team?.team_color || 'var(--as-accent)' }} />
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)', gap: 12 }}>
        <button type="button" onClick={handleDismiss} aria-label="Close" className="as-press" style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none' }}>
          <X size={20} strokeWidth={1.75} color="var(--as-text-primary)" />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--as-text-primary)' }}>vs {opponentName || 'Opponent'}</div>
          <div style={{ fontSize: 13, color: 'var(--as-text-secondary)' }}>{formatDate(event.start_at)}</div>
        </div>
        <SaveBadge state={draft.state} />
      </div>

      <main style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', WebkitOverflowScrolling: 'touch' }}>
        {!hasOpponent && (
          <OpponentInlineField eventId={event.id} onSaved={setOpponentName} />
        )}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <label style={{ flex: 1 }}>
            <div style={lbl}>Our Score</div>
            <input type="number" inputMode="numeric" pattern="[0-9]*" value={draft.result.our_score ?? ''} onChange={numChange('our_score')} disabled={draft.isPublished} style={numInput} />
          </label>
          <label style={{ flex: 1 }}>
            <div style={lbl}>Opponent</div>
            <input type="number" inputMode="numeric" pattern="[0-9]*" value={draft.result.opponent_score ?? ''} onChange={numChange('opponent_score')} disabled={draft.isPublished} style={numInput} />
          </label>
        </div>

        {draft.result.result && (
          <div style={{ padding: 12, background: 'var(--as-bg-card)', borderRadius: 8, marginBottom: 24, fontSize: 15, fontWeight: 600, color: draft.result.result === 'W' ? 'var(--as-success)' : draft.result.result === 'L' ? 'var(--as-danger)' : 'var(--as-text-primary)', textAlign: 'center' }}>
            {draft.result.result === 'W' ? 'Win' : draft.result.result === 'L' ? 'Loss' : 'Tie'} ({draft.result.point_differential > 0 ? '+' : ''}{draft.result.point_differential})
          </div>
        )}

        {draft.isPublished && (
          <div style={{ padding: 12, marginBottom: 24, background: 'var(--as-info-soft)', borderLeft: '3px solid var(--as-info)', borderRadius: 8, fontSize: 13, color: 'var(--as-text-primary)', lineHeight: 1.4 }} role="status">
            Published. A recap will be drafted in Briefings for an admin to review and send.
          </div>
        )}

        <QuarterScoreInput value={draft.result.quarter_scores} onChange={qs => draft.updateField('quarter_scores', qs)} disabled={draft.isPublished} />
        <PlayerOfGamePicker teamId={event.team_id} value={draft.result.player_of_game_id} onChange={pid => draft.updateField('player_of_game_id', pid)} disabled={draft.isPublished} />

        <label style={{ display: 'block', marginTop: 24 }}>
          <div style={lbl}>Coach Highlight (optional)</div>
          <textarea maxLength={140} value={draft.result.coach_highlight ?? ''} onChange={e => draft.updateField('coach_highlight', e.target.value || null)} disabled={draft.isPublished} placeholder="One line for parents — what stood out?"
            style={{ width: '100%', minHeight: 60, padding: 12, border: '1px solid var(--as-border-default)', borderRadius: 8, fontFamily: 'inherit', fontSize: 15, color: 'var(--as-text-primary)', background: 'var(--as-bg-card)', resize: 'vertical' }} />
          <div style={{ fontSize: 11, color: 'var(--as-text-tertiary)', marginTop: 4, textAlign: 'right' }}>{(draft.result.coach_highlight ?? '').length}/140</div>
        </label>

        {draft.state === 'error' && (
          <div style={{ marginTop: 16, padding: 12, background: 'var(--as-bg-card)', borderLeft: '4px solid var(--as-danger)', borderRadius: 6, fontSize: 15, color: 'var(--as-text-primary)' }}>
            Save failed. <button type="button" onClick={draft.retry} style={{ marginLeft: 12, color: 'var(--as-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Retry</button>
          </div>
        )}
      </main>

      <footer style={{ display: 'flex', gap: 12, padding: '16px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)', borderTop: '1px solid var(--as-border-subtle)' }}>
        <button type="button" onClick={handleDismiss} className="as-press" style={{ ...btn44, flex: 1, background: 'none', border: '1px solid var(--as-border-default)', color: 'var(--as-text-secondary)' }}>Close</button>
        {!draft.isPublished && <button type="button" onClick={handlePublish} disabled={!canPublish} className="as-press" style={{ ...btn44, flex: 1, border: 'none', backgroundColor: canPublish ? 'var(--as-accent)' : 'var(--as-bg-secondary)', color: canPublish ? 'var(--as-text-inverse)' : 'var(--as-text-tertiary)' }}>Publish</button>}
        {draft.isPublished && (
          <button type="button" onClick={() => setConfirmAction({ type: 'unpublish' })} className="as-press" style={{ ...btn44, flex: 1, border: '1px solid var(--as-border-default)', background: 'none', color: 'var(--as-warning)' }}>Unpublish</button>
        )}
      </footer>
      {confirmAction?.type === 'discard' && (
        <ConfirmDialog title="Discard Changes" message="Discard unsaved changes?" confirmLabel="Discard" destructive onConfirm={() => { setConfirmAction(null); onClose(); }} onCancel={() => setConfirmAction(null)} />
      )}
      {confirmAction?.type === 'unpublish' && (
        <ConfirmDialog title="Unpublish Score" message="This will hide the score from parents. You can edit and re-publish." confirmLabel="Unpublish" destructive onConfirm={async () => { setConfirmAction(null); await draft.unpublish(); }} onCancel={() => setConfirmAction(null)} />
      )}
    </div>,
    document.body,
  );
}
