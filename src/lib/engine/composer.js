// Engine composer. Two responsibilities:
//   1. renderSections — iterates a content_sections JSONB array and dispatches
//      each section to its atomic renderer by `kind`.
//   2. compose({ kind, data }) — dispatches to a kind composer that builds
//      the section array and returns { html, plainText, subject, ...extras }.
//
// Wave 3 unifies the renderer signature: all atomic renderers return
// { html, plainText }, so the wave-1 string-vs-object shim is gone. Wave-1
// renderers (header, gameCard, championshipScenarios) keep their named
// `renderXxx` exports for back-compat with kind composers that imported
// them by name.

import { renderHeader } from './renderers/header';
import { renderGameCard } from './renderers/gameCard';
import { renderChampionshipScenarios } from './renderers/championshipScenarios';
import { renderFooter } from './renderers/footer';
import { composeAcademyCallupNotice } from './renderers/academyCallupNotice';
import { composeWeeklyDigest } from './renderers/weeklyDigest';
import { composeAnnouncement } from './renderers/announcement';
import { composeCustomMessage } from './renderers/customMessage';
import scheduleChangeDiff from './renderers/scheduleChangeDiff';
import statGrid from './renderers/statGrid';
import poolStandings from './renderers/poolStandings';
import resultsTable from './renderers/resultsTable';
import weeklySchedule from './renderers/weeklySchedule';
import labeledKeys from './renderers/labeledKeys';
import hotelBlock from './renderers/hotelBlock';
import championCallout from './renderers/championCallout';
import tiebreakerExplainer from './renderers/tiebreakerExplainer';
import otherGames from './renderers/otherGames';
import opsNotes from './renderers/opsNotes';
import ctaButtons from './renderers/ctaButtons';
import statsNarrative from './renderers/statsNarrative';
import signoff from './renderers/signoff';
import rsvpRequest from './renderers/rsvpRequest';
import callupResponse from './renderers/callupResponse';
// Wave 5 PR 1+3a — tournament_prelim alignment sections (audit §5.x).
import dayHeader from './renderers/dayHeader';
import rsvpCallout from './renderers/rsvpCallout';
import venueList from './renderers/venueList';
import venueNotes from './renderers/venueNotes';
import logisticsLine from './renderers/logisticsLine';
import taglineFooter from './renderers/taglineFooter';
import brandFooter from './renderers/brandFooter';
import bracketCallout from './renderers/bracketCallout';
// Wave 5 PR 4b — coach_roundup section renderers (4): cobalt banner,
// per-team colored pill, amber conflict callout, per-event row with
// left-edge color stripe. Make multi-team docs visually scannable.
import coachHeader from './renderers/coachHeader';
import teamColorPill from './renderers/teamColorPill';
import conflictCallout from './renderers/conflictCallout';
import colorStripedRow from './renderers/colorStripedRow';
// Audit 2026-05-16 Phase 5 orphan fix — event_card emitted by
// rsvp_nudge + academy_callup_notice composers, previously unregistered.
import eventCard from './renderers/eventCard';

const SECTION_RENDERERS = {
  header: renderHeader,
  game_card: renderGameCard,
  championship_scenarios: renderChampionshipScenarios,
  footer: renderFooter,
  stat_grid: statGrid,
  pool_standings: poolStandings,
  results_table: resultsTable,
  weekly_schedule: weeklySchedule,
  labeled_keys: labeledKeys,
  hotel_block: hotelBlock,
  champion_callout: championCallout,
  tiebreaker_explainer: tiebreakerExplainer,
  other_games: otherGames,
  ops_notes: opsNotes,
  cta_buttons: ctaButtons,
  stats_narrative: statsNarrative,
  signoff,
  schedule_change_diff: scheduleChangeDiff,
  rsvp_request: rsvpRequest,
  callup_response: callupResponse,
  day_header: dayHeader,
  rsvp_callout: rsvpCallout,
  venue_list: venueList,
  venue_notes: venueNotes,
  logistics_line: logisticsLine,
  tagline_footer: taglineFooter,
  brand_footer: brandFooter,
  bracket_callout: bracketCallout,
  coach_header: coachHeader,
  team_color_pill: teamColorPill,
  conflict_callout: conflictCallout,
  color_striped_row: colorStripedRow,
  event_card: eventCard,
};

// KIND_COMPOSERS — legacy compose() path for kinds NOT in
// RESOLVER_REGISTRY (announcement, custom_message). weekly_digest +
// academy_callup_notice retained defensively; their production sends
// go through dedicated paths (digestSend, academyCallupSend).
const KIND_COMPOSERS = {
  academy_callup_notice: composeAcademyCallupNotice,
  weekly_digest: composeWeeklyDigest,
  announcement: composeAnnouncement,
  custom_message: composeCustomMessage,
};

// Wave 5 PR 1 — orphan-kind guard. Prior behavior: unknown section
// kinds silently rendered as empty strings, which masked the
// tournament_prelim → team_schedule_table broken wire for months.
// New: warn in non-prod when a section's kind has no registered
// renderer. Tests + prod stay silent (no console noise); dev surfaces
// the broken wire immediately.
function warnUnknownKind(kind) {
  if (kind && typeof console !== 'undefined' && typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    console.warn(`[engine/composer] No registered renderer for section kind "${kind}". Section will render as empty.`);
  }
}

export function renderSections(sections = []) {
  return (sections || [])
    .map((section) => {
      const fn = SECTION_RENDERERS[section?.kind];
      if (!fn) { warnUnknownKind(section?.kind); return ''; }
      return fn(section)?.html || '';
    })
    .join('');
}

// Mirror of renderSections for plain-text output. Joined with blank-line
// separators so digest plain-text bodies read like a clean fallback.
export function renderSectionsPlainText(sections = []) {
  return (sections || [])
    .map((section) => {
      const fn = SECTION_RENDERERS[section?.kind];
      if (!fn) return '';
      return fn(section)?.plainText || '';
    })
    .filter(Boolean)
    .join('\n\n');
}

export function compose({ kind, data }) {
  const kindComposer = KIND_COMPOSERS[kind];
  if (!kindComposer) {
    const supported = Object.keys(KIND_COMPOSERS).join(', ');
    throw new Error(`No engine composer for kind "${kind}". Supported kinds: ${supported}.`);
  }
  return kindComposer(data);
}
