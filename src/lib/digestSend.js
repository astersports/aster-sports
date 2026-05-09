// Pure send pipeline for weekly_digest. Mirrors useComposeBriefing's
// queue-then-dispatch shape: insert one comms_messages row, queue one
// per-family comms_message_recipients row with rendered body captured,
// invoke send-tournament-message edge function. Edge function is
// kind-agnostic — it reads body_html_rendered/body_plain_rendered/
// subject_rendered per recipient and falls back to message-level body
// when those are null.

import { supabase } from './supabase';
import { compose } from './engine/composer';
import { formatPeriodLabel } from './engine/digestPeriod';

const ADMIN_BCC_EMAIL = 'admin@legacyhoopers.org';

function eventsForFamily(family, eventsByTeam) {
  const seen = new Set();
  const out = [];
  for (const teamId of family.team_ids || []) {
    for (const ev of eventsByTeam.get(teamId) || []) {
      if (seen.has(ev.id)) continue;
      seen.add(ev.id);
      out.push(ev);
    }
  }
  return out;
}

export async function sendWeeklyDigest({
  orgId, period,
  bodyNotes, signoffMessage, opsNotes,
  recipients, events, tournaments, teams, coaches,
  testOnly,
}) {
  if (!orgId) throw new Error('Missing orgId.');
  if (!period?.start || !period?.end) throw new Error('Pick a digest period.');
  if (!recipients?.length) throw new Error('No recipients available.');

  const eventsByTeam = new Map();
  for (const ev of events || []) {
    const arr = eventsByTeam.get(ev.team_id) || [];
    arr.push(ev);
    eventsByTeam.set(ev.team_id, arr);
  }

  // Per-family compose. Drop families with zero events (D6).
  const renderedFamilies = (recipients || [])
    .map((family) => {
      const famEvents = eventsForFamily(family, eventsByTeam);
      if (!famEvents.length) return null;
      const result = compose({
        kind: 'weekly_digest',
        data: { family, events: famEvents, period, teams, tournaments, body_notes: bodyNotes, signoff_message: signoffMessage, ops_notes: opsNotes, coaches },
      });
      return { family, ...result };
    })
    .filter(Boolean);

  // Sample any composed family for message-level placeholders.
  const sample = renderedFamilies[0];
  const subject = sample?.subject || `Week ahead — ${formatPeriodLabel(period)}`;

  const { data: msg, error: msgErr } = await supabase
    .from('comms_messages')
    .insert({
      org_id: orgId, tournament_id: null, team_id: null,
      kind: 'weekly_digest', language_code: 'en',
      delivery_method: 'queued', sent_at: null,
      subject, body_html: sample?.html || '', body_plain: sample?.plainText || '',
      headline: 'WEEK AHEAD', sub_context: formatPeriodLabel(period),
      content_sections: sample?.sections || [],
      body_notes: bodyNotes || null, signoff_message: signoffMessage || null,
      period_start: period.start.toISOString().slice(0, 10),
      period_end: period.end.toISOString().slice(0, 10),
    })
    .select('id').single();
  if (msgErr) throw msgErr;

  // Build per-recipient queue rows. In test mode, only admin@ row is queued.
  const familyRows = testOnly ? [] : renderedFamilies.map((f) => ({
    message_id: msg.id, guardian_id: f.family.guardian_id,
    email_at_send: f.family.email,
    delivery_method: 'resend_api', delivery_status: 'queued',
    body_html_rendered: f.html, body_plain_rendered: f.plainText,
    subject_rendered: f.subject, teams_included: f.teams_included,
  }));
  const adminAlreadyIncluded = familyRows.some((r) => r.email_at_send === ADMIN_BCC_EMAIL);
  const adminRow = adminAlreadyIncluded ? null : {
    message_id: msg.id, guardian_id: null,
    email_at_send: ADMIN_BCC_EMAIL,
    delivery_method: 'resend_api', delivery_status: 'queued',
    body_html_rendered: sample?.html || '', body_plain_rendered: sample?.plainText || '',
    subject_rendered: subject, teams_included: [],
  };
  const allRows = [...familyRows, ...(adminRow ? [adminRow] : [])];
  const { error: recErr } = await supabase.from('comms_message_recipients').insert(allRows);
  if (recErr) throw recErr;

  const { data: dispatch, error: dispErr } = await supabase.functions
    .invoke('send-tournament-message', { body: { message_id: msg.id } });
  if (dispErr) throw dispErr;

  return { messageId: msg.id, ...(dispatch || {}), composedFamilies: renderedFamilies.length };
}
