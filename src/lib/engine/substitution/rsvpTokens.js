// Wave 4.2-A-8b-b — substituteRsvpTokens. Pure function that walks
// content_sections and replaces literal {{rsvp_*_url}} placeholders
// in each rsvp_request section with minted token URLs keyed by the
// section's player_id. Used by sendRsvpNudge between compose and
// queue, after per-kid mint via mint_rsvp_token RPC.
//
// Field rename rsvp_token_placeholders -> rsvp_token_urls so the
// renderer never accidentally emits literal {{...}} strings to a
// real recipient. Renderer reads rsvp_token_urls; if the field is
// absent (substitution missed), renderer falls back to literal
// placeholder strings — fail-loud signal during smoke testing.

export function substituteRsvpTokens(content_sections, tokenMapByPlayer) {
  if (!Array.isArray(content_sections)) {
    throw new TypeError('substituteRsvpTokens: content_sections must be an array');
  }
  if (!tokenMapByPlayer || typeof tokenMapByPlayer !== 'object') {
    throw new TypeError('substituteRsvpTokens: tokenMapByPlayer must be an object');
  }

  return content_sections.map((section) => {
    if (section?.kind !== 'rsvp_request') return section;
    if (!section.rsvp_token_placeholders) return section;

    const tokens = tokenMapByPlayer[section.player_id];
    if (!tokens) {
      throw new Error(`substituteRsvpTokens: no token entry for player_id ${section.player_id}`);
    }
    for (const k of ['going', 'maybe', 'not_going']) {
      if (typeof tokens[k] !== 'string') {
        throw new TypeError(`substituteRsvpTokens: tokens.${k} for player_id ${section.player_id} must be a string URL`);
      }
    }

    const { rsvp_token_placeholders, ...rest } = section;
    void rsvp_token_placeholders;
    return { ...rest, rsvp_token_urls: { going: tokens.going, maybe: tokens.maybe, not_going: tokens.not_going } };
  });
}
