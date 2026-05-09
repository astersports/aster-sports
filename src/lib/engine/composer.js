// Engine composer. Two responsibilities:
//   1. renderSections — iterates a content_sections JSONB array and dispatches
//      each section to its atomic renderer by `kind`.
//   2. compose({ kind, data }) — dispatches to a kind composer that builds
//      the section array (plus any inline glue) and returns { html, plainText, subject }.
//
// Wave 1 supports academy_callup_notice (new) + tournament_preliminary (port of
// the legacy briefing). Wave 2 adds 13 new atomic renderers (string-only
// dispatch wraps both wave-1 string renderers and wave-2 { html, plainText }
// renderers via shapeOf).

import { renderHeader } from './renderers/header';
import { renderGameCard } from './renderers/gameCard';
import { renderChampionshipScenarios } from './renderers/championshipScenarios';
import { composeAcademyCallupNotice } from './renderers/academyCallupNotice';
import { composeTournamentPreliminary } from './renderers/tournamentPreliminary';
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
  // Wave 1 (string-returning)
  header: renderHeader,
  game_card: renderGameCard,
  championship_scenarios: renderChampionshipScenarios,
  // Wave 2 ({ html, plainText }-returning)
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
};

const KIND_COMPOSERS = {
  academy_callup_notice: composeAcademyCallupNotice,
  tournament_preliminary: composeTournamentPreliminary,
};

// Normalize across wave-1 (string) and wave-2 ({ html, plainText }) returns.
function shapeOf(out) {
  if (typeof out === 'string') return { html: out, plainText: '' };
  return { html: out?.html || '', plainText: out?.plainText || '' };
}

export function renderSections(sections = []) {
  return (sections || [])
    .map((section) => {
      const fn = SECTION_RENDERERS[section?.kind];
      if (!fn) return '';
      return shapeOf(fn(section)).html;
    })
    .join('');
}

// Mirror of renderSections that yields plain-text output. Wave-1 renderers
// don't supply plain text yet — their kind composers (tournament_preliminary)
// own that path. Digest engine (wave 3) will use this for per-family fallbacks.
export function renderSectionsPlainText(sections = []) {
  return (sections || [])
    .map((section) => {
      const fn = SECTION_RENDERERS[section?.kind];
      if (!fn) return '';
      return shapeOf(fn(section)).plainText;
    })
    .filter(Boolean)
    .join('\n\n');
}

export function compose({ kind, data }) {
  const kindComposer = KIND_COMPOSERS[kind];
  if (!kindComposer) {
    const supported = Object.keys(KIND_COMPOSERS).join(', ');
    throw new Error(`No engine composer for kind "${kind}". Wave 1 supports: ${supported}.`);
  }
  return kindComposer(data);
}
