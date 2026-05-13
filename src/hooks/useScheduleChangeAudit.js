// Wave 3.8 §5.2 — writes a row to event_change_audit and (optionally)
// triggers the schedule_change dispatch through send-tournament-message.
// Called from EventDetailPage's NotifyFamiliesPrompt after the wizard
// save succeeds.
//
// recordSkip(diff)              → audit row only, dispatch_email_id NULL
// recordAndDispatch(diff, state) → audit row FIRST (dispatch_email_id
//                                  NULL), then dispatch, then UPDATE
//                                  the audit row with the returned
//                                  message_id. Audit-before-dispatch
//                                  ordering is required because the
//                                  schedule_change resolver reads from
//                                  event_change_audit to compute the diff
//                                  (Wave 4.2-A-5 resolver contract).
//
// Wave 4.4-T0d: dispatch signature switched to {state, supabase, now}
// to match the registry-path other send pipelines (rsvpNudgeSend,
// academyCallupSend). The old compose({kind:'schedule_change'}) path
// threw silently for weeks because Wave 4.2-A-8a removed the entry from
// KIND_COMPOSERS without updating this file's caller.

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

  const writeAuditRow = useCallback(async ({ diff, dispatchEmailId = null }) => {
    if (!user?.id || !orgId || !diff?.eventId) {
      throw new Error('Missing auth context or diff payload.');
    }
    const { data, error: err } = await supabase.from('event_change_audit').insert({
      org_id: orgId, event_id: diff.eventId, changed_by: user.id,
      change_kind: changeKindOf(diff),
      recurrence_scope: diff.scope,
      before_jsonb: diff.before || null,
      after_jsonb: diff.after || null,
      dispatch_email_id: dispatchEmailId,
    }).select('id').single();
    if (err) throw err;
    return data?.id;
  }, [user, orgId]);

  const recordSkip = useCallback(async (diff) => {
    setBusy(true); setError(null);
    try { await writeAuditRow({ diff, dispatchEmailId: null }); return { ok: true }; }
    catch (e) { setError(e); return { error: e }; }
    finally { setBusy(false); }
  }, [writeAuditRow]);

  // Wave 4.4-T0d: audit-first ordering. Resolver reads from
  // event_change_audit, so the row must exist before dispatch. If
  // dispatch fails, the audit row is preserved with dispatch_email_id
  // NULL — admin can retry without losing the change record.
  const recordAndDispatch = useCallback(async (diff, state) => {
    setBusy(true); setError(null);
    let auditId = null;
    try { auditId = await writeAuditRow({ diff, dispatchEmailId: null }); }
    catch (e) { setError(e); setBusy(false); return { error: e }; }

    try {
      const dispatchResult = await sendScheduleChange({ state, supabase, now: new Date() });
      if (dispatchResult?.messageId && auditId) {
        await supabase.from('event_change_audit')
          .update({ dispatch_email_id: dispatchResult.messageId })
          .eq('id', auditId);
      }
      setBusy(false);
      return { ok: true, ...dispatchResult, auditId };
    } catch (dispatchErr) {
      setError(dispatchErr);
      setBusy(false);
      return { error: dispatchErr, auditId };
    }
  }, [writeAuditRow]);

  return { busy, error, recordSkip, recordAndDispatch };
}
