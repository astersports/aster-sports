// Wave 3.8 §5.2 — writes a row to event_change_audit and (optionally)
// triggers the schedule_change dispatch through send-tournament-message.
// Called from EventDetailPage's NotifyFamiliesPrompt after the wizard
// save succeeds.
//
// recordSkip(diff)             → audit row only, dispatch_email_id NULL
// recordAndDispatch(diff, opts) → dispatch first, then audit row with
//                                 dispatch_email_id populated. If
//                                 dispatch fails, audit row still
//                                 writes with NULL so we have a record.

import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { sendScheduleChange } from '../lib/scheduleChangeSend';

function changeKindOf(diff) {
  if (!diff) return 'other';
  if (diff.changeKind === 'time' || diff.changeKind === 'location') return diff.changeKind;
  return 'other';
}

export function useScheduleChangeAudit() {
  const { user, orgId } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const writeAudit = useCallback(async ({ diff, dispatchEmailId = null }) => {
    if (!user?.id || !orgId || !diff?.eventId) {
      throw new Error('Missing auth context or diff payload.');
    }
    const { error: err } = await supabase.from('event_change_audit').insert({
      org_id: orgId, event_id: diff.eventId, changed_by: user.id,
      change_kind: changeKindOf(diff),
      recurrence_scope: diff.scope,
      before_jsonb: diff.before || null,
      after_jsonb: diff.after || null,
      dispatch_email_id: dispatchEmailId,
    });
    if (err) throw err;
  }, [user?.id, orgId]);

  const recordSkip = useCallback(async (diff) => {
    setBusy(true); setError(null);
    try { await writeAudit({ diff, dispatchEmailId: null }); return { ok: true }; }
    catch (e) { setError(e); return { error: e }; }
    finally { setBusy(false); }
  }, [writeAudit]);

  const recordAndDispatch = useCallback(async (diff, dispatchOpts) => {
    setBusy(true); setError(null);
    let dispatchResult = null;
    let dispatchErr = null;
    try { dispatchResult = await sendScheduleChange(dispatchOpts); }
    catch (e) { dispatchErr = e; }
    try { await writeAudit({ diff, dispatchEmailId: dispatchResult?.messageId || null }); }
    catch (auditErr) {
      setError(auditErr);
      return { error: auditErr, dispatchError: dispatchErr };
    }
    if (dispatchErr) { setError(dispatchErr); return { error: dispatchErr }; }
    setBusy(false);
    return { ok: true, ...dispatchResult };
  }, [writeAudit]);

  return { busy, error, recordSkip, recordAndDispatch };
}
