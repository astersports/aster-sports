// Wave 3.8 §5.2 — schedule_change send pipeline. Mirrors digestSend.js
// shape: insert one comms_messages row, queue per-recipient rows with
// rendered body, invoke send-tournament-message v13. Pilot mode gate
// applies automatically because v13 enforces it on every recipient
// with a non-null guardian_id.
//
// Audience: families whose team_ids include the affected event.team_id,
// scoped through get_digest_recipients(p_org_id, p_pilot_only=true)
// when org pilot mode is on. Defense in depth: the RPC + the edge
// function both filter to is_pilot_family=true under pilot.
//
// Audit row: caller (useScheduleChangeDispatch) writes the
// event_change_audit row and links dispatch_email_id once messageId
// returns.

import { supabase } from './supabase';
import { compose } from './engine/composer';

const ADMIN_BCC_EMAIL = 'admin@legacyhoopers.org';

function familyMatchesTeam(family, teamId) {
  if (!teamId) return true;
  return (family.team_ids || []).includes(teamId);
}

function buildSummaryLine(before, after) {
  if (!before?.start_at || !after?.start_at) return '';
  const opts = { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' };
  const oldFmt = new Date(before.start_at).toLocaleString('en-US', opts);
  const newFmt = new Date(after.start_at).toLocaleString('en-US', opts);
  return `${oldFmt} has moved to ${newFmt}.`;
}

function buildDiffFields(side, eventTitle) {
  return (vals) => {
    if (!vals) return null;
    const opts = { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
    return {
      label: eventTitle || null,
      time: vals.start_at ? new Date(vals.start_at).toLocaleString('en-US', opts) : null,
      location: vals.location || null,
    };
  };
}

export async function sendScheduleChange({
  orgId, event, before, after, signoffMessage, coaches,
  recipients, pilotModeEnabled, testOnly,
}) {
  if (!orgId) throw new Error('Missing orgId.');
  if (!event?.id) throw new Error('Missing event.');
  const teamId = event.team_id || null;
  const audience = (recipients || []).filter((f) => familyMatchesTeam(f, teamId));
  if (!audience.length && !testOnly) throw new Error('No families on this team.');

  const fields = buildDiffFields('before', event.title);
  const beforeFields = fields(before);
  const afterFields = fields(after);
  const summary = buildSummaryLine(before, after);

  const composed = compose({
    kind: 'schedule_change',
    data: { summary, before: beforeFields, after: afterFields, signoff_message: signoffMessage, coaches },
  });

  const { data: msg, error: msgErr } = await supabase
    .from('comms_messages')
    .insert({
      org_id: orgId, tournament_id: null, team_id: teamId,
      kind: 'schedule_change', language_code: 'en',
      delivery_method: 'queued', sent_at: null,
      subject: composed.subject,
      body_html: composed.html, body_plain: composed.plainText,
      headline: 'SCHEDULE UPDATE',
      content_sections: composed.sections || [],
      signoff_message: signoffMessage || null,
    })
    .select('id').single();
  if (msgErr) throw msgErr;

  const familyRows = testOnly ? [] : audience.map((f) => ({
    message_id: msg.id, guardian_id: f.guardian_id,
    email_at_send: f.email,
    delivery_method: 'resend_api', delivery_status: 'queued',
    body_html_rendered: composed.html, body_plain_rendered: composed.plainText,
    subject_rendered: composed.subject, teams_included: teamId ? [teamId] : [],
  }));
  const adminAlreadyIncluded = familyRows.some((r) => r.email_at_send === ADMIN_BCC_EMAIL);
  const adminRow = adminAlreadyIncluded ? null : {
    message_id: msg.id, guardian_id: null, email_at_send: ADMIN_BCC_EMAIL,
    delivery_method: 'resend_api', delivery_status: 'queued',
    body_html_rendered: composed.html, body_plain_rendered: composed.plainText,
    subject_rendered: composed.subject, teams_included: [],
  };
  const allRows = [...familyRows, ...(adminRow ? [adminRow] : [])];
  const { error: recErr } = await supabase.from('comms_message_recipients').insert(allRows);
  if (recErr) throw recErr;

  const { data: dispatch, error: dispErr } = await supabase.functions
    .invoke('send-tournament-message', { body: { message_id: msg.id } });
  if (dispErr) throw dispErr;

  return { messageId: msg.id, ...(dispatch || {}), audienceCount: audience.length, pilotModeEnabled: !!pilotModeEnabled };
}
