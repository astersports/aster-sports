import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

// Orchestrates the queue-then-dispatch flow:
//   1. INSERT one comms_messages row (delivery_method='queued', sent_at=null)
//   2. INSERT one comms_message_recipients row per address (status='queued')
//   3. POST { message_id } to the send-tournament-message edge function
// On success the dispatcher flips sent_at and recipient.delivery_status.
export function useComposeBriefing() {
  const [sending, setSending] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);

  const send = useCallback(async ({
    orgId,
    tournamentId,
    teamId,
    messageType,
    subject,
    html,
    plainText,
    recipients,
    coachUserIds,
  }) => {
    setSending(true); setError(null); setResult(null);
    try {
      if (!orgId)         throw new Error('Missing orgId.');
      if (!messageType)   throw new Error('Pick a message type before sending.');
      if (!recipients?.length) throw new Error('No recipients selected.');

      const { data: msg, error: msgErr } = await supabase
        .from('comms_messages')
        .insert({
          org_id: orgId,
          tournament_id: tournamentId || null,
          team_id: teamId || null,
          subject,
          body_html: html,
          body_plain: plainText,
          kind: messageType,
          language_code: 'en',
          delivery_method: 'queued',
          sent_at: null,
          coach_user_ids: coachUserIds && coachUserIds.length ? coachUserIds : null,
        })
        .select('id')
        .single();
      if (msgErr) throw msgErr;

      const recipientRows = recipients.map((r) => ({
        message_id: msg.id,
        email_at_send: r.email,
        delivery_method: 'resend_api',
        delivery_status: 'queued',
      }));
      const { error: recErr } = await supabase
        .from('comms_message_recipients')
        .insert(recipientRows);
      if (recErr) throw recErr;

      const { data: dispatch, error: dispErr } = await supabase.functions
        .invoke('send-tournament-message', { body: { message_id: msg.id } });
      if (dispErr) throw dispErr;

      const final = { messageId: msg.id, ...(dispatch || {}) };
      setResult(final);
      return final;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setSending(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null); setError(null);
  }, []);

  return { send, sending, result, error, reset };
}
