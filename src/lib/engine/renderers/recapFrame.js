// Renderer — recap frame open/close pair (games_recap / game_recap).
// Wraps the framed recap body in the brand cobalt 2px frame, the same
// "designed object" treatment the tournament briefings read as. Emitted
// as a section pair (frame_open ... frame_close) inside content_sections
// so the frame is KIND-SCOPED — it does not change the shared
// EMAIL_WRAPPER / HTML_OPEN div that every other kind shares.
//
// Light interior by design: white body bg + dark text per element so the
// treatment holds in BOTH light and dark email clients (the mock is dark
// only because Frank's client inverts it; we never bake dark-on-dark
// literals that would render unreadable in a light client). All nested
// recap renderers (band, section_bar, recap_game_cell) carry explicit
// bg + text colors for the same reason.
//
// frame_open: opens an outer cobalt-bordered table + an inner content td.
// frame_close: closes the inner td + outer table. They MUST be emitted as
// a matched pair around the recap sections.

import { BRAND_GOLD } from '../colors';

export function renderRecapFrameOpen() {
  const html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"'
    + ` style="border-collapse:collapse;border:2px solid ${BRAND_GOLD};border-radius:4px;overflow:hidden;background-color:#ffffff;font-family:Inter,system-ui,sans-serif;">`
    + '<tr><td style="padding:0;">';
  return { html, plainText: '' };
}

export function renderRecapFrameClose() {
  return { html: '</td></tr></table>', plainText: '' };
}
