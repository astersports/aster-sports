// Free-text wrapper F1 — Stats narrative paragraph.
// Operator-typed prose. Single <p>, navy text, 14px / 1.6 line-height.
//
// PR-D token chip — body action tokens. A {{token:<kind>_url}} placeholder
// in the body renders as a real cobalt pill BUTTON (.prevbtn equivalent) to
// the family. Per AP #29 the renderer reads body_token_urls ONLY; if a
// token's URL is missing it emits the literal {{token:<kind>_url}} string as
// the href (fail-loud — an unsubstituted placeholder in a real email is the
// unmissable smoke-test signal). Substitution happens in the send pipeline
// via substituteBodyTokens; compose stays pure.

import { escapeHtml } from './_util';
import { COBALT } from '../colors';
import { BODY_TOKENS, splitBodyTokens, TOKEN_PLACEHOLDER } from '../substitution/bodyTokens';

const BTN = [
  'display:inline-block', `background-color:${COBALT}`, 'color:#ffffff',
  'font-weight:700', 'font-size:12.5px', 'border-radius:999px',
  'padding:6px 13px', 'text-decoration:none', 'line-height:1.2',
].join(';');

function tokenHref(kind, urls) {
  const url = urls?.[kind];
  return typeof url === 'string' && url ? url : TOKEN_PLACEHOLDER(kind);
}

export default function render(section) {
  const body = section?.body || '';
  const urls = section?.body_token_urls || null;
  const P = 'font-family:Inter,system-ui,sans-serif;font-size:14px;color:#0f172a;line-height:1.6;margin:8px 0;padding:8px 0;';

  // Split into paragraphs on blank line(s) so the AI's paragraph structure
  // survives. HTML collapses raw newlines, which rendered a multi-paragraph
  // narrative as one run-on blob (Frank-reported 2026-06-08). A single-paragraph
  // body (no blank line) renders exactly as before: one <p>.
  const paras = body.split(/\n\s*\n+/).map((p) => p.trim()).filter(Boolean);
  const blocks = paras.length ? paras : [body];

  function htmlInner(text) {
    const segments = splitBodyTokens(text);
    if (!segments.some((s) => s.token)) return escapeHtml(text);
    return segments.map((s) => s.token
      ? `<a href="${escapeHtml(tokenHref(s.token, urls))}" style="${BTN}">${escapeHtml(BODY_TOKENS[s.token].label)}</a>`
      : escapeHtml(s.text)).join('');
  }
  function plainInner(text) {
    const segments = splitBodyTokens(text);
    if (!segments.some((s) => s.token)) return text;
    return segments.map((s) => s.token ? `${BODY_TOKENS[s.token].label}: ${tokenHref(s.token, urls)}` : s.text).join('');
  }

  const html = blocks.map((b) => `<p style="${P}">${htmlInner(b)}</p>`).join('');
  const plainText = blocks.map(plainInner).join('\n\n');

  return { html, plainText };
}
