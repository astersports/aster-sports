// Section renderer registry + dispatch.
//
// Split from composer.js on 2026-05-24 to keep composer.js under the
// AP #6 150-line cap (was 163L). compose() + KIND_COMPOSERS stay in
// composer.js; the per-section dispatch (the larger surface area)
// lives here.
//
// SECTION_RENDERERS maps section.kind → atomic renderer fn. Each
// renderer returns { html, plainText } per the wave-3 unified
// signature. renderSections and renderSectionsPlainText iterate a
// content_sections array and concatenate the per-section output.
//
// Orphan-kind guard: unknown section kinds render as empty strings.
// In DEV (Vite import.meta.env.DEV), a console.warn surfaces the
// missing renderer registration. Prod + tests stay silent. AP #38.

import { renderHeader } from './renderers/header';
import { renderGameCard } from './renderers/gameCard';
import { renderFooter } from './renderers/footer';
import scheduleChangeDiff from './renderers/scheduleChangeDiff';
import cancellationCard from './renderers/cancellationCard';
import weeklySchedule from './renderers/weeklySchedule';
import hotelBlock from './renderers/hotelBlock';
import opsNotes from './renderers/opsNotes';
import ctaButtons from './renderers/ctaButtons';
import statsNarrative from './renderers/statsNarrative';
import signoff from './renderers/signoff';
import rsvpRequest from './renderers/rsvpRequest';
import callupResponse from './renderers/callupResponse';
import dayHeader from './renderers/dayHeader';
import rsvpCallout from './renderers/rsvpCallout';
import venueList from './renderers/venueList';
import venueNotes from './renderers/venueNotes';
import logisticsLine from './renderers/logisticsLine';
import taglineFooter from './renderers/taglineFooter';
import brandFooter from './renderers/brandFooter';
import bracketCallout from './renderers/bracketCallout';
import coachHeader from './renderers/coachHeader';
import teamColorPill from './renderers/teamColorPill';
import conflictCallout from './renderers/conflictCallout';
import colorStripedRow from './renderers/colorStripedRow';
import eventCard from './renderers/eventCard';
import callupCard from './renderers/callupCard';
import placementBlock from './renderers/placementBlock';
import gameLog from './renderers/gameLog';
import standoutMoments from './renderers/standoutMoments';
import coachReflection from './renderers/coachReflection';
import vipHeader from './renderers/vipHeader';
import kidColorPill from './renderers/kidColorPill';
import quickLinkNav from './renderers/quickLinkNav';
import coachesBlock from './renderers/coachesBlock';
import { renderRecapFrameClose, renderRecapFrameOpen } from './renderers/recapFrame';
import sectionBar from './renderers/sectionBar';
import recapGameCell from './renderers/recapGameCell';
import poolStandings from './renderers/poolStandings';
import weather from './renderers/weather';
import rules from './renderers/rules';

export const SECTION_RENDERERS = {
  header: renderHeader,
  game_card: renderGameCard,
  footer: renderFooter,
  weekly_schedule: weeklySchedule,
  hotel_block: hotelBlock,
  ops_notes: opsNotes,
  cta_buttons: ctaButtons,
  stats_narrative: statsNarrative,
  signoff,
  schedule_change_diff: scheduleChangeDiff,
  cancellation_card: cancellationCard,
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
  callup_card: callupCard,
  placement_block: placementBlock,
  game_log: gameLog,
  standout_moments: standoutMoments,
  coach_reflection: coachReflection,
  vip_header: vipHeader,
  kid_color_pill: kidColorPill,
  quick_link_nav: quickLinkNav,
  coaches_block: coachesBlock,
  frame_open: renderRecapFrameOpen,
  frame_close: renderRecapFrameClose,
  section_bar: sectionBar,
  recap_game_cell: recapGameCell,
  pool_standings: poolStandings,
  weather,
  rules,
};

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
