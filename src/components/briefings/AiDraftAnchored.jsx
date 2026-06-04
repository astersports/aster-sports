// AI-2 (option i) — Draft with AI for anchored recap kinds. Resolves the GIVEN
// facts CLIENT-side (the same RESOLVER_REGISTRY path the preview runs), passes
// them to the briefing-ai-draft fn, and fills the kind's narrative override
// field with the AI voice prose. The structured stat block / game log render the
// facts; the AI writes the prose around them. Send stays submitBriefing.

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { RESOLVER_REGISTRY } from '../../lib/engine/resolvers/registry';
import { supabase } from '../../lib/supabase';
import { useAiDraft } from '../../hooks/useAiDraft';
import { AI_DRAFT_FIELD, anchoredFacts } from '../../lib/briefings/anchoredAiFacts';

const wrap = { display: 'flex', flexDirection: 'column', gap: 8, padding: 12, borderRadius: 10, border: '1px dashed var(--as-border-default)', backgroundColor: 'var(--as-bg-secondary)' };
const label = { fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--as-text-tertiary)' };
const btn = (on) => ({ minHeight: 36, padding: '0 12px', borderRadius: 8, border: '1.5px solid var(--as-accent)', background: 'transparent', color: 'var(--as-accent)', fontSize: 13, fontWeight: 600, cursor: on ? 'pointer' : 'wait', opacity: on ? 1 : 0.6, display: 'inline-flex', alignItems: 'center', gap: 6 });
const note = { fontSize: 12, color: 'var(--as-text-tertiary)', margin: 0, lineHeight: 1.4 };
const summary = { fontSize: 13, fontWeight: 600, color: 'var(--as-text-secondary)', margin: 0 };
const factRow = { display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12, padding: '2px 0' };
const warnBox = { margin: 0, padding: '8px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.4, listStyle: 'none', backgroundColor: 'var(--as-warning-soft)', color: 'var(--as-warning)' };
const errBox = { margin: 0, padding: '8px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.4, backgroundColor: 'var(--as-danger-soft)', color: 'var(--as-danger)' };

export default function AiDraftAnchored({ state, dispatch }) {
  const ai = useAiDraft();
  const [hasDrafted, setHasDrafted] = useState(false);
  const [sourceFacts, setSourceFacts] = useState(null);
  const [resolveErr, setResolveErr] = useState(null);
  const entry = RESOLVER_REGISTRY[state.kind];
  const field = AI_DRAFT_FIELD[state.kind];
  const anchor = entry ? entry.anchorFromState(state) : null;
  // Anchor readiness is kind-shaped: game_recap -> eventId, tournament_* ->
  // tournamentId, games_recap -> eventIds. Hide until the anchor is selected.
  const anchorReady = !!(anchor && (anchor.eventId || anchor.tournamentId || anchor.eventIds?.length));
  if (!entry || !field || !anchorReady) return null;

  const onDraft = async (mode) => {
    setResolveErr(null);
    let context;
    try {
      ({ context } = await entry.resolve(anchor, { supabase, now: new Date() }));
    } catch (e) {
      setResolveErr(e?.message || 'Could not load the facts for this briefing.');
      return;
    }
    const facts = anchoredFacts(state.kind, context);
    const teamId = state.audience_filter?.team_ids?.[0];
    const res = await ai.draft({ kind: state.kind, mode, facts, audience: teamId ? { team_id: teamId } : {} });
    if (res) {
      dispatch({ type: 'UPDATE_BODY', patch: { [field]: res.body } });
      setSourceFacts(facts);
      setHasDrafted(true);
    }
  };

  const factEntries = sourceFacts ? Object.entries(sourceFacts) : [];
  return (
    <div style={wrap}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={label}>Draft with AI</span>
        <button
          type="button" className="as-press" style={btn(!ai.loading)} disabled={ai.loading}
          onClick={() => onDraft(hasDrafted ? 'redraft' : 'draft')}
          aria-label={hasDrafted ? 'Redraft with AI' : 'Draft with AI'}
        >
          <Sparkles size={16} strokeWidth={1.75} />
          {ai.loading ? 'Drafting...' : (hasDrafted ? 'Redraft' : 'Draft with AI')}
        </button>
      </div>
      <p style={note}>Writes the coach narrative in your voice. The score and stats stay in the structured block; edit the result below.</p>
      {resolveErr && <p style={errBox} aria-live="polite">{resolveErr}</p>}
      {ai.error && <p style={errBox} aria-live="polite">{ai.error.message || "Couldn't draft that. Try again in a moment."}</p>}
      {ai.cardSummary && <p style={summary}>{ai.cardSummary}</p>}
      {factEntries.length > 0 && (
        <div aria-label="Facts used">
          {factEntries.map(([k, v]) => (
            <div key={k} style={factRow}><span style={{ color: 'var(--as-text-tertiary)' }}>{k}</span><span style={{ color: 'var(--as-text-primary)' }}>{String(v)}</span></div>
          ))}
        </div>
      )}
      {ai.warnings?.length > 0 && (
        <ul style={warnBox} aria-live="polite">{ai.warnings.map((w, i) => <li key={i}>{String(w)}</li>)}</ul>
      )}
    </div>
  );
}
