// Wave 3.6 §D4 — universal footer for digest + future kinds.
// Knight logo + Aster AAU wordmark + website link + contact email.
// Email-safe inline-styled HTML; no CSS variables (most clients strip).

import { escapeHtml } from './_util';
import { safeHref } from './_safeHref';
import { BG_PAGE, BORDER_DEFAULT, BRAND_GOLD_TEXT, TEXT_NAVY, TEXT_SLATE_DARK } from '../colors';

function hostFromUrl(url) {
  try { return new URL(url).host.replace(/^www\./, ''); }
  catch { return ''; }
}

export function renderFooter(section) {
  const { logoUrl, orgName, websiteUrl, contactEmail, playerName, teamName } = section || {};
  const logoHtml = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(orgName || 'logo')}" width="120" height="120" style="display:block;border:0;width:120px;height:120px;margin:0 auto 12px auto;" />`
    : '';
  const orgHtml = orgName
    ? `<div style="font-size:13px;font-weight:700;color:${TEXT_NAVY};letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">${escapeHtml(orgName)}</div>`
    : '';
  const websiteHtml = websiteUrl
    ? `<div style="font-size:13px;color:${TEXT_SLATE_DARK};line-height:1.6;margin-bottom:4px;">`
      + `<a href="${escapeHtml(safeHref(websiteUrl))}" target="_blank" rel="noopener" style="color:${BRAND_GOLD_TEXT};text-decoration:none;">${escapeHtml(hostFromUrl(websiteUrl))}</a>`
      + '</div>'
    : '';
  const emailHtml = contactEmail
    ? `<div style="font-size:13px;color:${TEXT_SLATE_DARK};line-height:1.6;">`
      + `<a href="mailto:${escapeHtml(contactEmail)}" style="color:${BRAND_GOLD_TEXT};text-decoration:none;">${escapeHtml(contactEmail)}</a>`
      + '</div>'
    : '';
  // Wave 4.1 §7 — CAN-SPAM unsubscribe block. {{UNSUBSCRIBE_URL}} is
  // substituted per-recipient by the send pipeline (digestSend,
  // scheduleChangeSend, rsvpNudgeSend) after minting a signed token.
  // playerName + teamName are optional context — when present, the
  // copy reads "because [Player] is on the [Team] roster"; when absent,
  // a generic line is used so admin-BCC + preview renders are still
  // valid HTML with a working unsubscribe link.
  const contextLine = (playerName && teamName)
    ? `You are receiving this because ${escapeHtml(playerName)} is on the ${escapeHtml(teamName)} roster${orgName ? ` at ${escapeHtml(orgName)}` : ''}.`
    : `You are receiving this as a member of${orgName ? ` ${escapeHtml(orgName)}` : ' our community'}.`;
  const unsubscribeHtml = '<hr style="border:none;border-top:1px solid ' + BORDER_DEFAULT + ';margin:20px 0;"/>'
    + `<p style="font-size:12px;color:${TEXT_SLATE_DARK};line-height:1.5;margin:0;">`
    + contextLine + '<br/>'
    + `<a href="{{UNSUBSCRIBE_URL}}" style="color:${BRAND_GOLD_TEXT};text-decoration:underline;">Unsubscribe</a>`
    + (contactEmail ? ` &middot; <a href="mailto:${escapeHtml(contactEmail)}" style="color:${BRAND_GOLD_TEXT};text-decoration:underline;">Contact us</a>` : '')
    + '</p>';
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ` style="border-collapse:collapse;margin:32px 0 0 0;background-color:${BG_PAGE};border-top:1px solid ${BORDER_DEFAULT};font-family:Inter,system-ui,sans-serif;">`
    + '<tr><td align="center" style="padding:24px 16px 24px 16px;">'
    + logoHtml + orgHtml + websiteHtml + emailHtml + unsubscribeHtml
    + '</td></tr></table>';
  const plainParts = [
    orgName,
    websiteUrl ? hostFromUrl(websiteUrl) : '',
    contactEmail ? `Contact: ${contactEmail}` : '',
    '',
    contextLine.replace(/<[^>]+>/g, ''),
    'Unsubscribe: {{UNSUBSCRIBE_URL}}',
  ].filter(Boolean);
  return { html, plainText: plainParts.join('\n') };
}
