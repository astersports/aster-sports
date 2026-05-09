// Engine composer. Two responsibilities:
//   1. renderSections — iterates a content_sections JSONB array and dispatches
//      each section to its atomic renderer by `kind`.
//   2. compose({ kind, data }) — dispatches to a kind composer that builds
//      the section array (plus any inline glue) and returns { html, plainText, subject }.
//
// Wave 1 supports academy_callup_notice (new) + tournament_preliminary (port of
// the legacy briefing). Other kinds light up as later waves land their renderers.

import { renderHeader } from './renderers/header';
import { renderGameCard } from './renderers/gameCard';
import { renderChampionshipScenarios } from './renderers/championshipScenarios';
import { composeAcademyCallupNotice } from './renderers/academyCallupNotice';
import { composeTournamentPreliminary } from './renderers/tournamentPreliminary';

const SECTION_RENDERERS = {
  header: renderHeader,
  game_card: renderGameCard,
  championship_scenarios: renderChampionshipScenarios,
};

const KIND_COMPOSERS = {
  academy_callup_notice: composeAcademyCallupNotice,
  tournament_preliminary: composeTournamentPreliminary,
};

export function renderSections(sections = []) {
  return (sections || [])
    .map((section) => {
      const fn = SECTION_RENDERERS[section?.kind];
      return fn ? fn(section) : '';
    })
    .join('');
}

export function compose({ kind, data }) {
  const kindComposer = KIND_COMPOSERS[kind];
  if (!kindComposer) {
    const supported = Object.keys(KIND_COMPOSERS).join(', ');
    throw new Error(`No engine composer for kind "${kind}". Wave 1 supports: ${supported}.`);
  }
  return kindComposer(data);
}
