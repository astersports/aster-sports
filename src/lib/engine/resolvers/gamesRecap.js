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

import { buildGameCell, buildGamesSubject, dayLabel, fetchSlicesForTeams, summarizeGames, trim } from './gamesRecapHelpers';
import { buildOrgContext } from '../buildOrgContext';
import { buildSignoffSection } from '../buildSignoffSection';
import { fetchSignatureCoaches } from './signatureCoaches';
import { fetchSeasonToDate, seasonPillText } from './seasonToDate';


const EVENT_SELECT = 'id, team_id, event_type, start_at, location, location_id, opponent, teams ( id, name, team_color, org_id ), locations ( id, name )';

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
    effectivePilotOnly = settings?.pilot_mode_enabled ?? true; // FORK-D fail-closed default
  }

  const { data: results, error: grErr } = await supabase.from('game_results').select('event_id, our_score, opponent_score, result, published_at').in('event_id', eventIds);
  if (grErr) throw grErr;
  const resultByEvent = new Map((results || []).filter((r) => r.published_at).map((r) => [r.event_id, r]));

  const games = events
    .filter((e) => resultByEvent.has(e.id))
    .map((e) => {
      const gr = resultByEvent.get(e.id);
      return { team_id: e.team_id, event_type: e.event_type, team_name: e.teams?.name || 'Team', team_color: e.teams?.team_color || null, opponent: e.opponent, venue: e.locations?.name || e.location || null, start_at: e.start_at, our_score: gr.our_score, opponent_score: gr.opponent_score, result: gr.result, day_label: dayLabel(e.start_at) };
    })
    .sort((a, b) => String(a.start_at).localeCompare(String(b.start_at)));
  if (!games.length) throw new Error('No published results among selected games');

  const summary = summarizeGames(games);

  const { data: coachesData, error: cErr } = await supabase.from('staff_profiles').select('display_name, title, phone').eq('org_id', orgId).not('display_name', 'is', null);
  if (cErr) throw cErr;
  const { data: org, error: orgErr } = await supabase.from('organizations').select('id, name, display_name, brand_colors, voice_config').eq('id', orgId).maybeSingle();
  if (orgErr) throw orgErr;

  const teamIds = [...new Set(events.map((e) => e.team_id).filter(Boolean))];
  // Multi-team default (architect-flagged): games_recap can span 1+ teams
  // (e.g. 9U + 10U in one weekend digest). The voice signature is the UNION
  // of all involved teams' coaches (+ the org Program Director), deduped —
  // so a 9U+10U digest signs "Frank, Coach Kenny & Coach Darien" when Darien
  // coaches 9U. fetchSignatureCoaches takes the full teamIds array.
  const signatureCoaches = await fetchSignatureCoaches(supabase, orgId, teamIds);
  const slices = await fetchSlicesForTeams(supabase, orgId, teamIds, effectivePilotOnly);

  // Season-to-date applies ONLY when the recap is SINGLE-TEAM and SINGLE-SCOPE
  // (architect §2 gate): a blended cross-team/scope season number is undefined.
  // Multi-team / mixed-scope -> season_summary stays null and compose falls back
  // to the neutral window pill. A season-fetch failure degrades the same way
  // (the recap still renders) rather than breaking the whole draft.
  const scopes = [...new Set(games.map((g) => g.event_type).filter(Boolean))];
  let season_summary = null;
  if (teamIds.length === 1 && scopes.length === 1) {
    const asOf = games[games.length - 1].start_at;
    try {
      season_summary = await fetchSeasonToDate(supabase, { teamId: teamIds[0], scope: scopes[0], asOf });
    } catch (e) {
      console.warn('[gamesRecap] season-to-date fetch failed; using window pill', e);
    }
  }

  return {
    context: {
      org: buildOrgContext({ orgId, org, coaches: coachesData, signature_coaches: signatureCoaches }),
      games, summary, season_summary, subject: buildGamesSubject(games, summary.record),
    },
    slices,
  };
}

// Framed "designed object" treatment (recap-at-bar): the whole body is
// wrapped in the brand cobalt frame (frame_open/frame_close), opens with
// a cobalt header band + record pill, then a "The Weekend" section bar
// over one recap_game_cell PER GAME (each cell carries its own team
// color), then a "From the Sideline" section bar over the narrative +
// signoff, then the footer — all inside the frame. Reuses existing rich
// renderers; no per-kind branching. See docs/GAMES_RECAP_AT_BAR.html.
export function composeGamesRecap(context, slice, overrides = {}) {
  if (!context || !slice) throw new Error('Missing context or slice');
  const { org, games, summary, season_summary, subject } = context;
  const sections = [];
  sections.push({ kind: 'frame_open' });
  // F3b: single-team + single-scope -> season-to-date pill ("3–5 LEAGUE PLAY ·
  // SEASON"); multi-team / mixed-scope -> neutral window pill ("4 GAMES · range").
  const record_pill = season_summary
    ? seasonPillText(season_summary.record, season_summary.scope)
    : summary.windowPill;
  sections.push({ kind: 'header', variant: 'cobalt_band', eyebrow: `${org.name} · GAMES RECAP`, eyebrow_link: org.branding.eyebrowLink, headline: 'GAMES RECAP', record_pill });

  sections.push({ kind: 'section_bar', label: 'The Weekend' });
  for (const g of games) sections.push(buildGameCell(g));

  // Guard the "From the Sideline" bar behind real content (no empty bar).
  const sideline = [];
  for (const key of ['our_highlights', 'coach_note', 'parent_shoutout']) {
    const v = trim(overrides[key]);
    if (v) sideline.push(v);
  }
  if (sideline.length) {
    sections.push({ kind: 'section_bar', label: 'From the Sideline' });
    for (const body of sideline) sections.push({ kind: 'stats_narrative', body });
  }

  const signoff = buildSignoffSection({ overrides });
  if (signoff) sections.push(signoff);

  sections.push({ kind: 'footer', logoUrl: org.branding.logoUrl, orgName: org.name, websiteUrl: org.branding.eyebrowLink, contactEmail: org.branding.contactEmail });
  sections.push({ kind: 'frame_close' });

  return { subject, content_sections: sections };
}
