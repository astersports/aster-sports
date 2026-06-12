// ICS calendar export helpers.
//
// Generation core lives in icsCore.js (AP #30 mirror pair with
// supabase/functions/team-feed/_helpers.ts — split 2026-06-12, P0 lane,
// to activate the previously-deferred mirror audit). This file keeps the
// browser-only download wrapper and re-exports the generator so existing
// callers' import paths are unchanged.

import { generateTeamIcs } from './icsCore';

export { generateTeamIcs } from './icsCore';

export function downloadTeamIcs(teamName, events) {
  const ics = generateTeamIcs(teamName, events);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${teamName.replace(/\s+/g, '-')}-schedule.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
