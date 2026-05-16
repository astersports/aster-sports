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
  buildBrandFooter, buildKidColorPillSections, buildQuickLinkNav,
  buildSignoffSection, buildVipHeaderSection,
} from './familyGuideSections';
import { detectConflicts, groupEventsByKid } from './familyGuideHelpers';

export async function resolveFamilyGuide({ parentUserId, dateRange }, { supabase } = {}) {
  if (!parentUserId) throw new Error('Missing parentUserId');
  if (!supabase) throw new Error('Missing supabase client (pass via options.supabase)');

  const { data: parent, error: pErr } = await supabase.from('guardians')
    .select('id, first_name, last_name, email, user_id, org_id')
    .eq('user_id', parentUserId).maybeSingle();
  if (pErr) throw pErr;
  if (!parent) throw new Error(`Parent ${parentUserId} not found in guardians`);

  const { data: pgRows, error: pgErr } = await supabase.from('player_guardians')
    .select('player_id, players ( id, first_name, last_name )')
    .eq('guardian_id', parent.id);
  if (pgErr) throw pgErr;
  const kidRows = (pgRows || []).filter((r) => r.players);
  const playerIds = kidRows.map((r) => r.player_id);

  const kids = [];
  let events = [];
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
    const teamIds = [...new Set(kids.flatMap((k) => k.teams.map((t) => t.team_id)))];
    if (teamIds.length && dateRange?.start && dateRange?.end) {
      const { data: evRows, error: evErr } = await supabase.from('events')
        .select('id, team_id, start_at, end_at, opponent, location, sub_location, title')
        .in('team_id', teamIds)
        .gte('start_at', dateRange.start)
        .lte('start_at', `${dateRange.end}T23:59:59Z`);
      if (evErr) throw evErr;
      events = evRows || [];
    }
  }

  const kidsWithEvents = groupEventsByKid(kids, events);
  const conflicts = detectConflicts(kidsWithEvents);

  let coaches = [];
  if (parent.org_id) {
    const { data: cRows, error: cErr } = await supabase.from('staff_profiles')
      .select('display_name, title, phone').eq('org_id', parent.org_id).not('display_name', 'is', null);
    if (cErr) throw cErr;
    coaches = cRows || [];
  }

  let orgName = 'Legacy Hoopers';
  if (parent.org_id) {
    const { data: orgRow, error: orgErr } = await supabase.from('organizations')
      .select('name').eq('id', parent.org_id).maybeSingle();
    if (orgErr) throw orgErr;
    if (orgRow?.name) orgName = orgRow.name;
  }

  return {
    context: { parent, kidsWithEvents, conflicts, dateRange, coaches, orgName },
    slices: [{ recipient_user_id: parent.user_id, parent_name: parent.first_name, parent_email: parent.email }],
  };
}

export function composeFamilyGuide(context, slice, overrides = {}) {
  if (!context || !slice) throw new Error('Missing context or slice');
  const { parent, kidsWithEvents, conflicts, dateRange, coaches, orgName } = context;
  const sections = [buildVipHeaderSection(parent, kidsWithEvents, dateRange, conflicts)];
  sections.push(...buildKidColorPillSections(kidsWithEvents));
  const navSection = buildQuickLinkNav(kidsWithEvents);
  if (navSection) sections.push(navSection);
  const signoff = buildSignoffSection(overrides, coaches);
  if (signoff) sections.push(signoff);
  sections.push(buildBrandFooter(orgName));
  return {
    subject: `Your family guide — ${slice.parent_name || parent?.first_name || 'Family'}`,
    content_sections: sections,
  };
}
