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
  buildCoachesBlockSection, buildConflictCalloutSection, buildFamilyGuideFooter,
  buildKidColorPillSections, buildQuickLinkNav, buildVipHeaderSection,
} from './familyGuideSections';
import { buildSignoffSection } from '../buildSignoffSection';
import { detectConflicts, groupEventsByKid } from './familyGuideHelpers';
import { fetchTeamCoaches } from './familyGuideCoaches';
import { buildOrgContext } from '../buildOrgContext';
import { fetchFamilyGuideKids } from './familyGuideKids';

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
    effectivePilotOnly = settings?.pilot_mode_enabled ?? true; // FORK-D fail-closed default
  }
  if (effectivePilotOnly && parent.org_id) {
    const { data: rpcRows = [], error: rpcErr } = await supabase.rpc('get_digest_recipients', { p_org_id: parent.org_id, p_pilot_only: true });
    if (rpcErr) throw rpcErr;
    const allowed = new Set((rpcRows || []).filter((r) => r.guardian_id).map((r) => r.guardian_id));
    // REDIRECT mode: the RPC returns synthetic per-team rows (guardian_id null,
    // email=pilot_test_recipient_email) and NO real-guardian rows, so the
    // allowlist is empty by construction. Dropping to empty slices here is the
    // bug Frank saw as "No recipients for this anchor" on every per-player kind.
    // Detect redirect mode and SKIP the allowlist gate so the resolver still
    // produces a real sample render — a TEST send (admin@ only) then delivers it
    // to the pilot inbox; a real send stays gated downstream by decidePilotGate.
    // In FILTER mode (post-cutover, real pilot families) redirectMode is false
    // and the allowlist gate keeps its correct narrow-to-pilot-family behavior.
    const redirectMode = (rpcRows || []).some((r) => r.guardian_id == null && r.email);
    if (!redirectMode && !allowed.has(parent.id)) {
      return { context: { parent, kidsWithEvents: [], conflicts: [], dateRange, coaches: [], teamCoaches: [], orgName: 'Aster AAU' }, slices: [] };
    }
  }

  const { data: pgRows, error: pgErr } = await supabase.from('player_guardians')
    .select('player_id, players ( id, first_name, last_name )')
    .eq('guardian_id', parent.id);
  if (pgErr) throw pgErr;
  const kidRows = (pgRows || []).filter((r) => r.players);
  const playerIds = kidRows.map((r) => r.player_id);

  const { kids, events, teamIds } = await fetchFamilyGuideKids(supabase, { kidRows, playerIds, dateRange });

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
  const orgCtx = buildOrgContext({ orgId: parent.org_id, org: orgRow, coaches });

  return {
    context: { parent, kidsWithEvents, conflicts, dateRange, coaches, teamCoaches, orgName: orgCtx.name, orgBranding: orgCtx.branding },
    slices: [{ kind: 'single_recipient', guardian_id: parent.id, email: parent.email, parent_name: parent.first_name }],
  };
}

export function composeFamilyGuide(context, slice, overrides = {}) {
  if (!context || !slice) throw new Error('Missing context or slice');
  const { parent, kidsWithEvents, conflicts, dateRange, teamCoaches, orgName, orgBranding } = context;
  const sections = [buildVipHeaderSection(parent, kidsWithEvents, dateRange, conflicts)];
  const conflictSection = buildConflictCalloutSection(conflicts);
  if (conflictSection) sections.push(conflictSection);
  sections.push(...buildKidColorPillSections(kidsWithEvents));
  const navSection = buildQuickLinkNav(kidsWithEvents);
  if (navSection) sections.push(navSection);
  // "Your coaches" reference block — per-team coach contact rows (name · title
  // · phone). This is coach CONTACT data through a different section, so it is
  // gated by the SAME per-message contact toggle as the signoff: OFF by default
  // (omitted), rendered only when the admin opts in (overrides.signoff_enabled).
  // Otherwise a family_guide sent with contact "off" would still leak phones.
  const coachesSection = overrides.signoff_enabled === true ? buildCoachesBlockSection(teamCoaches) : null;
  if (coachesSection) sections.push(coachesSection);
  const signoff = buildSignoffSection({ overrides });
  if (signoff) sections.push(signoff);
  sections.push(buildFamilyGuideFooter(orgName, orgBranding));
  return {
    subject: `Your family guide: ${slice.parent_name || parent?.first_name || 'Family'}`,
    content_sections: sections,
  };
}
