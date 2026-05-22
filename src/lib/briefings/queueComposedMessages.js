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
// Cutover PR 7b-2: pure builders moved to queueComposedMessagesBuilders.js
// to stay under the 150-line cap (CLAUDE.md §6). This file owns the
// orchestrator + Option A perRecipientSubstitutor callback application.
//
// Multi-team families on tournament fan-out are deduped to one row
// (first team wins; admin BCC handled the same way as queueRecipients).

import {
  ADMIN_BCC_EMAIL,
  buildAdminRow,
  buildFanoutRows,
  expandSliceToRows,
  renderBody,
} from './queueComposedMessagesBuilders';

export { buildFanoutRows } from './queueComposedMessagesBuilders';

export async function queueComposedMessages({ messageId, messages, testOnly, adminSample, perRecipientSubstitutor }) {
  if (!messageId) throw new Error('queueComposedMessages: missing messageId.');
  if (!Array.isArray(messages)) throw new TypeError('queueComposedMessages: messages must be an array.');
  if (!messages.length) throw new Error('queueComposedMessages: empty messages array.');
  for (const m of messages) {
    if (!m?.slice) throw new Error('queueComposedMessages: each message requires a slice.');
    if (!Array.isArray(m.content_sections)) throw new TypeError('queueComposedMessages: each message requires content_sections array.');
  }
  if (perRecipientSubstitutor !== undefined && typeof perRecipientSubstitutor !== 'function') {
    throw new TypeError('queueComposedMessages: perRecipientSubstitutor must be a function when provided.');
  }
  const familyRows = buildFanoutRows({ messageId, messages, testOnly });
  // adminSample lets the caller pin admin BCC to a different body than
  // messages[0] — used by rsvp_nudge to avoid leaking the first family's
  // signed RSVP token URLs into the admin BCC. When undefined, admin BCC
  // mirrors messages[0] (no-op for the 4 calendar-anchored kinds whose
  // content_sections is invariant across slices).
  const sampleSource = adminSample || messages[0];
  const sample = renderBody(sampleSource);
  const adminRow = buildAdminRow({ messageId, sample, familyRows });

  // Cutover PR 7b-2 (Option A): optional perRecipientSubstitutor lets
  // callers re-render each family row's body with per-recipient tokens
  // (feedback_survey, future per-recipient personalization). Admin BCC
  // row is intentionally EXCLUDED from substitution — admin sees the
  // placeholder body so they don't accidentally rate on behalf of the
  // first family. Mirrors the adminSample isolation pattern.
  const substitutedFamilyRows = perRecipientSubstitutor
    ? await Promise.all(familyRows.map(async (row) => {
      const next = await perRecipientSubstitutor(row);
      if (!next || typeof next !== 'object') {
        throw new Error('queueComposedMessages: perRecipientSubstitutor must return a row object.');
      }
      return next;
    }))
    : familyRows;

  const allRows = [...substitutedFamilyRows, ...(adminRow ? [adminRow] : [])];
  const { applyUnsubscribeUrls } = await import('../unsubscribeUrl');
  const { supabase } = await import('../supabase');
  const stamped = await applyUnsubscribeUrls(allRows);
  // Cutover PR 7b-2: strip transient __content_sections before INSERT —
  // comms_message_recipients has no such column.
  const clean = stamped.map((row) => {
    const { __content_sections, ...rest } = row;
    void __content_sections;
    return rest;
  });
  const { error } = await supabase.from('comms_message_recipients').insert(clean);
  if (error) throw error;
  return { audienceCount: substitutedFamilyRows.length, adminBcc: !!adminRow };
}

export const __test = { renderBody, expandSliceToRows, buildAdminRow, ADMIN_BCC_EMAIL };
