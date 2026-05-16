// Renderer — coach_reflection. Used by tournament_recap composer
// (resolvers/tournamentRecap.js:120). Long-form reflection from the
// coach — multi-paragraph voice block.
//
// Shape: { text }

import { escapeHtml } from './_util';
import { BORDER_DEFAULT, TEXT_NAVY, TEXT_SLATE_DARK } from '../colors';

export default function renderCoachReflection(section) {
  const text = section?.text || '';
  if (!text) return { html: '', plainText: '' };
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:16px 0;">'
    + `<tr><td style="padding:16px 18px;background-color:#ffffff;border:1px solid ${BORDER_DEFAULT};border-radius:6px;font-family:Inter,system-ui,sans-serif;">`
    + `<div style="font-size:12px;font-weight:700;letter-spacing:1.5px;color:${TEXT_SLATE_DARK};text-transform:uppercase;line-height:1.2;">COACH REFLECTION</div>`
    + `<div style="font-size:14px;color:${TEXT_NAVY};line-height:1.6;margin-top:8px;white-space:pre-wrap;">${escapeHtml(text)}</div>`
    + '</td></tr></table>';
  return { html, plainText: `COACH REFLECTION\n${text}` };
}
