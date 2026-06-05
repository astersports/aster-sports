// PR-D token chip — body action tokens. Per AP #29, compose stays PURE:
// the narrative body carries LITERAL {{token:<kind>_url}} placeholder
// strings (authored as a chip in the composer); the send pipeline calls
// substituteBodyTokens(content_sections, tokenUrlMap) between compose and
// queue, renaming the field body_token_placeholders -> body_token_urls so
// the renderer never silently emits an unsubstituted {{...}} to a real
// recipient. The renderer reads ONLY body_token_urls; if the field is
// missing it falls back to the literal placeholder string (fail-loud).
//
// FOUR tokens, but only THREE have a real URL source today:
//   rsvp       — per-recipient signed token (mint_rsvp_token); per-player.
//   schedule   — public /schedule/:teamId page (publicUrls); per-team.
//   directions — event location map URL (mapsUrls); per-event.
//   latest_briefing — NO unauthenticated source exists (/inbox is auth-
//     gated). NOT shippable as a link: omitted from BODY_TOKENS so the
//     authoring menu can't insert a dead link. See PR-D report.

export const BODY_TOKENS = {
  rsvp: { label: 'RSVP', scope: 'recipient' },
  schedule: { label: 'Schedule', scope: 'team' },
  directions: { label: 'Directions', scope: 'event' },
};

export const TOKEN_PLACEHOLDER = (kind) => `{{token:${kind}_url}}`;

// Split a body string into ordered text / token segments. A token segment
// is { token: '<kind>' }; a text segment is { text: '<string>' }. Unknown
// token kinds are left as literal text (never fabricated into a link).
export function splitBodyTokens(text) {
  const src = String(text ?? '');
  const re = /\{\{token:([a-z_]+)_url\}\}/g;
  const segments = [];
  let last = 0;
  let m;
  while ((m = re.exec(src)) !== null) {
    if (m.index > last) segments.push({ text: src.slice(last, m.index) });
    if (BODY_TOKENS[m[1]]) segments.push({ token: m[1] });
    else segments.push({ text: m[0] });
    last = re.lastIndex;
  }
  if (last < src.length) segments.push({ text: src.slice(last) });
  return segments;
}

// AP #29 substitution. Walks content_sections; any section carrying
// body_token_placeholders (the list of token kinds present in its body)
// gets a body_token_urls map resolved from tokenUrlMap. Different field
// name (placeholders -> urls), new object (no in-place mutation).
export function substituteBodyTokens(content_sections, tokenUrlMap) {
  if (!Array.isArray(content_sections)) {
    throw new TypeError('substituteBodyTokens: content_sections must be an array');
  }
  if (!tokenUrlMap || typeof tokenUrlMap !== 'object') {
    throw new TypeError('substituteBodyTokens: tokenUrlMap must be an object');
  }
  return content_sections.map((section) => {
    if (!Array.isArray(section?.body_token_placeholders)) return section;
    const urls = {};
    for (const kind of section.body_token_placeholders) {
      if (!BODY_TOKENS[kind]) {
        throw new Error(`substituteBodyTokens: unknown token kind "${kind}"`);
      }
      const url = tokenUrlMap[kind];
      if (typeof url !== 'string' || !url) {
        throw new TypeError(`substituteBodyTokens: tokenUrlMap.${kind} must be a non-empty URL string`);
      }
      urls[kind] = url;
    }
    const { body_token_placeholders, ...rest } = section;
    void body_token_placeholders;
    return { ...rest, body_token_urls: urls };
  });
}
