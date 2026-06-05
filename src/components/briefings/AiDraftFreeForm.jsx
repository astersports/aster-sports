// PR-B — free-form AI draft in the one-screen composer (re-homed from the
// retired BriefingNewPage). For free-form kinds (announcement, custom_message)
// the admin types a gist; "Draft with AI" fills the body_text in the org voice.
// Mirrors AiDraftAnchored (which handles the anchored recap kinds). Both
// self-gate by kind and mount together in StepBodySignoff. Send stays
// submitBriefing; this only mutates the body.

import { useState } from 'react';
import { useAiDraft } from '../../hooks/useAiDraft';
import { FREE_FORM_KINDS } from '../../lib/briefings/aiDraftPrompt';
import AiDraftControls from './AiDraftControls';

export default function AiDraftFreeForm({ state, dispatch }) {
  const ai = useAiDraft();
  const [gist, setGist] = useState('');
  const [hasDrafted, setHasDrafted] = useState(false);
  if (!FREE_FORM_KINDS.includes(state.kind)) return null;

  const onDraft = async (mode) => {
    const teamId = state.audience_filter?.team_ids?.[0];
    const facts = state.body?.headline ? { headline: state.body.headline } : undefined;
    const r = await ai.draft({ kind: state.kind, mode, gist, facts, audience: teamId ? { team_id: teamId } : {} });
    if (r) { dispatch({ type: 'UPDATE_BODY', patch: { body_text: r.body } }); setHasDrafted(true); }
  };

  return (
    <AiDraftControls
      gist={gist} onGistChange={setGist} onDraft={onDraft}
      loading={ai.loading} warnings={ai.warnings} error={ai.error} hasDrafted={hasDrafted}
    />
  );
}
