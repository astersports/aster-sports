// T1 voice-polish — one-tap "rewrite in our voice" on the composer. Operates on
// the CURRENT body_text (whatever the admin drafted or typed), independent of
// the AI-draft gist box. Facts-preserving rewrite via the existing
// briefing-ai-draft fn (mode: 'polish'); mutates body_text only, never sends.
// Self-gates: renders nothing until there's body text to polish.

import { Wand2 } from 'lucide-react';
import { useAiDraft } from '../../hooks/useAiDraft';

// Keys MUST match POLISH_STYLES in src/lib/briefings/aiDraftPrompt.js (the edge
// fn falls back to 'warmer' for an unknown key).
const STYLES = [
  { key: 'warmer', label: 'Warmer' },
  { key: 'shorter', label: 'Shorter' },
  { key: 'clearer', label: 'Clearer' },
];

const wrap = { display: 'flex', flexDirection: 'column', gap: 8, padding: 12, borderRadius: 10, border: '1px dashed var(--as-border-default)', backgroundColor: 'var(--as-bg-secondary)' };
const label = { fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--as-text-tertiary)', display: 'inline-flex', alignItems: 'center', gap: 6 };
const row = { display: 'flex', gap: 8, flexWrap: 'wrap' };
const btn = (on) => ({ minHeight: 44, padding: '0 14px', borderRadius: 10, border: '1.5px solid var(--as-accent)', background: 'transparent', color: 'var(--as-accent)', fontSize: 14, fontWeight: 600, cursor: on ? 'pointer' : 'not-allowed', opacity: on ? 1 : 0.5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' });
const hint = { fontSize: 12, color: 'var(--as-text-tertiary)', margin: 0, lineHeight: 1.4 };
const errBox = { margin: 0, padding: '8px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.4, backgroundColor: 'var(--as-danger-soft)', color: 'var(--as-danger)' };

export default function AiDraftPolish({ state, dispatch }) {
  const ai = useAiDraft();
  const bodyText = state.body?.body_text;
  if (!bodyText || !bodyText.trim()) return null;

  const onPolish = async (style) => {
    if (ai.loading) return;
    const teamId = state.audience_filter?.team_ids?.[0];
    const r = await ai.draft({
      kind: state.kind, mode: 'polish', polishBody: state.body.body_text, style,
      audience: teamId ? { team_id: teamId } : {},
    });
    if (r?.body) dispatch({ type: 'UPDATE_BODY', patch: { body_text: r.body } });
  };

  return (
    <div style={wrap}>
      <span style={label}><Wand2 size={13} strokeWidth={1.75} aria-hidden="true" /> Polish in your voice</span>
      <div style={row} role="group" aria-label="Polish the message">
        {STYLES.map(({ key, label: l }) => (
          <button key={key} type="button" className="as-press" style={btn(!ai.loading)}
            disabled={ai.loading} aria-label={`Make it ${l.toLowerCase()}`} onClick={() => onPolish(key)}>
            {ai.loading ? 'Polishing…' : l}
          </button>
        ))}
      </div>
      <p style={hint} aria-live="polite">Rewrites the message above in your org voice, keeping every fact unchanged. Review before sending.</p>
      {ai.error && <p style={errBox} role="alert" aria-live="assertive">{ai.error.message || "Couldn't polish that. Try again in a moment."}</p>}
    </div>
  );
}
