import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import ConfirmDialog from '../shared/ConfirmDialog';
import useScoreDraft from '../../hooks/useScoreDraft';
import QuarterScoreInput from './QuarterScoreInput';
import PlayerOfGamePicker from './PlayerOfGamePicker';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatRelative(iso) {
  if (!iso) return '';
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function SaveBadge({ state }) {
  const s = { fontSize: 13, fontStyle: 'italic' };
  if (state === 'saving') return <span style={{ ...s, color: 'var(--em-text-secondary)' }}>Saving…</span>;
  if (state === 'saved') return <span style={{ ...s, color: 'var(--em-success)' }}>Saved</span>;
  if (state === 'error') return <span style={{ ...s, color: 'var(--em-danger)' }}>Error</span>;
  if (state === 'dirty') return <span style={{ ...s, color: 'var(--em-warning)' }}>Unsaved</span>;
  return null;
}

const numInput = { width: '100%', minHeight: 52, padding: '0 14px', borderRadius: 10, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-primary)', fontSize: 28, fontWeight: 700, fontFamily: 'inherit', textAlign: 'center' };
const lbl = { fontSize: 13, fontWeight: 500, color: 'var(--em-text-primary)', marginBottom: 6 };
const btn44 = { minHeight: 44, borderRadius: 10, fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' };

export default function ScoreEntrySheet({ event, team, onClose }) {
  const draft = useScoreDraft(event.id);
  const [confirmAction, setConfirmAction] = useState(null);

  const handleDismiss = useCallback(() => {
    if (draft.state === 'dirty' || draft.state === 'saving') {
      setConfirmAction({ type: 'discard' });
      return;
    }
    onClose();
  }, [draft.state, onClose]);

  const canPublish = draft.result.our_score != null && draft.result.opponent_score != null && !draft.isPublished;

  const handlePublish = async () => { try { await draft.publish(); } catch { /* error in draft.error */ } };

  const numChange = (field) => (e) => draft.updateField(field, e.target.value === '' ? null : Number(e.target.value));

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'var(--em-bg-page)', zIndex: 50, display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 4, background: team?.team_color || 'var(--em-accent)' }} />
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)', gap: 12 }}>
        <button type="button" onClick={handleDismiss} aria-label="Close" className="sf-press" style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none' }}>
          <X size={20} strokeWidth={1.75} color="var(--em-text-primary)" />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)' }}>vs {event.opponent || 'Opponent'}</div>
          <div style={{ fontSize: 13, color: 'var(--em-text-secondary)' }}>{formatDate(event.start_at)}</div>
        </div>
        <SaveBadge state={draft.state} />
      </div>

      <main style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', WebkitOverflowScrolling: 'touch' }}>
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
          <div style={{ padding: 12, background: 'var(--em-bg-card)', borderRadius: 8, marginBottom: 24, fontSize: 15, fontWeight: 600, color: draft.result.result === 'W' ? 'var(--em-success)' : draft.result.result === 'L' ? 'var(--em-danger)' : 'var(--em-text-primary)', textAlign: 'center' }}>
            {draft.result.result === 'W' ? 'Win' : draft.result.result === 'L' ? 'Loss' : 'Tie'} ({draft.result.point_differential > 0 ? '+' : ''}{draft.result.point_differential})
          </div>
        )}

        <QuarterScoreInput value={draft.result.quarter_scores} onChange={qs => draft.updateField('quarter_scores', qs)} disabled={draft.isPublished} />
        <PlayerOfGamePicker teamId={event.team_id} value={draft.result.player_of_game_id} onChange={pid => draft.updateField('player_of_game_id', pid)} disabled={draft.isPublished} />

        <label style={{ display: 'block', marginTop: 24 }}>
          <div style={lbl}>Coach Highlight (optional)</div>
          <textarea maxLength={140} value={draft.result.coach_highlight ?? ''} onChange={e => draft.updateField('coach_highlight', e.target.value || null)} disabled={draft.isPublished} placeholder="One line for parents — what stood out?"
            style={{ width: '100%', minHeight: 60, padding: 12, border: '1px solid var(--em-border-default)', borderRadius: 8, fontFamily: 'inherit', fontSize: 15, color: 'var(--em-text-primary)', background: 'var(--em-bg-card)', resize: 'vertical' }} />
          <div style={{ fontSize: 11, color: 'var(--em-text-tertiary)', marginTop: 4, textAlign: 'right' }}>{(draft.result.coach_highlight ?? '').length}/140</div>
        </label>

        {draft.state === 'error' && (
          <div style={{ marginTop: 16, padding: 12, background: 'var(--em-bg-card)', borderLeft: '4px solid var(--em-danger)', borderRadius: 6, fontSize: 15, color: 'var(--em-text-primary)' }}>
            Save failed. <button type="button" onClick={draft.retry} style={{ marginLeft: 12, color: 'var(--em-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Retry</button>
          </div>
        )}
      </main>

      <footer style={{ display: 'flex', gap: 12, padding: '16px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)', borderTop: '1px solid var(--em-border-subtle)' }}>
        <button type="button" onClick={handleDismiss} className="sf-press" style={{ ...btn44, flex: 1, background: 'none', border: '1px solid var(--em-border-default)', color: 'var(--em-text-secondary)' }}>Close</button>
        {!draft.isPublished && <button type="button" onClick={handlePublish} disabled={!canPublish} className="sf-press" style={{ ...btn44, flex: 1, border: 'none', backgroundColor: canPublish ? 'var(--em-accent)' : 'var(--em-bg-secondary)', color: canPublish ? 'var(--em-text-inverse)' : 'var(--em-text-tertiary)' }}>Publish</button>}
        {draft.isPublished && <span style={{ padding: '12px 16px', fontSize: 15, color: 'var(--em-success)', fontWeight: 500 }}>Published {formatRelative(draft.result.published_at)}</span>}
      </footer>
      {confirmAction?.type === 'discard' && (
        <ConfirmDialog title="Discard Changes" message="Discard unsaved changes?" confirmLabel="Discard" destructive onConfirm={() => { setConfirmAction(null); onClose(); }} onCancel={() => setConfirmAction(null)} />
      )}
    </div>,
    document.body,
  );
}
