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
import { renderSections, renderSectionsPlainText } from './engine/composer';
import { formatPeriodLabel } from './engine/digestPeriod';
import { composeWeeklyDigest } from './engine/resolvers/weeklyDigest';
import { applyUnsubscribeUrls } from './unsubscribeUrl';

const ADMIN_BCC_EMAIL = 'admin@legacyhoopers.org';
const ORG_NAME_DEFAULT = 'Legacy Hoopers';
const ORG_WEBSITE_DEFAULT = 'https://www.legacyhoopers.org/';
const ORG_CONTACT_DEFAULT = 'info@legacyhoopers.org';
const ORG_LOGO_DEFAULT = 'https://skyfire-app.vercel.app/knight-logo-240.png';

function buildContext({ orgId, period, events, teams, tournaments, coaches, rsvpCountsByEvent }) {
  const counts = rsvpCountsByEvent instanceof Map ? rsvpCountsByEvent : new Map(Object.entries(rsvpCountsByEvent || {}));
  return {
    org: {
      id: orgId, name: ORG_NAME_DEFAULT,
      branding: { eyebrowLink: ORG_WEBSITE_DEFAULT, contactEmail: ORG_CONTACT_DEFAULT, logoUrl: ORG_LOGO_DEFAULT },
      voice_config: null, brand_colors: null,
      coaches: coaches || [],
    },
    period: { start: period.start, end: period.end, label: formatPeriodLabel(period) },
    events: events || [], teams: teams || [], tournaments: tournaments || [],
    rsvpCountsByEvent: counts,
  };
}

function buildSlicesFromRecipients(recipients) {
  return (recipients || [])
    .map((r) => ({ kind: 'family', guardian_id: r.guardian_id, email: r.email, kid_first_names: r.kid_first_names || [], team_ids: (r.team_ids || []).slice() }))
    .sort((a, b) => (a.guardian_id < b.guardian_id ? -1 : a.guardian_id > b.guardian_id ? 1 : 0));
}

function renderSlice(context, slice, overrides) {
  const { subject, content_sections } = composeWeeklyDigest(context, slice, overrides);
  const html = '<div style="max-width:600px;margin:0 auto;background-color:#ffffff;font-family:Inter,system-ui,sans-serif;padding:0 0 24px 0;">' + renderSections(content_sections) + '</div>';
  const plainText = renderSectionsPlainText(content_sections);
  return { subject, html, plainText, sections: content_sections, teams_included: slice.team_ids };
}

export async function sendWeeklyDigest({
  orgId, period,
  bodyNotes, signoffMessage, opsNotes,
  recipients, events, tournaments, teams, coaches,
  rsvpCountsByEvent,
  testOnly,
  audienceTeamIds = null,
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
  const overrides = { body_notes: bodyNotes, signoff_message: signoffMessage, ops_notes: opsNotes, audience_team_ids: audienceTeamIds };
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
  // Wave 4.3-K: when ALL rendered families are synthetic (guardian_id=null,
  // routed to pilot_test_recipient_email already), testOnly is effectively
  // a no-op — the synthetic rows ARE the test send and they must pass
  // through. Without this carve-out testOnly drops the per-team synthetic
  // rows and only the single admin BCC row survives (recipient_count=1).
  const allSynthetic = renderedFamilies.length > 0 && renderedFamilies.every((f) => f.family.guardian_id == null);
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

  return { messageId: msg.id, ...(dispatch || {}), composedFamilies: renderedFamilies.length };
}
