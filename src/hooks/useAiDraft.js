// AI-draft compose — the single client of the AI-draft compose edge function.
// Pre-written per AIDRAFT_BUILD_SPEC §2b as tested infra (no UI mount yet, so
// no AP #51 dead-mount breach — the mount lands in AI-1 once the edge fn is
// live). draft({ kind, mode, facts?, gist?, audience }) shapes the
// REQUEST per the §1 contract and parses the { body, card_summary, facts_used,
// warnings } RESPONSE. Parse / fence-strip / retry are SERVER-side; this hook
// consumes the JSON shape as-is and surfaces warnings (missing-fact blanks) to
// the caller. Prose only: no send, no DB write happens here (Send stays the
// unchanged submitBriefing path).

import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Slug of the AI-draft compose edge function (engine lane owns deploy).
// PENDING confirmation against the deployed slug when the engine lane reports
// it (spec seam 4a). Update this one constant on report; nothing else changes.
export const AI_DRAFT_FN_SLUG = 'briefing-ai-draft';

const EMPTY = { body: '', cardSummary: '', factsUsed: [], warnings: [] };

export function useAiDraft() {
  const { orgId } = useAuth();
  const [result, setResult] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const draft = useCallback(async ({ kind, mode, facts, gist, audience }) => {
    setLoading(true);
    setError(null);
    try {
      if (!orgId) throw new Error('No organization in context.');
      // Contract §1: org_id + kind + mode + audience always; then facts
      // (free-form/explicit) + gist (free-form only).
      const body = { org_id: orgId, kind, mode, audience };
      if (facts != null) body.facts = facts;
      if (gist != null) body.gist = gist;

      const { data, error: invErr } = await supabase.functions.invoke(AI_DRAFT_FN_SLUG, { body });
      // The edge fn returns { error } in the JSON body on 4xx/5xx, while
      // functions.invoke surfaces only a generic FunctionsHttpError — try the
      // body first, then the transport error (same shape as useImportSchedule).
      if (data?.error) throw new Error(data.error);
      if (invErr) throw invErr;

      const shaped = {
        body: data?.body ?? '',
        cardSummary: data?.card_summary ?? '',
        factsUsed: data?.facts_used ?? [],
        warnings: data?.warnings ?? [],
      };
      setResult(shaped);
      return shaped;
    } catch (e) {
      setError(e);
      return null;
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const reset = useCallback(() => { setResult(EMPTY); setError(null); }, []);

  return { draft, reset, ...result, loading, error };
}
