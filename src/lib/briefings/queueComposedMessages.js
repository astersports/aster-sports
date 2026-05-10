// Wave 4.2-A-8b-a — per-slice fan-out for the 4 composerSubmit
// calendar-anchored kinds (game_recap, tournament_prelim,
// tournament_recap, schedule_change). Each input message carries
// { slice, subject, content_sections }; the helper renders each
// body once, expands team slices to per-guardian rows, and inserts
// per-recipient comms_message_recipients rows with body_html_rendered
// keyed per recipient.
//
// Family slices (game_recap, schedule_change): one row per slice.
// Team slices (tournament_prelim, tournament_recap): N rows per
// slice, one per slice.recipient_guardians[i].
//
// Per the wave-locked contract, content_sections is invariant
// across slices for these 4 kinds, so per-slice fan-out produces
// identical bodies today. The win is architectural symmetry — when
// a future kind needs per-recipient personalization (e.g., kid name
// in subject), no further pipeline changes are required.
//
// Multi-team families on tournament fan-out are deduped to one row
// (first team wins; admin BCC handled the same way as queueRecipients).

import { renderSections, renderSectionsPlainText } from '../engine/composer';

const ADMIN_BCC_EMAIL = 'admin@legacyhoopers.org';
const HTML_OPEN = '<div style="max-width:600px;margin:0 auto;background-color:#ffffff;font-family:Inter,system-ui,sans-serif;padding:0 0 24px 0;">';
const HTML_CLOSE = '</div>';

function renderBody({ subject, content_sections }) {
  return {
    subject,
    body_html_rendered: HTML_OPEN + renderSections(content_sections) + HTML_CLOSE,
    body_plain_rendered: renderSectionsPlainText(content_sections),
  };
}

function expandSliceToRows(messageId, message, rendered) {
  const { slice } = message;
  const base = {
    message_id: messageId,
    delivery_method: 'resend_api',
    delivery_status: 'queued',
    body_html_rendered: rendered.body_html_rendered,
    body_plain_rendered: rendered.body_plain_rendered,
    subject_rendered: rendered.subject,
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
  const seen = new Set();
  const deduped = [];
  for (const row of allRows) {
    if (seen.has(row.guardian_id)) continue;
    seen.add(row.guardian_id);
    deduped.push(row);
  }
  return deduped;
}

function buildAdminRow({ messageId, sample, familyRows }) {
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

export async function queueComposedMessages({ messageId, messages, testOnly }) {
  if (!messageId) throw new Error('queueComposedMessages: missing messageId.');
  if (!Array.isArray(messages)) throw new TypeError('queueComposedMessages: messages must be an array.');
  if (!messages.length) throw new Error('queueComposedMessages: empty messages array.');
  for (const m of messages) {
    if (!m?.slice) throw new Error('queueComposedMessages: each message requires a slice.');
    if (!Array.isArray(m.content_sections)) throw new TypeError('queueComposedMessages: each message requires content_sections array.');
  }
  const familyRows = buildFanoutRows({ messageId, messages, testOnly });
  const sample = renderBody(messages[0]);
  const adminRow = buildAdminRow({ messageId, sample, familyRows });
  const allRows = [...familyRows, ...(adminRow ? [adminRow] : [])];
  const { applyUnsubscribeUrls } = await import('../unsubscribeUrl');
  const { supabase } = await import('../supabase');
  const stamped = await applyUnsubscribeUrls(allRows);
  const { error } = await supabase.from('comms_message_recipients').insert(stamped);
  if (error) throw error;
  return { audienceCount: familyRows.length, adminBcc: !!adminRow };
}

export const __test = { renderBody, expandSliceToRows, buildAdminRow, ADMIN_BCC_EMAIL };
