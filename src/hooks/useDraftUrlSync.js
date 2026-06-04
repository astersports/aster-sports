// Threads the autosave draft_id into the URL (?draft=<id>) as soon as the
// first save lands. Combined with useRouteMemory, this is what lets a PWA
// cold-launch resume an in-progress draft instead of dumping the user back to
// the home screen. Replace (don't push) so the browser back-button doesn't
// accumulate noise as the id appears.
// Extracted from BriefingComposer (P4) to keep that file under the 150-line cap.

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useDraftUrlSync(draftId) {
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (!draftId) return;
    if (searchParams.get('draft') === draftId) return;
    const next = new URLSearchParams(searchParams);
    next.set('draft', draftId);
    setSearchParams(next, { replace: true });
  }, [draftId, searchParams, setSearchParams]);
}
