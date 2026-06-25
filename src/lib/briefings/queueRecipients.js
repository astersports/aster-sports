// Wave 4.1d-1 — comms_message_recipients row builder + insert.
//
// Mirrors the per-row shape produced by digestSend / scheduleChangeSend
// / rsvpNudgeSend (delivery_status='queued', body fields rendered,
// teams_included captured, admin BCC dedup), then runs the same
// applyUnsubscribeUrls token mint. The 5 generic kinds (game_recap,
// tournament_prelim, tournament_recap, announcement, custom_message)
// share one composed body across every guardian for v1 — per-recipient
// personalization (player_first_name etc.) is wave 4.2 templates work.
//
// testOnly=true skips family rows; admin BCC is always included so
// "Send test to admin@" returns at least one recipient and the edge
// function does not 400 with "No queued recipients".

// supabase + applyUnsubscribeUrls are loaded dynamically inside
// queueRecipients so the pure builders below stay importable in
// environments without VITE_SUPABASE_URL set (e.g. unit tests).
// (queueComposedMessagesBuilders is pure — no supabase — so importing the
// shared ADMIN_BCC_EMAIL constant statically preserves that importability.)

import { ADMIN_BCC_EMAIL } from './queueComposedMessagesBuilders';

function buildFamilyRows({ messageId, audience, composed, teamIds, testOnly }) {
  if (testOnly) return [];
  const teamsArr = teamIds || [];
  return (audience || []).map((f) => ({
    message_id: messageId,
    guardian_id: f.guardian_id,
    email_at_send: f.email,
    delivery_method: 'resend_api',
    delivery_status: 'queued',
    body_html_rendered: composed.html,
    body_plain_rendered: composed.plainText,
    subject_rendered: composed.subject,
    teams_included: teamsArr,
  }));
}

function buildAdminRow({ messageId, composed, familyRows }) {
  const alreadyIncluded = familyRows.some((r) => r.email_at_send === ADMIN_BCC_EMAIL);
  if (alreadyIncluded) return null;
  return {
    message_id: messageId,
    guardian_id: null,
    email_at_send: ADMIN_BCC_EMAIL,
    delivery_method: 'resend_api',
    delivery_status: 'queued',
    body_html_rendered: composed.html,
    body_plain_rendered: composed.plainText,
    subject_rendered: composed.subject,
    teams_included: [],
  };
}

export async function queueRecipients({ messageId, audience, composed, teamIds, testOnly }) {
  if (!messageId) throw new Error('queueRecipients: missing messageId.');
  if (!composed?.html) throw new Error('queueRecipients: composed body is empty.');
  const familyRows = buildFamilyRows({ messageId, audience, composed, teamIds, testOnly });
  const adminRow = buildAdminRow({ messageId, composed, familyRows });
  const allRows = [...familyRows, ...(adminRow ? [adminRow] : [])];
  const { applyUnsubscribeUrls } = await import('../unsubscribeUrl');
  const { supabase } = await import('../supabase');
  const stamped = await applyUnsubscribeUrls(allRows);
  const { error } = await supabase.from('comms_message_recipients').insert(stamped);
  if (error) throw error;
  return { audienceCount: familyRows.length, adminBcc: !!adminRow };
}

export const __test = { buildFamilyRows, buildAdminRow, ADMIN_BCC_EMAIL };
