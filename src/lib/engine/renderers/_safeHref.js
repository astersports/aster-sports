// Scheme allowlist for email hrefs. escapeHtml quote-escapes the value but
// does NOT validate the URL scheme — a `javascript:` (or `data:`) URL would
// survive escaping and render as a live link. safeHref gates the scheme:
// only http(s) and mailto pass; anything else collapses to '#'. Callers
// still escapeHtml the returned value before interpolating into the href
// attribute.
export function safeHref(url) {
  const trimmed = (url == null ? '' : String(url)).trim();
  return /^(https?:|mailto:)/i.test(trimmed) ? trimmed : '#';
}
