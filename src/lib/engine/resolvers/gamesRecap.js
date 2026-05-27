// games_recap (G1) — multi-game digest resolver pair.
//
//   resolveGamesRecap({ eventIds, pilotOnly }, options) -> { context, slices }
//   composeGamesRecap(context, slice, overrides)        -> { subject, content_sections }
//
// Covers N selected games across 1+ teams (tournament weekend, double-
// header, "this week we played 4 games"). Composes from existing section
// renderers only (header / stats_narrative / signoff / footer) — no new
// renderers, so no SECTION_RENDERERS orphan risk (AP #38). Only games with
// a PUBLISHED game_result are included (hallucination guard, mirrors
// game_recap). Content is invariant across slices (same recap to every
// recipient); slices only carry the audience.

import { buildGamesSubject, dayLabel, fetchSlicesForTeams, summarizeGames, trim } from './gamesRecapHelpers';

const ORG_NAME_DEFAULT = 'Legacy Hoopers';
const ORG_WEBSITE_DEFAULT = 'https://www.legacyhoopers.org/';
const ORG_CONTACT_DEFAULT = 'info@legacyhoopers.org';
const ORG_LOGO_DEFAULT = 'https://skyfire-app.vercel.app/knight-logo-240.png';

const EVENT_SELECT = 'id, team_id, start_at, opponent, teams ( id, name, team_color, org_id )';

export async function resolveGamesRecap({ eventIds, pilotOnly }, { supabase, now = new Date() } = {}) {
  if (!Array.isArray(eventIds) || !eventIds.length) throw new Error('Missing eventIds');
  if (!supabase) throw new Error('Missing supabase client (pass via options.supabase)');
  void now;

  const { data: events, error: evErr } = await supabase.from('events').select(EVENT_SELECT).in('id', eventIds);
  if (evErr) throw evErr;
  if (!events?.length) throw new Error('No events found for games_recap');
  const orgId = events[0].teams?.org_id;
  if (!orgId) throw new Error('Events have no team org_id');

  let effectivePilotOnly = pilotOnly;
  if (effectivePilotOnly === undefined) {
    const { data: settings, error: sErr } = await supabase.from('organization_settings').select('pilot_mode_enabled').eq('organization_id', orgId).maybeSingle();
    if (sErr) throw sErr;
    effectivePilotOnly = settings?.pilot_mode_enabled ?? false;
  }

  const { data: results, error: grErr } = await supabase.from('game_results').select('event_id, our_score, opponent_score, result, published_at').in('event_id', eventIds);
  if (grErr) throw grErr;
  const resultByEvent = new Map((results || []).filter((r) => r.published_at).map((r) => [r.event_id, r]));

  const games = events
    .filter((e) => resultByEvent.has(e.id))
    .map((e) => {
      const gr = resultByEvent.get(e.id);
      return { team_name: e.teams?.name || ORG_NAME_DEFAULT, opponent: e.opponent, start_at: e.start_at, our_score: gr.our_score, opponent_score: gr.opponent_score, result: gr.result, day_label: dayLabel(e.start_at) };
    })
    .sort((a, b) => String(a.start_at).localeCompare(String(b.start_at)));
  if (!games.length) throw new Error('No published results among selected games');

  const summary = summarizeGames(games);

  const { data: coachesData, error: cErr } = await supabase.from('staff_profiles').select('display_name, title, phone').eq('org_id', orgId).not('display_name', 'is', null);
  if (cErr) throw cErr;
  const { data: org, error: orgErr } = await supabase.from('organizations').select('id, name, display_name, brand_colors, voice_config').eq('id', orgId).maybeSingle();
  if (orgErr) throw orgErr;

  const teamIds = [...new Set(events.map((e) => e.team_id).filter(Boolean))];
  const slices = await fetchSlicesForTeams(supabase, orgId, teamIds, effectivePilotOnly);

  return {
    context: {
      org: {
        id: orgId, name: org?.display_name || org?.name || ORG_NAME_DEFAULT,
        branding: { eyebrowLink: ORG_WEBSITE_DEFAULT, contactEmail: ORG_CONTACT_DEFAULT, logoUrl: ORG_LOGO_DEFAULT },
        voice_config: org?.voice_config || null, brand_colors: org?.brand_colors || null,
        coaches: coachesData || [],
      },
      games, summary, subject: buildGamesSubject(games, summary.record),
    },
    slices,
  };
}

export function composeGamesRecap(context, slice, overrides = {}) {
  if (!context || !slice) throw new Error('Missing context or slice');
  const { org, games, summary, subject } = context;
  const sections = [];
  sections.push({ kind: 'header', eyebrow: `${org.name} · GAMES RECAP`, eyebrow_link: org.branding.eyebrowLink, headline: 'GAMES RECAP', sub_context: summary.label, goldStripe: true });

  for (const g of games) {
    const opp = g.opponent ? String(g.opponent).trim() : '';
    const line = opp
      ? `${g.day_label} — ${g.team_name} ${g.our_score} – ${opp} ${g.opponent_score} (${g.result})`
      : `${g.day_label} — ${g.team_name} ${g.our_score}-${g.opponent_score} (${g.result})`;
    sections.push({ kind: 'stats_narrative', body: line });
  }

  for (const key of ['our_highlights', 'coach_note', 'parent_shoutout']) {
    const v = trim(overrides[key]);
    if (v) sections.push({ kind: 'stats_narrative', body: v });
  }

  const validCoaches = (org.coaches || []).filter((c) => c.display_name && c.phone).map((c) => ({ display_name: c.display_name || '', title: c.title || '', phone: c.phone || '' }));
  const signoffProse = trim(overrides.signoff_message);
  if (signoffProse || validCoaches.length) sections.push({ kind: 'signoff', prose: signoffProse, coaches: validCoaches });

  sections.push({ kind: 'footer', logoUrl: org.branding.logoUrl, orgName: org.name, websiteUrl: org.branding.eyebrowLink, contactEmail: org.branding.contactEmail });

  return { subject, content_sections: sections };
}
