// Wave 4.0 — RSVP one-tap handler. Public anonymous endpoint.
// Auth IS the signed token: HMAC verify happens server-side via
// public.verify_rsvp_token RPC (SECURITY DEFINER, reads secret from
// app.settings.rsvp_token_secret GUC).
//
// Flow:
//   GET /rsvp-token-handler?t=<token>&action=going|maybe|not_going
//   1. Verify token (HMAC valid, not expired, nonce not consumed)
//   2. Confirm URL action matches token's response (anti-tamper)
//   3. INSERT rsvp_token_uses (locks the nonce single-use)
//   4. UPSERT event_rsvps on conflict (event_id, player_id)
//   5. Render confirmation HTML inline (no app shell, no JS)
//
// Idempotent: re-tap returns the prior response without double-inserting.
//
// pattern reference: invite-parent (verify_jwt:false anonymous handler)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LABELS: Record<string, string> = { going: "going", maybe: "maybe", not_going: "out" };

function htmlPage(title: string, body: string, alts = ""): Response {
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title></head><body style="margin:0;padding:32px 16px;background:#f8fafc;font-family:Inter,system-ui,sans-serif;color:#0f172a;">
<div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;">
  <h1 style="margin:0 0 8px;font-size:22px;color:#4a8fd4;line-height:1.2;">${escape(title)}</h1>
  ${body ? `<div style="font-size:14px;color:#475569;line-height:1.5;margin-bottom:18px;">${body}</div>` : ""}
  ${alts}
  <div style="margin-top:20px;font-size:12px;color:#94a3b8;">Or open the app for the full schedule.</div>
</div></body></html>`;
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

function escape(s: string): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function altButtons(currentAction: string, _fnUrl: string, _ctx: { e: string; p: string; g: string }): string {
  // Re-mint not implemented at this layer (would require a second RPC
  // round-trip per render). For 4.0, we render plain copy so the parent
  // can re-open the original email and tap a different button. Per-action
  // re-mint deferred to a follow-up.
  void currentAction; void _fnUrl; void _ctx;
  return `<div style="font-size:12px;color:#475569;margin-top:12px;">Need to change? Reply to the email or open the app.</div>`;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("t");
  const action = url.searchParams.get("action");
  if (!token || !action) {
    return htmlPage("Invalid link", "This RSVP link is missing data.");
  }
  if (!["going", "maybe", "not_going"].includes(action)) {
    return htmlPage("Invalid link", "Unknown response.");
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: payload, error: vErr } = await sb.rpc("verify_rsvp_token", { p_token: token });
  if (vErr || !payload) {
    return htmlPage("Link expired", "This RSVP link is no longer valid. Open the app to RSVP.");
  }
  if (action !== payload.r) {
    return htmlPage("Mismatch", "This link's button doesn't match its action.");
  }

  if (payload._already_used) {
    const { data: prior, error: priorErr } = await sb.from("rsvp_token_uses")
      .select("response").eq("nonce", payload.n).single();
    if (priorErr) console.error("[rsvp-token-handler] prior lookup:", priorErr.message);
    return htmlPage(`Already recorded as ${LABELS[prior?.response || payload.r] || payload.r}`, "");
  }

  const { error: useErr } = await sb.from("rsvp_token_uses").insert({
    nonce: payload.n,
    event_id: payload.e,
    player_id: payload.p,
    guardian_id: payload.g,
    response: payload.r,
    used_from_ip: req.headers.get("x-forwarded-for"),
    used_from_ua: req.headers.get("user-agent"),
  });
  if (useErr) {
    return htmlPage("Already recorded", "");
  }

  const { error: rsvpErr } = await sb.from("event_rsvps").upsert({
    event_id: payload.e,
    player_id: payload.p,
    guardian_id: payload.g,
    response: payload.r,
    responded_at: new Date().toISOString(),
  }, { onConflict: "event_id,player_id" });
  if (rsvpErr) {
    return htmlPage("Hmm", "Recorded the tap but couldn't update the RSVP. Open the app to confirm.");
  }

  const { data: ctx, error: ctxErr } = await sb.from("events")
    .select("title, start_at, location").eq("id", payload.e).maybeSingle();
  if (ctxErr) console.error("[rsvp-token-handler] event lookup:", ctxErr.message);
  const { data: player, error: playerErr } = await sb.from("players")
    .select("first_name").eq("id", payload.p).maybeSingle();
  if (playerErr) console.error("[rsvp-token-handler] player lookup:", playerErr.message);

  const playerName = player?.first_name || "your kid";
  const niceAction = LABELS[payload.r] || payload.r;
  const eventLine = ctx ? `${ctx.title || "Event"} · ${new Date(ctx.start_at).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}${ctx.location ? " · " + escape(ctx.location) : ""}` : "";
  return htmlPage(
    `Got it — ${escape(playerName)} is ${niceAction}`,
    eventLine,
    altButtons(payload.r, url.origin + url.pathname, { e: payload.e, p: payload.p, g: payload.g }),
  );
});
