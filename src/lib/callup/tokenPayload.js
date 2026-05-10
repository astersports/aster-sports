// Wave 4.3-D — callup token payload parser. Pure client-side helper
// for previewing a callup token's contents (event_id, player_id,
// guardian_id, response) before submitting. NEVER trust this output
// for state mutations — only the server-side `verify_callup_token`
// RPC verifies the HMAC signature. This helper just decodes the
// payload half of `payload_b64.signature_b64`.
//
// Useful for: rendering "Confirm decline?" UI with the player's
// name resolved before the user clicks (the resolution itself goes
// through a separate authenticated query).

export function parseCallupTokenPayload(token) {
  if (typeof token !== 'string') return null;
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) return null;
  const payloadB64 = token.substring(0, dotIdx);
  try {
    const padded = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - padded.length % 4) % 4);
    const decoded = atob(padded + padding);
    const obj = JSON.parse(decoded);
    if (!obj || typeof obj !== 'object') return null;
    return {
      event_id: obj.e,
      player_id: obj.p,
      guardian_id: obj.g,
      response: obj.r,
      nonce: obj.n,
      expires_at: typeof obj.x === 'number' ? new Date(obj.x * 1000).toISOString() : null,
    };
  } catch {
    return null;
  }
}
