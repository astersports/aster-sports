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
// §4.AI cutover-gate rollback (2026-05-24): the optional
// perRecipientSubstitutor callback (Cutover PR 7b-2) is gone with the
// feedback_survey infrastructure. Restore as a clean extension point
// when a real per-recipient personalization use case lands.
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
import { applyUnsubscribeUrls } from '../unsubscribeUrl';
import { supabase } from '../supabase';

export { buildFanoutRows } from './queueComposedMessagesBuilders';

export async function queueComposedMessages({ messageId, messages, testOnly, adminSample }) {
  if (!messageId) throw new Error('queueComposedMessages: missing messageId.');
  if (!Array.isArray(messages)) throw new TypeError('queueComposedMessages: messages must be an array.');
  if (!messages.length) throw new Error('queueComposedMessages: empty messages array.');
  for (const m of messages) {
    if (!m?.slice) throw new Error('queueComposedMessages: each message requires a slice.');
    if (!Array.isArray(m.content_sections)) throw new TypeError('queueComposedMessages: each message requires content_sections array.');
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

  const allRows = [...familyRows, ...(adminRow ? [adminRow] : [])];
  // A.1.a-2 fix (2026-05-24): static import at top of file (not dynamic)
  // eliminates the Vite-chunk-load failure surface under PWA stale-cache
  // conditions per STATE_OF_AFFAIRS_L99_v6 §3.3.
  const stamped = await applyUnsubscribeUrls(allRows);
  // Strip transient __content_sections before INSERT — comms_message
  // _recipients has no such column.
  const clean = stamped.map((row) => {
    const { __content_sections, ...rest } = row;
    void __content_sections;
    return rest;
  });
  const { error } = await supabase.from('comms_message_recipients').insert(clean);
  if (error) throw error;
  return { audienceCount: familyRows.length, adminBcc: !!adminRow };
}

export const __test = { renderBody, expandSliceToRows, buildAdminRow, ADMIN_BCC_EMAIL };
