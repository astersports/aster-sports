// Wave 4.2-A-5 — schedule_change resolver pair.
//
// Two-stage contract:
//   resolveScheduleChange({ eventId, pilotOnly }, options)
//     -> { context, slices }
//   composeScheduleChange(context, slice, overrides)
//     -> { subject, content_sections }
//
// Walks event_change_audit (NOT schedule_change_audit_table) and
// computes changed_fields under timezone-normalized comparison.
// Fixes the production bug where the legacy compose rendered before/
// after for unchanged fields (e.g., "Monday May 11 at 7:35 PM has
// moved to Monday May 11 at 7:35 PM" — real production send,
// 2026-05-09 15:08 UTC, message bcc663a7).
//
// Hallucination guards:
//   - No audit row -> NoScheduleChangeError.
//   - changed_fields empty (timezone-string false positive) ->
//     NoActualScheduleChangeError.
//   - change_kind="cancelled" -> different headline + subject prefix
//     + narrative; no diff section.
//   - recurrence_scope="series" -> narrative prepended with
//     "All future {team} {event_type}s: ".

import {
  buildNarrative, computeDiff, eventTypeLabel, formatRange, NoActualScheduleChangeError,
  NoScheduleChangeError, trim,
} from './scheduleChangeHelpers';
import { fetchKidNames } from './gameRecapHelpers';
import { ORG_CONTACT_DEFAULT, ORG_LOGO_DEFAULT, ORG_NAME_DEFAULT, ORG_WEBSITE_DEFAULT } from '../../constants';


const EVENT_SELECT = 'id, title, team_id, event_type, start_at, end_at, location, location_id, opponent, status, publish_status, teams ( id, name, team_color, sort_order, org_id )';

async function fetchSlices(supabase, orgId, teamId, pilotOnly) {
  // Beta B6 audit — anti-pattern #36.
  const { data: rpcData, error: rpcErr } = await supabase.rpc('get_digest_recipients', { p_org_id: orgId, p_pilot_only: pilotOnly });
  if (rpcErr) throw rpcErr;
  const rpcRows = rpcData || [];
  const onTeam = rpcRows.filter((r) => (r.team_ids || []).includes(teamId));
  if (!onTeam.length) return [];
  const kidsByGuardian = await fetchKidNames(supabase, onTeam.map((r) => r.guardian_id));
  return onTeam
    .map((r) => ({ kind: 'family', guardian_id: r.guardian_id, email: r.email, kid_first_names: (kidsByGuardian.get(r.guardian_id) || []).slice().sort(), team_id: teamId }))
    .sort((a, b) => (a.guardian_id < b.guardian_id ? -1 : a.guardian_id > b.guardian_id ? 1 : 0));
}

export async function resolveScheduleChange({ eventId, pilotOnly }, { supabase, now = new Date() } = {}) {
  if (!eventId) throw new Error('Missing eventId');
  if (!supabase) throw new Error('Missing supabase client (pass via options.supabase)');
  void now;

  const { data: event, error: eventErr } = await supabase.from('events').select(EVENT_SELECT).eq('id', eventId).maybeSingle();
  if (eventErr) throw eventErr;
  if (!event) throw new Error(`Event ${eventId} not found`);
  const orgId = event.teams?.org_id;
  if (!orgId) throw new Error(`Event ${eventId} has no team org_id`);

  let effectivePilotOnly = pilotOnly;
  if (effectivePilotOnly === undefined) {
    const { data: settings, error: settingsErr } = await supabase.from('organization_settings').select('pilot_mode_enabled').eq('organization_id', orgId).maybeSingle();
    if (settingsErr) throw settingsErr;
    effectivePilotOnly = settings?.pilot_mode_enabled ?? false;
  }

  // Beta B6 audit — anti-pattern #36.
  const { data: auditData, error: auditErr } = await supabase.from('event_change_audit').select('id, org_id, event_id, changed_by, changed_at, change_kind, recurrence_scope, before_jsonb, after_jsonb, dispatch_email_id').eq('event_id', eventId).order('changed_at', { ascending: false });
  if (auditErr) throw auditErr;
  const auditRows = auditData || [];
  const audit = (auditRows || [])[0] || null;

  let location = null;
  if (event.location_id) {
    const { data: l, error: lErr } = await supabase.from('locations').select('id, name, address, google_maps_url').eq('id', event.location_id).maybeSingle();
    if (lErr) throw lErr;
    location = l || null;
  }
  // Beta B6 audit — anti-pattern #36.
  const { data: coachesData, error: coachesErr } = await supabase.from('staff_profiles').select('display_name, title, phone').eq('org_id', orgId).not('display_name', 'is', null);
  if (coachesErr) throw coachesErr;
  const coaches = coachesData || [];
  const { data: org, error: orgErr } = await supabase.from('organizations').select('id, name, brand_colors, voice_config').eq('id', orgId).maybeSingle();
  if (orgErr) throw orgErr;
  const slices = await fetchSlices(supabase, orgId, event.team_id, effectivePilotOnly);

  const diff = audit ? computeDiff(audit.before_jsonb, audit.after_jsonb) : { changed_fields: [], before_normalized: {}, after_normalized: {} };

  return {
    context: {
      org: {
        id: orgId, name: ORG_NAME_DEFAULT,
        branding: { eyebrowLink: ORG_WEBSITE_DEFAULT, contactEmail: ORG_CONTACT_DEFAULT, logoUrl: ORG_LOGO_DEFAULT },
        voice_config: org?.voice_config || null, brand_colors: org?.brand_colors || null,
        coaches: coaches || [],
      },
      event: { id: event.id, title: event.title, team_id: event.team_id, event_type: event.event_type, start_at: event.start_at, end_at: event.end_at, location: event.location, location_id: event.location_id, opponent: event.opponent, status: event.status, publish_status: event.publish_status, teams: event.teams },
      team: event.teams ? { id: event.teams.id, name: event.teams.name, team_color: event.teams.team_color, sort_order: event.teams.sort_order } : null,
      location,
      audit,
      diff,
    },
    slices,
  };
}

function buildLabel(event, team) { return event.title || `${team?.name || ''} ${eventTypeLabel(event.event_type)}`.trim(); }

function buildDiffSection(event, location, before, after, changed) {
  const beforeTime = formatRange(before.start_at, before.end_at);
  const afterTime = formatRange(after.start_at, after.end_at);
  return {
    kind: 'schedule_change_diff',
    changed_fields: changed,
    before: { time: beforeTime, label: event.title || '', location: before.location ?? location?.name ?? null, opponent: before.opponent ?? null },
    after: { time: afterTime, label: event.title || '', location: after.location ?? location?.name ?? null, opponent: after.opponent ?? null },
  };
}

export function composeScheduleChange(context, slice, overrides = {}) {
  if (!context || !slice) throw new Error('Missing context or slice');
  const { event, team, location, audit, diff, org } = context;
  if (!audit) throw new NoScheduleChangeError(event?.id);
  if (!diff.changed_fields.length && audit.change_kind !== 'cancelled') throw new NoActualScheduleChangeError(event?.id);

  const isCancellation = audit.change_kind === 'cancelled';
  const eventLabel = buildLabel(event, team);
  const sections = [];
  sections.push({ kind: 'header', eyebrow: `${org.name} · SCHEDULE CHANGE`, eyebrow_link: org.branding.eyebrowLink, headline: isCancellation ? 'CANCELLED' : 'SCHEDULE UPDATE', goldStripe: true });
  sections.push({ kind: 'stats_narrative', body: buildNarrative(audit, event, audit.before_jsonb || {}, audit.after_jsonb || {}, diff.changed_fields) });
  if (!isCancellation) sections.push(buildDiffSection(event, location, audit.before_jsonb || {}, audit.after_jsonb || {}, diff.changed_fields));

  for (const key of ['coach_note', 'parent_shoutout']) {
    const v = trim(overrides[key]); if (v) sections.push({ kind: 'stats_narrative', body: v });
  }
  const validCoaches = (org.coaches || []).filter((c) => c.display_name && c.phone).map((c) => ({ display_name: c.display_name || '', title: c.title || '', phone: c.phone || '' }));
  const signoffProse = trim(overrides.signoff_message);
  if (signoffProse || validCoaches.length) sections.push({ kind: 'signoff', prose: signoffProse, coaches: validCoaches });
  sections.push({ kind: 'footer', logoUrl: org.branding.logoUrl, orgName: org.name, websiteUrl: org.branding.eyebrowLink, contactEmail: org.branding.contactEmail });

  const subject = `${isCancellation ? 'Cancelled' : 'Schedule update'} — ${eventLabel}`;
  return { subject, content_sections: sections };
}

export { NoActualScheduleChangeError, NoScheduleChangeError } from './scheduleChangeHelpers';
