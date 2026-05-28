// feedback-token-handler — stub
//
// The cutover-feedback infrastructure was reverted in PR #509
// (2026-05-24) per EMBER_PENDING_LEDGER §4.AJ — Frank's routing:
// "the per-email rating survey served the cutover decision;
// post-cutover it's friction without value." All resolver emits,
// send pipeline, admin UI, src/ helpers, and the
// verify_feedback_token / mint_feedback_token RPCs were removed.
//
// The deployed edge function was missed in the revert sweep
// and was identified by Wave 2.A #11 P0-1 (PR #565). This stub
// replaces the broken function (which was calling a non-existent
// RPC) with an explicit 410 Gone response so any in-flight
// feedback links from pre-revert emails return a clean message
// instead of "Link expired."
//
// Decision pending per §4.AJ §7: whether to rebuild briefing
// feedback in a lighter form or shelve permanently. Until then
// this stub stands.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const HTML_BODY = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Feedback unavailable</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 64px auto; padding: 0 24px; color: #1A1D23; }
    h1 { font-size: 20px; margin: 0 0 12px; }
    p { font-size: 15px; line-height: 1.5; margin: 0; color: #4A5568; }
  </style>
</head>
<body>
  <h1>Feedback no longer available</h1>
  <p>The briefing feedback feature has been retired. Thanks for clicking — your earlier feedback helped shape the platform.</p>
</body>
</html>`;

serve(() => {
  return new Response(HTML_BODY, {
    status: 410,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
});
