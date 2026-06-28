// Renderer — Brand footer ("ASTER AAU | GROW YOUR GAME · LEAVE
// YOUR LEGACY"). Wave 5 (cutover wave PR 1) — separate from the
// existing footer renderer (which is logo + contact + unsubscribe
// for weekly_digest etc.). This footer is tagline-only, cobalt-band
// styled, for tournament_prelim and similar marketing-style sends.

import { escapeHtml } from './_util';
import { BRAND_NAVY } from '../colors';

export default function renderBrandFooter(section) {
  const { org_name = 'ASTER AAU', tagline = 'GROW YOUR GAME · OWN YOUR FUTURE' } = section || {};
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ' style="border-collapse:collapse;margin:0;">'
    + `<tr><td align="center" style="padding:16px 28px;background-color:${BRAND_NAVY};font-family:Inter,system-ui,sans-serif;">`
    + `<div style="font-size:12px;font-weight:700;color:#ffffff;letter-spacing:2px;text-transform:uppercase;line-height:1.5;">${escapeHtml(org_name)} | ${escapeHtml(tagline)}</div>`
    + '</td></tr></table>';
  return { html, plainText: `${org_name} | ${tagline}` };
}
