// Wave 5 PR 5b — family_guide resolver + composer. One parent →
// N kids (via player_guardians) → N teams (via team_players) →
// N events (filtered by date range). Single briefing document
// with VIP header + per-kid color blocks + cross-kid conflict
// detection.
//
// Two-stage contract:
//   resolveFamilyGuide({ parentUserId, dateRange }, { supabase })
//     -> { context, slices }
//   composeFamilyGuide(context, slice, overrides)
//     -> { subject, content_sections }
//
// Resolver is pure with injected IO per anti-pattern #27 — the
// supabase client is required via options, never imported at the
// top of the module. Anti-pattern #36 — every query checks error
// before using data.

import {
  buildBrandFooter, buildCoachesBlockSection, buildConflictCalloutSection,
  buildKidColorPillSections, buildQuickLinkNav, buildSignoffSection, buildVipHeaderSection,
} from './familyGuideSections';
import { detectConflicts, groupEventsByKid } from './familyGuideHelpers';
import { fetchTeamCoaches } from './familyGuideCoaches';
import { buildOrgContext } from '../buildOrgContext';

export async function resolveFamilyGuide({ parentUserId, dateRange, pilotOnly }, { supabase } = {}) {
  if (!parentUserId) throw new Error('Missing parentUserId');
  if (!supabase) throw new Error('Missing supabase client (pass via options.supabase)');

  const { data: parent, error: pErr } = await supabase.from('guardians')
    .select('id, first_name, last_name, email, user_id, org_id')
    .eq('user_id', parentUserId).maybeSingle();
  if (pErr) throw pErr;
  if (!parent) throw new Error(`Parent ${parentUserId} not found in guardians`);

  // Defense-in-depth pilot gate — D-5(a) RPC-canonical, matching
  // academyCallupNotice / rsvpNudge. In pilot mode the redirect-aware
  // get_digest_recipients RPC owns who is allowed: post-cutover it returns the
  // real pilot families; under REDIRECT mode it returns synthetic NULL-guardian
  // rows so the allowlist is empty and per-recipient kinds skip (verification
  // tracked separately). NEVER the bare is_pilot_family field (BUG-D /
  // pilotMechanismParity). Blocked → empty slices (graceful 0-recipient skip).
  let effectivePilotOnly = pilotOnly;
  if (effectivePilotOnly === undefined && parent.org_id) {
    const { data: settings, error: sErr } = await supabase.from('organization_settings')
      .select('pilot_mode_enabled').eq('organization_id', parent.org_id).maybeSingle();
    if (sErr) throw sErr;
    effectivePilotOnly = settings?.pilot_mode_enabled ?? false;
  }
  if (effectivePilotOnly && parent.org_id) {
    const { data: rpcRows = [], error: rpcErr } = await supabase.rpc('get_digest_recipients', { p_org_id: parent.org_id, p_pilot_only: true });
    if (rpcErr) throw rpcErr;
    const allowed = new Set((rpcRows || []).filter((r) => r.guardian_id).map((r) => r.guardian_id));
    if (!allowed.has(parent.id)) {
      return { context: { parent, kidsWithEvents: [], conflicts: [], dateRange, coaches: [], teamCoaches: [], orgName: 'Legacy Hoopers' }, slices: [] };
    }
  }

  const { data: pgRows, error: pgErr } = await supabase.from('player_guardians')
    .select('player_id, players ( id, first_name, last_name )')
    .eq('guardian_id', parent.id);
  if (pgErr) throw pgErr;
  const kidRows = (pgRows || []).filter((r) => r.players);
  const playerIds = kidRows.map((r) => r.player_id);

  const kids = [];
  let events = [];
  let teamIds = [];
  if (playerIds.length) {
    const { data: tpRows, error: tpErr } = await supabase.from('team_players')
      .select('player_id, team_id, teams ( id, name, team_color, sort_order, org_id )')
      .in('player_id', playerIds).eq('status', 'active');
    if (tpErr) throw tpErr;
    const byPlayer = new Map();
    for (const r of tpRows || []) {
      if (!r.teams) continue;
      if (!byPlayer.has(r.player_id)) byPlayer.set(r.player_id, []);
      byPlayer.get(r.player_id).push({
        team_id: r.team_id,
        team_name: r.teams.name || 'Team',
        team_color: r.teams.team_color || '#4a8fd4',
        sort_order: r.teams.sort_order ?? 0,
      });
    }
    for (const k of kidRows) {
      kids.push({
        player_id: k.player_id,
        first_name: k.players.first_name,
        last_name: k.players.last_name,
        teams: byPlayer.get(k.player_id) || [],
      });
    }
    teamIds = [...new Set(kids.flatMap((k) => k.teams.map((t) => t.team_id)))];
    if (teamIds.length && dateRange?.start && dateRange?.end) {
      const { data: evRows, error: evErr } = await supabase.from('events')
        .select('id, team_id, start_at, end_at, opponent, location, sub_location, title, event_type, is_scrimmage')
        .in('team_id', teamIds)
        .gte('start_at', dateRange.start)
        .lte('start_at', `${dateRange.end}T23:59:59Z`);
      if (evErr) throw evErr;
      events = evRows || [];
    }
  }

  const kidsWithEvents = groupEventsByKid(kids, events);
  const conflicts = detectConflicts(kidsWithEvents);

  // Coaches: per-team groups (teamCoaches) for the coaches_block reference
  // section + the de-duplicated signoff list (coaches). AP #27 — injected client.
  const { teamCoaches, coaches } = await fetchTeamCoaches(supabase, { orgId: parent.org_id, teamIds });

  let orgRow = null;
  if (parent.org_id) {
    const { data, error: orgErr } = await supabase.from('organizations')
      .select('name, display_name').eq('id', parent.org_id).maybeSingle();
    if (orgErr) throw orgErr;
    orgRow = data;
  }
  // AP #63 — route the org-name through the shared builder so the
  // display_name||name||default precedence is identical to every other kind.
  const orgName = buildOrgContext({ orgId: parent.org_id, org: orgRow, coaches }).name;

  return {
    context: { parent, kidsWithEvents, conflicts, dateRange, coaches, teamCoaches, orgName },
    slices: [{ kind: 'single_recipient', guardian_id: parent.id, email: parent.email, parent_name: parent.first_name }],
  };
}

export function composeFamilyGuide(context, slice, overrides = {}) {
  if (!context || !slice) throw new Error('Missing context or slice');
  const { parent, kidsWithEvents, conflicts, dateRange, coaches, teamCoaches, orgName } = context;
  const sections = [buildVipHeaderSection(parent, kidsWithEvents, dateRange, conflicts)];
  const conflictSection = buildConflictCalloutSection(conflicts);
  if (conflictSection) sections.push(conflictSection);
  sections.push(...buildKidColorPillSections(kidsWithEvents));
  const navSection = buildQuickLinkNav(kidsWithEvents);
  if (navSection) sections.push(navSection);
  // "Your coaches" reference block — per-team coach contact rows. Placed
  // after the schedule + quick links (VIP-reference reading flow), before
  // the signoff. Omitted when no team has a coach with a phone.
  const coachesSection = buildCoachesBlockSection(teamCoaches);
  if (coachesSection) sections.push(coachesSection);
  const signoff = buildSignoffSection(overrides, coaches);
  if (signoff) sections.push(signoff);
  sections.push(buildBrandFooter(orgName));
  return {
    subject: `Your family guide: ${slice.parent_name || parent?.first_name || 'Family'}`,
    content_sections: sections,
  };
}
