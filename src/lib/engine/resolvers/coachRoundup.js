// Wave 5 PR 4b — coach_roundup resolver + composer. Real multi-team
// aggregation: walks team_staff to find every team the coach helms,
// fetches events in the date range, groups by team, detects cross-
// team conflicts, and composes a single briefing document.
//
// 4a shipped the schema + skeleton. 4b replaces the skeleton with
// the real aggregation. 4c lands the UI body component (coach
// picker + date range).
//
// Two-stage contract:
//   resolveCoachRoundup({ coachUserId, dateRange }, { supabase })
//     -> { context, slices }
//   composeCoachRoundup(context, slice, overrides)
//     -> { subject, content_sections }

import {
  buildBrandFooter, buildCoachHeaderSection, buildConflictCalloutSection,
  buildSignoffSection, buildTeamSections,
} from './coachRoundupSections';
import { detectConflicts, groupEventsByTeam } from './coachRoundupHelpers';

export async function resolveCoachRoundup({ coachUserId, dateRange }, { supabase } = {}) {
  if (!coachUserId) throw new Error('Missing coachUserId');
  if (!supabase) throw new Error('Missing supabase client (pass via options.supabase)');

  const { data: coach, error: coachErr } = await supabase.from('staff_profiles')
    .select('user_id, display_name, org_id, phone, title').eq('user_id', coachUserId).maybeSingle();
  if (coachErr) throw coachErr;
  if (!coach) throw new Error(`Coach ${coachUserId} not found in staff_profiles`);

  const { data: staffRows, error: staffErr } = await supabase.from('team_staff')
    .select('team_id, role, teams ( id, name, team_color, sort_order, org_id )').eq('user_id', coachUserId);
  if (staffErr) throw staffErr;
  const teams = (staffRows || []).filter((r) => r.teams).map((r) => ({
    team_id: r.team_id, role: r.role,
    team_name: r.teams.name, team_color: r.teams.team_color || '#4a8fd4',
    sort_order: r.teams.sort_order ?? 0,
  }));

  const teamIds = teams.map((t) => t.team_id);
  let events = [];
  if (teamIds.length && dateRange?.start && dateRange?.end) {
    const { data: evRows, error: evErr } = await supabase.from('events')
      .select('id, team_id, start_at, end_at, opponent, location, sub_location, title')
      .in('team_id', teamIds)
      .gte('start_at', dateRange.start)
      .lte('start_at', `${dateRange.end}T23:59:59Z`);
    if (evErr) throw evErr;
    events = evRows || [];
  }

  const teamsWithEvents = groupEventsByTeam(teams, events);
  const conflicts = detectConflicts(teamsWithEvents);

  let coaches = [];
  if (coach.org_id) {
    const { data: cRows, error: cErr } = await supabase.from('staff_profiles')
      .select('display_name, title, phone').eq('org_id', coach.org_id).not('display_name', 'is', null);
    if (cErr) throw cErr;
    coaches = cRows || [];
  }

  let orgName = 'Legacy Hoopers';
  if (coach.org_id) {
    const { data: orgRow, error: orgErr } = await supabase.from('organizations')
      .select('name').eq('id', coach.org_id).maybeSingle();
    if (orgErr) throw orgErr;
    if (orgRow?.name) orgName = orgRow.name;
  }

  // Fetch coach email via SECDEF RPC. staff_profiles has no email
  // column; auth.users does. get_staff_email checks the requested
  // user_id is a staff member in the caller's org before returning
  // (defense-in-depth alongside RLS). Added 2026-05-23 per A.1.a fix.
  const { data: coachEmail, error: emailErr } = await supabase.rpc(
    'get_staff_email', { p_user_id: coachUserId },
  );
  if (emailErr) throw emailErr;
  if (!coachEmail) throw new Error(`Coach ${coachUserId} has no auth.users email`);

  return {
    context: { coach, teamsWithEvents, conflicts, dateRange, coaches, orgName },
    slices: [{ kind: 'single_recipient', guardian_id: null, email: coachEmail, coach_name: coach.display_name }],
  };
}

export function composeCoachRoundup(context, slice, overrides = {}) {
  if (!context || !slice) throw new Error('Missing context or slice');
  const { coach, teamsWithEvents, conflicts, dateRange, coaches, orgName } = context;
  const sections = [buildCoachHeaderSection(coach, teamsWithEvents, dateRange)];
  const conflictSection = buildConflictCalloutSection(conflicts);
  if (conflictSection) sections.push(conflictSection);
  sections.push(...buildTeamSections(teamsWithEvents));
  const signoff = buildSignoffSection(overrides, coaches);
  if (signoff) sections.push(signoff);
  sections.push(buildBrandFooter(orgName));
  return {
    subject: `Coach roundup — ${slice.coach_name || coach?.display_name || 'Coach'}`,
    content_sections: sections,
  };
}
