// Cutover PR 7a — Briefing feedback one-tap handler. Public anonymous
// endpoint. Auth IS the signed token: HMAC verify happens server-side
// via public.verify_feedback_token RPC (SECURITY DEFINER, reads secret
// from app_secrets per AP #33).
//
// Flow:
//   GET /feedback-token-handler?t=<token>&r=<1..5>
//   1. Verify token (HMAC valid, not expired, nonce not consumed)
//   2. Confirm URL rating matches token's rating (anti-tamper)
//   3. INSERT briefing_feedback (nonce locks single-use)
//   4. Render confirmation HTML inline (no app shell, no JS)
//
// Idempotent: re-tap of the same star button returns the prior thank-you.
// Different star = different token = different nonce, so re-rating via
// a different button writes a NEW row. Aggregation queries take the
// latest submission per (message_id, recipient_email) as authoritative.
//
// pattern reference: rsvp-token-handler + callup-token-handler (both
// verify_jwt:false anonymous handlers).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RATING_LABELS: Record<number, string> = {
  1: "1 star — Not useful",
  2: "2 stars — Could be better",
  3: "3 stars — Decent",
  4: "4 stars — Good",
  5: "5 stars — Excellent",
};

function htmlPage(title: string, body: string): Response {
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title></head><body style="margin:0;padding:32px 16px;background:#f8fafc;font-family:Inter,system-ui,sans-serif;color:#0f172a;">
<div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;">
  <h1 style="margin:0 0 8px;font-size:22px;color:#4a8fd4;line-height:1.2;">${escape(title)}</h1>
  ${body ? `<div style="font-size:14px;color:#475569;line-height:1.5;margin-bottom:18px;">${body}</div>` : ""}
  <div style="margin-top:20px;font-size:12px;color:#94a3b8;">Thanks for helping us tune the briefings. — Legacy Hoopers</div>
</div></body></html>`;
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function escape(s: string): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("t");
  const ratingParam = url.searchParams.get("r");
  if (!token || !ratingParam) {
    return htmlPage("Invalid link", "This feedback link is missing data.");
  }
  const ratingFromUrl = Number(ratingParam);
  if (!Number.isInteger(ratingFromUrl) || ratingFromUrl < 1 || ratingFromUrl > 5) {
    return htmlPage("Invalid link", "Unknown rating.");
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: payload, error: vErr } = await sb.rpc("verify_feedback_token", { p_token: token });
  if (vErr || !payload) {
    return htmlPage("Link expired", "This feedback link is no longer valid. The window for rating closed.");
  }
  if (ratingFromUrl !== payload.r) {
    return htmlPage("Mismatch", "This link's button doesn't match its rating.");
  }

  if (payload._already_used) {
    return htmlPage(`Already recorded: ${RATING_LABELS[payload.r] || payload.r}`, "Your rating for this briefing is saved.");
  }

  const { error: insertErr } = await sb.rpc("apply_feedback_submission", {
    p_nonce: payload.n,
    p_message_id: payload.m,
    p_recipient_email: payload.e,
    p_rating: payload.r,
    p_ip: req.headers.get("x-forwarded-for"),
    p_ua: req.headers.get("user-agent"),
  });
  if (insertErr) {
    // unique_violation (23505) → nonce already exists between verify
    // and insert (rare race). Treat as success: another concurrent
    // tap of the same link landed first.
    if ((insertErr as { code?: string })?.code === "23505") {
      return htmlPage(`Already recorded: ${RATING_LABELS[payload.r] || payload.r}`, "Your rating for this briefing is saved.");
    }
    console.error("[feedback-token-handler] insert error:", insertErr.message);
    return htmlPage("Couldn't save", "We hit a snag saving your rating. Try the link again in a moment.");
  }

  return htmlPage(
    `Thanks — recorded: ${RATING_LABELS[payload.r] || payload.r}`,
    "Your feedback shapes how we tune the briefings going forward.",
  );
});
