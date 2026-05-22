// Cutover PR 7b-2 — builders extracted from queueComposedMessages.js
// to keep the orchestrator under the 150-line cap (CLAUDE.md §6).
// Mirror of the 4.4-B helpers extraction pattern.
//
// Pure functions only. No DB / Supabase access. Re-exported via the
// orchestrator's __test bundle.

import { renderSections, renderSectionsPlainText } from '../engine/composer';

export const ADMIN_BCC_EMAIL = 'admin@legacyhoopers.org';
const HTML_OPEN = '<div style="max-width:600px;margin:0 auto;background-color:#ffffff;font-family:Inter,system-ui,sans-serif;padding:0 0 24px 0;">';
const HTML_CLOSE = '</div>';

export function renderBody({ subject, content_sections }) {
  return {
    subject,
    body_html_rendered: HTML_OPEN + renderSections(content_sections) + HTML_CLOSE,
    body_plain_rendered: renderSectionsPlainText(content_sections),
  };
}

export function expandSliceToRows(messageId, message, rendered) {
  const { slice, content_sections } = message;
  // Cutover PR 7b-2: __content_sections carries the pre-rendered section
  // array forward to perRecipientSubstitutor (which needs it to substitute
  // per-recipient tokens + re-render body). Underscore-prefixed key marks
  // it as transient; queueComposedMessages strips it before INSERT since
  // comms_message_recipients has no such column.
  const base = {
    message_id: messageId,
    delivery_method: 'resend_api',
    delivery_status: 'queued',
    body_html_rendered: rendered.body_html_rendered,
    body_plain_rendered: rendered.body_plain_rendered,
    subject_rendered: rendered.subject,
    __content_sections: content_sections,
  };
  if (slice.kind === 'family') {
    return [{ ...base, guardian_id: slice.guardian_id, email_at_send: slice.email, teams_included: slice.team_id ? [slice.team_id] : [] }];
  }
  if (slice.kind === 'team') {
    return (slice.recipient_guardians || []).map((g) => ({ ...base, guardian_id: g.guardian_id, email_at_send: g.email, teams_included: [slice.team_id] }));
  }
  throw new Error(`queueComposedMessages: unknown slice.kind '${slice?.kind}'`);
}

export function buildFanoutRows({ messageId, messages, testOnly }) {
  if (testOnly) return [];
  const allRows = [];
  for (const message of messages) {
    const rendered = renderBody(message);
    allRows.push(...expandSliceToRows(messageId, message, rendered));
  }
  // Wave 4.3-K: composite dedup key. Real guardians have unique guardian_id
  // (the primary key). Pilot-test synthetic rows have guardian_id=null and
  // share email_at_send=admin@ — they need a composite key over
  // (email_at_send, teams_included) so the 5 per-team synthetic rows fan
  // out into 5 distinct comms_message_recipients rows. Without this the
  // first row wins and the admin only sees one team's content per send.
  const seen = new Set();
  const deduped = [];
  for (const row of allRows) {
    const key = row.guardian_id != null
      ? `g:${row.guardian_id}`
      : `s:${row.email_at_send}:${(row.teams_included || []).join(',')}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }
  return deduped;
}

export function buildAdminRow({ messageId, sample, familyRows }) {
  if (familyRows.some((r) => r.email_at_send === ADMIN_BCC_EMAIL)) return null;
  return {
    message_id: messageId,
    guardian_id: null,
    email_at_send: ADMIN_BCC_EMAIL,
    delivery_method: 'resend_api',
    delivery_status: 'queued',
    body_html_rendered: sample.body_html_rendered,
    body_plain_rendered: sample.body_plain_rendered,
    subject_rendered: sample.subject,
    teams_included: [],
  };
}
