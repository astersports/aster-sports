// Wave 3.16 — template registry. Maps kind → array of starter
// templates. schedule_change is intentionally absent (auto-generated
// from the change diff). rsvp_nudge is absent until wave 4.0.

import weeklyDigest from './weeklyDigestTemplates';
import gameRecap from './gameRecapTemplates';
import tournamentPrelim from './tournamentPrelimTemplates';
import tournamentRecap from './tournamentRecapTemplates';
import announcement from './announcementTemplates';
import customMessage from './customMessageTemplates';
import rsvpNudge from './rsvpNudgeTemplates';

export const TEMPLATES_BY_KIND = {
  weekly_digest: weeklyDigest,
  game_recap: gameRecap,
  tournament_prelim: tournamentPrelim,
  tournament_recap: tournamentRecap,
  announcement,
  custom_message: customMessage,
  rsvp_nudge: rsvpNudge,
};

export function getTemplatesForKind(kind) {
  return TEMPLATES_BY_KIND[kind] || [];
}
