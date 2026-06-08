// Pure send pipeline for weekly_digest. Mirrors useComposeBriefing's
// queue-then-dispatch shape: insert one comms_messages row, queue one
// per-family comms_message_recipients row with rendered body captured,
// invoke send-tournament-message edge function. Edge function is
// kind-agnostic — it reads body_html_rendered/body_plain_rendered/
// subject_rendered per recipient and falls back to message-level body
// when those are null.
//
// Wave 4.2-A-1: per-family compose now goes through the new resolver
// pair (resolveWeeklyDigest + composeWeeklyDigest) from
// src/lib/engine/resolvers/weeklyDigest.js. Caller still passes
// pre-fetched events/recipients/etc. for backward-compat with
// DigestComposer.jsx; we synthesize a context bundle from those args
// and call composeWeeklyDigest(context, slice, overrides) per family.
// renderedFamilies[0] is now deterministic by guardian_id ASC, which
// stabilizes the "sample" content_sections written to the message row.

import { supabase } from './supabase';
import { formatPeriodLabel } from './engine/digestPeriod';
import { applyUnsubscribeUrls } from './unsubscribeUrl';
import { buildContext, buildSlicesFromRecipients, renderSlice } from './digestSendHelpers';

const ADMIN_BCC_EMAIL = 'olivejuiceinc1@gmail.com';

export async function sendWeeklyDigest({
  orgId, period,
  bodyNotes, signoffMessage, opsNotes,
  signoffEnabled = false, signoffCoaches = null,
  recipients, events, tournaments, teams, coaches,
  rsvpCountsByEvent,
  testOnly,
  audienceTeamIds = null,
  audienceType = null, audienceFilter = null, anchorKind = null, anchorId = null, // C2: persist composer state
}) {
  if (!orgId) throw new Error('Missing orgId.');
  if (!period?.start || !period?.end) throw new Error('Pick a digest period.');
  if (!recipients?.length) throw new Error('No recipients available.');

  const context = buildContext({ orgId, period, events, teams, tournaments, coaches, rsvpCountsByEvent });
  // Wave 4.3-K: audience_team_ids threads through to the composer so per-team
  // anchored briefings (audience=team:X) intersect slice.team_ids with the
  // anchor before scoping body events. Without this a multi-team family or a
  // synthetic per-team test row would render whichever team_ids the slice
  // happens to carry, ignoring the anchor.
  const overrides = { body_notes: bodyNotes, signoff_message: signoffMessage, ops_notes: opsNotes, audience_team_ids: audienceTeamIds, signoff_enabled: signoffEnabled === true, signoff_coaches: Array.isArray(signoffCoaches) ? signoffCoaches : [] };
  const slices = buildSlicesFromRecipients(recipients);
  const renderedFamilies = slices
    .map((slice) => {
      // Apply audience anchor intersection at the slice level for the
      // hasEvents short-circuit, so per-team-anchored sends correctly drop
      // recipients whose team_ids don't overlap the anchor.
      const effectiveTeamIds = audienceTeamIds && audienceTeamIds.length
        ? (slice.team_ids || []).filter((t) => audienceTeamIds.includes(t))
        : (slice.team_ids || []);
      const teamSet = new Set(effectiveTeamIds);
      const hasEvents = (context.events || []).some((e) => teamSet.has(e.team_id));
      if (!hasEvents) return null;
      return { family: slice, ...renderSlice(context, slice, overrides) };
    })
    .filter(Boolean);

  // Sample any composed family for message-level placeholders.
  const sample = renderedFamilies[0];
  const subject = sample?.subject || `Week ahead: ${formatPeriodLabel(period)}`;

  const periodStart = period.start.toISOString().slice(0, 10);
  const { data: msg, error: msgErr } = await supabase
    .from('comms_messages')
    .insert({
      org_id: orgId, tournament_id: null, team_id: null,
      kind: 'weekly_digest', language_code: 'en',
      delivery_method: 'queued', sent_at: null, status: 'draft',
      audience_type: audienceType, audience_filter: audienceFilter, anchor_kind: anchorKind, anchor_id: anchorId,
      subject, body_html: sample?.html || '', body_plain: sample?.plainText || '',
      headline: 'WEEK AHEAD', sub_context: formatPeriodLabel(period),
      content_sections: sample?.sections || [],
      body_notes: bodyNotes || null, signoff_message: signoffMessage || null,
      period_start: periodStart,
      period_end: period.end.toISOString().slice(0, 10),
    })
    .select('id').single();
  // D-1(c) BUG A second half: race-resolved-other-tick-won. Mirrors the
  // pattern in briefing-auto-draft-tick/index.ts:73-78. After D-1(a)
  // narrowed comms_messages_weekly_digest_unique to status IN
  // (scheduled, queued, sent), the only remaining 23505 path on this
  // INSERT is "a digest for this period was already sent / scheduled."
  // Surface that as a structured DigestAlreadySentError so callers can
  // render kindness microcopy instead of the raw Postgres text.
  if (msgErr && msgErr.code === '23505') {
    const err = new Error(`A weekly digest for the period starting ${periodStart} is already scheduled or sent. Open it from the inbox to view or resend.`);
    err.code = 'DIGEST_ALREADY_SENT';
    err.period_start = periodStart;
    throw err;
  }
  if (msgErr) throw msgErr;

  // Build per-recipient queue rows. In test mode, only admin@ row is queued.
  // Wave 4.3-K carve-out: when ALL families are synthetic, testOnly is a no-op
  // (synthetic rows ARE the test send). E1: explicit is_synthetic flag.
  const allSynthetic = renderedFamilies.length > 0 && renderedFamilies.every((f) => f.family.is_synthetic === true);
  const effectiveTestOnly = testOnly && !allSynthetic;
  const familyRows = effectiveTestOnly ? [] : renderedFamilies.map((f) => ({
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
  const stampedRows = await applyUnsubscribeUrls(allRows);
  const { error: recErr } = await supabase.from('comms_message_recipients').insert(stampedRows);
  if (recErr) throw recErr;

  const { data: dispatch, error: dispErr } = await supabase.functions
    .invoke('send-tournament-message', { body: { message_id: msg.id } });
  if (dispErr) throw dispErr;
  // F-DUAL-FINALIZE (G5 PR 0): send-tournament-message owns the terminal
  // status='sent' write (service role, authoritative). The old client-side
  // status='sent' here force-finalized even a partial send (ok:false), which
  // then 409-locked the message's own recovery (alreadySent guard). Drop the
  // write; surface ok:false like the main path (composerSubmit).
  if (dispatch && dispatch.ok === false) {
    throw new Error(dispatch.errors?.join('; ') || 'Dispatch reported failure.');
  }

  return { messageId: msg.id, ...(dispatch || {}), composedFamilies: renderedFamilies.length };
}
