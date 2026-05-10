// Wave 4.2-A-8c — substituteCallupTokens. Mirror of substituteRsvpTokens
// (8b-b) adapted for academy callup notices. Walks content_sections and
// replaces literal {{callup_*_url}} placeholders in each callup_response
// section with minted token URLs keyed by section.player_id.
//
// Even though academy_callup_notice always emits one callup_response
// section (single player per email), the per-player keying preserves
// symmetry with substituteRsvpTokens — same shape across both kinds.
//
// Field rename callup_token_placeholders -> callup_token_urls so the
// renderer never accidentally emits literal {{...}} strings to a real
// recipient. Renderer reads callup_token_urls; if the field is absent
// (substitution missed), renderer falls back to literal placeholder
// strings — fail-loud signal during smoke testing.

export function substituteCallupTokens(content_sections, tokenMapByPlayer) {
  if (!Array.isArray(content_sections)) {
    throw new TypeError('substituteCallupTokens: content_sections must be an array');
  }
  if (!tokenMapByPlayer || typeof tokenMapByPlayer !== 'object') {
    throw new TypeError('substituteCallupTokens: tokenMapByPlayer must be an object');
  }

  return content_sections.map((section) => {
    if (section?.kind !== 'callup_response') return section;
    if (!section.callup_token_placeholders) return section;

    const tokens = tokenMapByPlayer[section.player_id];
    if (!tokens) {
      throw new Error(`substituteCallupTokens: no token entry for player_id ${section.player_id}`);
    }
    for (const k of ['accept', 'decline']) {
      if (typeof tokens[k] !== 'string') {
        throw new TypeError(`substituteCallupTokens: tokens.${k} for player_id ${section.player_id} must be a string URL`);
      }
    }

    const { callup_token_placeholders, ...rest } = section;
    void callup_token_placeholders;
    return { ...rest, callup_token_urls: { accept: tokens.accept, decline: tokens.decline } };
  });
}
