// Renderer — standout_moments. Used by tournament_recap composer
// (resolvers/tournamentRecap.js:119). Highlights narrative block.
//
// Shape: { text }

import { escapeHtml } from './_util';
import { TEXT_NAVY, TEXT_SLATE_DARK } from '../colors';

export default function renderStandoutMoments(section) {
  const text = section?.text || '';
  if (!text) return { html: '', plainText: '' };
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:16px 0;">'
    + '<tr><td style="padding:14px 16px;background-color:#fffbeb;border:1px solid #fde68a;border-radius:6px;font-family:Inter,system-ui,sans-serif;">'
    + `<div style="font-size:12px;font-weight:700;letter-spacing:1.5px;color:${TEXT_SLATE_DARK};text-transform:uppercase;line-height:1.2;">STANDOUT MOMENTS</div>`
    + `<div style="font-size:14px;color:${TEXT_NAVY};line-height:1.5;margin-top:6px;white-space:pre-wrap;">${escapeHtml(text)}</div>`
    + '</td></tr></table>';
  return { html, plainText: `STANDOUT MOMENTS\n${text}` };
}
