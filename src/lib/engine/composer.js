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
// them by name (tournamentPreliminary still inlines its own pipeline).

import { renderHeader } from './renderers/header';
import { renderGameCard } from './renderers/gameCard';
import { renderChampionshipScenarios } from './renderers/championshipScenarios';
import { renderFooter } from './renderers/footer';
import { composeAcademyCallupNotice } from './renderers/academyCallupNotice';
import { composeTournamentPreliminary } from './renderers/tournamentPreliminary';
import { composeWeeklyDigest } from './renderers/weeklyDigest';
import { composeScheduleChange } from './renderers/scheduleChange';
import { composeGameRecap } from './renderers/gameRecap';
import { composeTournamentPrelim } from './renderers/tournamentPrelim';
import { composeTournamentRecap } from './renderers/tournamentRecap';
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
};

// Wave 3.11: 5 new lightweight kind composers added for the unified
// BriefingComposer. The legacy `tournament_preliminary` (wave-2 spec
// renderer) is preserved under its original key. The lightweight
// briefing version registers under `tournament_prelim` to avoid the
// clash. A future wave will collapse the two once the legacy kind's
// callers migrate.
const KIND_COMPOSERS = {
  academy_callup_notice: composeAcademyCallupNotice,
  tournament_preliminary: composeTournamentPreliminary,
  weekly_digest: composeWeeklyDigest,
  schedule_change: composeScheduleChange,
  game_recap: composeGameRecap,
  tournament_prelim: composeTournamentPrelim,
  tournament_recap: composeTournamentRecap,
  announcement: composeAnnouncement,
  custom_message: composeCustomMessage,
};

export function renderSections(sections = []) {
  return (sections || [])
    .map((section) => {
      const fn = SECTION_RENDERERS[section?.kind];
      return fn ? (fn(section)?.html || '') : '';
    })
    .join('');
}

// Mirror of renderSections for plain-text output. Joined with blank-line
// separators so digest plain-text bodies read like a clean fallback.
export function renderSectionsPlainText(sections = []) {
  return (sections || [])
    .map((section) => {
      const fn = SECTION_RENDERERS[section?.kind];
      return fn ? (fn(section)?.plainText || '') : '';
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
