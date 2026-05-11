// Wave 4.2-A-1 — reference resolver for the calendar-as-spine wave.
//
// Two-stage contract (locked across wave 4.2-A):
//   resolveWeeklyDigest({ orgId, period, pilotOnly }, options)
//     -> { context, slices }
//   composeWeeklyDigest(context, slice)
//     -> { subject, content_sections }
//
// Pure async + pure sync. options.supabase + options.now make it
// unit-testable without the React layer; the cron auto-draft path
// (wave 4.3) calls only resolveWeeklyDigest.
//
// Hardcoded org branding constants preserved here to match the
// production renderer behavior. Multi-tenant org-level branding is
// a separate wave; today these are file-level defaults.

import { formatPeriodLabel, formatSubject, periodIsoBounds } from '../digestPeriod';
import { buildScheduleSection } from './weeklyDigestSchedule';

const RSVP_KEY = { going: 'going', maybe: 'maybe', not_going: 'out' };

const ORG_NAME_DEFAULT = 'Legacy Hoopers';
const HEADLINE_DEFAULT = 'WEEK AHEAD';
const ORG_WEBSITE_DEFAULT = 'https://www.legacyhoopers.org/';
const ORG_CONTACT_DEFAULT = 'info@legacyhoopers.org';
const ORG_LOGO_DEFAULT = 'https://skyfire-app.vercel.app/knight-logo-240.png';

const EVENT_SELECT = 'id, team_id, event_type, start_at, end_at, location, sub_location, location_id, opponent, tournament_id, tournament_name, is_bracket_placeholder, bracket_placeholder_label, status, teams!inner ( id, name, team_color, sort_order, org_id ), locations ( id, name, google_maps_url )';

function buildLocationsMap(events) {
  const m = {};
  for (const e of events || []) if (e?.locations?.id && !m[e.locations.id]) m[e.locations.id] = e.locations;
  return m;
}

function aggregateRsvps(events, rsvps) {
  const counts = new Map();
  for (const e of events) counts.set(e.id, { going: 0, maybe: 0, out: 0 });
  for (const r of rsvps || []) {
    const bucket = RSVP_KEY[r.response];
    if (!bucket) continue;
    const c = counts.get(r.event_id);
    if (c) c[bucket] += 1;
  }
  return counts;
}

function buildSlices(rpcRows, kidsByGuardian) {
  return (rpcRows || [])
    .map((r) => ({
      kind: 'family',
      guardian_id: r.guardian_id,
      email: r.email,
      kid_first_names: (kidsByGuardian.get(r.guardian_id) || []).slice().sort(),
      team_ids: (r.team_ids || []).slice().sort(),
    }))
    .sort((a, b) => (a.guardian_id < b.guardian_id ? -1 : a.guardian_id > b.guardian_id ? 1 : 0));
}

export async function resolveWeeklyDigest({ orgId, period, pilotOnly = false }, { supabase, now = new Date() } = {}) {
  if (!orgId) throw new Error('Missing orgId');
  if (!period?.start || !period?.end) throw new Error('Missing period');
  if (!supabase) throw new Error('Missing supabase client (pass via options.supabase)');
  void now;

  const { startIso, endIso } = periodIsoBounds(period);
  const { data: events = [], error: eventsErr } = await supabase
    .from('events').select(EVENT_SELECT)
    .eq('teams.org_id', orgId).neq('status', 'cancelled')
    .gte('start_at', startIso).lt('start_at', endIso)
    .order('start_at', { ascending: true });
  if (eventsErr) throw eventsErr;

  const tournamentIds = [...new Set((events || []).map((e) => e.tournament_id).filter(Boolean))];
  let tournaments = [];
  if (tournamentIds.length) {
    const { data, error } = await supabase.from('tournaments').select('id, name, start_date, end_date, rules').in('id', tournamentIds);
    if (error) throw error;
    tournaments = data || [];
  }

  let rsvps = [];
  const eventIds = (events || []).map((e) => e.id);
  if (eventIds.length) {
    const { data, error } = await supabase.from('event_rsvps').select('event_id, response').in('event_id', eventIds);
    if (error) throw error;
    rsvps = data || [];
  }

  const { data: rpcRows = [], error: rpcErr } = await supabase.rpc('get_digest_recipients', { p_org_id: orgId, p_pilot_only: pilotOnly });
  if (rpcErr) throw rpcErr;

  const { data: coaches = [], error: coachesErr } = await supabase.from('staff_profiles').select('display_name, title, phone').eq('org_id', orgId).not('display_name', 'is', null);
  if (coachesErr) throw coachesErr;

  const { data: org, error: orgErr } = await supabase.from('organizations').select('id, name, brand_colors, voice_config').eq('id', orgId).maybeSingle();
  if (orgErr) throw orgErr;

  const guardianIds = (rpcRows || []).map((r) => r.guardian_id);
  const kidsByGuardian = new Map();
  if (guardianIds.length) {
    const { data: kidsRows = [], error: kidsErr } = await supabase.from('player_guardians').select('guardian_id, players ( first_name )').in('guardian_id', guardianIds);
    if (kidsErr) throw kidsErr;
    for (const row of kidsRows || []) {
      const fn = row.players?.first_name || row.first_name;
      if (!fn) continue;
      const arr = kidsByGuardian.get(row.guardian_id) || [];
      arr.push(fn); kidsByGuardian.set(row.guardian_id, arr);
    }
  }

  const teamsMap = new Map();
  for (const ev of events || []) if (ev.teams && !teamsMap.has(ev.teams.id)) teamsMap.set(ev.teams.id, ev.teams);

  return {
    context: {
      org: {
        id: orgId, name: ORG_NAME_DEFAULT,
        branding: { eyebrowLink: ORG_WEBSITE_DEFAULT, contactEmail: ORG_CONTACT_DEFAULT, logoUrl: ORG_LOGO_DEFAULT },
        voice_config: org?.voice_config || null,
        brand_colors: org?.brand_colors || null,
        coaches: coaches || [],
      },
      period: { start: period.start, end: period.end, label: formatPeriodLabel(period) },
      events: events || [],
      teams: [...teamsMap.values()],
      tournaments,
      locations: buildLocationsMap(events),
      rsvpCountsByEvent: aggregateRsvps(events || [], rsvps),
    },
    slices: buildSlices(rpcRows, kidsByGuardian),
  };
}

export function composeWeeklyDigest(context, slice, overrides = {}) {
  if (!context || !slice) throw new Error('Missing context or slice');
  const { body_notes = '', signoff_message = '', ops_notes = '' } = overrides;
  const teamSet = new Set(slice.team_ids || []);
  const familyEvents = (context.events || []).filter((e) => teamSet.has(e.team_id));
  const sections = [];
  sections.push({ kind: 'header', eyebrow: context.org.name, eyebrow_link: context.org.branding.eyebrowLink, headline: HEADLINE_DEFAULT, sub_context: context.period.label, goldStripe: true });
  if (body_notes && body_notes.trim()) sections.push({ kind: 'stats_narrative', body: body_notes.trim() });
  const schedule = buildScheduleSection({ events: familyEvents, teams: context.teams, tournaments: context.tournaments, rsvpCountsByEvent: context.rsvpCountsByEvent });
  if (schedule) sections.push(schedule);
  const opsItems = (ops_notes || '').split('\n').map((s) => s.trim()).filter(Boolean);
  if (opsItems.length) sections.push({ kind: 'ops_notes', title: 'BEFORE YOU GO', items: opsItems });
  const validCoaches = (context.org.coaches || []).filter((c) => c.display_name && c.phone).map((c) => ({ display_name: c.display_name || '', title: c.title || '', phone: c.phone || '' }));
  const hasSignoff = (signoff_message && signoff_message.trim()) || validCoaches.length;
  if (hasSignoff) sections.push({ kind: 'signoff', prose: (signoff_message || '').trim(), coaches: validCoaches });
  sections.push({ kind: 'footer', logoUrl: context.org.branding.logoUrl, orgName: context.org.name, websiteUrl: context.org.branding.eyebrowLink, contactEmail: context.org.branding.contactEmail });
  return { subject: formatSubject(context.period), content_sections: sections };
}
