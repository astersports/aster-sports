// AI-1 free-form draft controls for BriefingNewPage. Presentational: the page
// owns useAiDraft + fills the Message body from the result (design lock:
// Draft/Redraft mutate the body only; Send stays submitBriefing). Admin types a
// quick gist; the AI writes the full announcement in the org voice. Redraft is a
// fresh take from the same gist (body edits are discarded, per the engine spec).

import { Sparkles } from 'lucide-react';

const label = { fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--as-text-tertiary)', display: 'block' };
const gistArea = { width: '100%', minHeight: 64, padding: 12, borderRadius: 10, fontSize: 15, fontFamily: 'inherit', lineHeight: 1.5, backgroundColor: 'var(--as-bg-card)', border: '1.5px solid var(--as-border-default)', color: 'var(--as-text-primary)' };
const btn = (on) => ({ minHeight: 44, padding: '0 14px', borderRadius: 10, border: '1.5px solid var(--as-accent)', background: 'transparent', color: 'var(--as-accent)', fontSize: 14, fontWeight: 600, cursor: on ? 'pointer' : 'not-allowed', opacity: on ? 1 : 0.5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 });
const warnBox = { margin: 0, padding: '8px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.4, listStyle: 'none', backgroundColor: 'var(--as-warning-soft)', color: 'var(--as-warning)' };
const errBox = { margin: 0, padding: '8px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.4, backgroundColor: 'var(--as-danger-soft)', color: 'var(--as-danger)' };
const wrap = { display: 'flex', flexDirection: 'column', gap: 8, padding: 12, borderRadius: 10, border: '1px dashed var(--as-border-default)', backgroundColor: 'var(--as-bg-secondary)' };

export default function AiDraftControls({ gist, onGistChange, onDraft, loading, warnings, error, hasDrafted }) {
  const canDraft = gist.trim().length > 0 && !loading;
  return (
    <div style={wrap}>
      <label htmlFor="ai-gist" style={label}>Draft with AI</label>
      <textarea
        id="ai-gist" value={gist} onChange={(e) => onGistChange(e.target.value)}
        placeholder="A quick note on what to say. The AI writes the full message in your voice."
        style={gistArea}
      />
      <button
        type="button" className="as-press" style={btn(canDraft)} disabled={!canDraft}
        onClick={() => onDraft(hasDrafted ? 'redraft' : 'draft')}
        aria-label={hasDrafted ? 'Redraft with AI' : 'Draft with AI'}
      >
        <Sparkles size={16} strokeWidth={1.75} />
        {loading ? 'Drafting...' : (hasDrafted ? 'Redraft' : 'Draft with AI')}
      </button>
      {error && <p style={errBox} role="alert" aria-live="assertive">{error.message || "Couldn't draft that. Try again in a moment."}</p>}
      {warnings?.length > 0 && (
        <ul style={warnBox} aria-live="polite">
          {warnings.map((w, i) => <li key={i}>{String(w)}</li>)}
        </ul>
      )}
    </div>
  );
}
