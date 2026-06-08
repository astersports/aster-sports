// Wave 3.8 §5.2 — schedule_change send pipeline.
//
// Wave 4.4-T0d — refactored to dispatch through RESOLVER_REGISTRY
// instead of the legacy `compose({kind:'schedule_change'})`. That
// dispatch entry was removed from KIND_COMPOSERS in Wave 4.2-A-8a
// when schedule_change migrated to the resolver path, but this file
// was not updated. Every call threw "No engine composer for kind
// 'schedule_change'" and useScheduleChangeAudit:55 caught silently.
// Audit rows wrote dispatch_email_id=NULL. No email reached parents.
//
// Signature changed: was {orgId, event, before, after, signoffMessage,
// coaches, recipients, pilotModeEnabled, testOnly}. Now {state, supabase,
// now} — matches rsvpNudgeSend.js and the registry contract. State must
// carry: kind, anchor_kind='event', anchor_id=eventId, body, signoff_message,
// test_only, pilot_only. The resolver fetches event + audit + location +
// coaches + recipients on its own (no longer passed in).
//
// Caller (useScheduleChangeAudit) must write the event_change_audit row
// BEFORE invoking this — the resolver reads from that table to compute
// the diff. Ordering is enforced by the caller, not this file.

// ARCHITECTURAL ASYMMETRY: This send pipeline composes a SINGLE body
// and fans out to all recipients. Other pipelines (digestSend,
// rsvpNudgeSend, academyCallupSend) compose per-slice (per-recipient).
//
// Today: schedule_change body content is slice-invariant (no
// per-recipient personalization), so the fan-out pattern produces
// identical results to per-slice.
//
// FUTURE-TRAP: If per-recipient personalization is added to
// schedule_change (e.g., "Hi {first_name}, the Skills Lab moved"),
// the current fan-out will silently drop the personalization. At that
// point, refactor to per-slice loop pattern mirroring rsvpNudgeSend.
//
// Decision: 2026-05-22 (Phase 3 Q7, claude.ai routing).

import { supabase as defaultSupabase } from './supabase';
import { RESOLVER_REGISTRY } from './engine/resolvers/registry';
import { renderSections, renderSectionsPlainText } from './engine/composer';
import { applyUnsubscribeUrls } from './unsubscribeUrl';
import { EMAIL_WRAPPER_CLOSE, EMAIL_WRAPPER_OPEN } from './emailWrapper';

const ADMIN_BCC_EMAIL = 'olivejuiceinc1@gmail.com';

export async function sendScheduleChange({ state, supabase: sb, now = new Date() }) {
  if (!state) throw new Error('sendScheduleChange: missing state.');
  if (state.kind !== 'schedule_change') throw new Error(`sendScheduleChange: expected state.kind='schedule_change', got '${state.kind}'.`);
  if (!state.anchor_id) throw new Error('sendScheduleChange: missing state.anchor_id (eventId).');
  const db = sb || defaultSupabase;

  const entry = RESOLVER_REGISTRY.schedule_change;
  const anchor = entry.anchorFromState(state);
  const overrides = entry.overridesFromState(state);
  const { context, slices } = await entry.resolve(anchor, { supabase: db, now });
  if (!slices.length && !state.test_only) throw new Error('No families on this team.');

  const sampleSlice = slices[0] || { kind: 'family', guardian_id: null, email: '', kid_first_names: [], team_id: context.event?.team_id };
  const { subject, content_sections } = entry.compose(context, sampleSlice, overrides);
  const html = EMAIL_WRAPPER_OPEN + renderSections(content_sections) + EMAIL_WRAPPER_CLOSE;
  const plainText = renderSectionsPlainText(content_sections);

  const teamId = context.event?.team_id || null;
  const orgId = context.org?.id;

  const { data: msg, error: msgErr } = await db.from('comms_messages').insert({
    org_id: orgId, tournament_id: null, team_id: teamId,
    kind: 'schedule_change', language_code: 'en',
    delivery_method: 'queued', sent_at: null, status: 'draft',
    audience_type: 'team', audience_filter: teamId ? { team_id: teamId } : null,
    anchor_kind: 'event', anchor_id: anchor.eventId,
    subject, body_html: html, body_plain: plainText,
    headline: 'SCHEDULE UPDATE', content_sections,
    signoff_message: state.signoff_message || null,
  }).select('id').single();
  if (msgErr) throw msgErr;

  const familyRows = state.test_only ? [] : slices.map((s) => ({
    message_id: msg.id, guardian_id: s.guardian_id, email_at_send: s.email,
    delivery_method: 'resend_api', delivery_status: 'queued',
    body_html_rendered: html, body_plain_rendered: plainText,
    subject_rendered: subject, teams_included: teamId ? [teamId] : [],
  }));
  const adminAlreadyIncluded = familyRows.some((r) => r.email_at_send === ADMIN_BCC_EMAIL);
  const adminRow = adminAlreadyIncluded ? null : {
    message_id: msg.id, guardian_id: null, email_at_send: ADMIN_BCC_EMAIL,
    delivery_method: 'resend_api', delivery_status: 'queued',
    body_html_rendered: html, body_plain_rendered: plainText,
    subject_rendered: subject, teams_included: [],
  };
  const allRows = [...familyRows, ...(adminRow ? [adminRow] : [])];
  const stampedRows = await applyUnsubscribeUrls(allRows);
  const { error: recErr } = await db.from('comms_message_recipients').insert(stampedRows);
  if (recErr) throw recErr;

  const { data: dispatch, error: dispErr } = await db.functions.invoke('send-tournament-message', { body: { message_id: msg.id } });
  if (dispErr) throw dispErr;
  // F-DUAL-FINALIZE (G5 PR 0): edge fn owns the terminal status='sent' write;
  // surface ok:false instead of force-finalizing a partial send (which would
  // 409-lock its own recovery). See composerSubmit / digestSend.
  if (dispatch && dispatch.ok === false) {
    throw new Error(dispatch.errors?.join('; ') || 'Dispatch reported failure.');
  }

  return { messageId: msg.id, audienceCount: slices.length };
}
