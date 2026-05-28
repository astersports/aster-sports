// Wave 4.3-D — academy callup one-tap response handler. Mirror of
// rsvp-token-handler with these differences:
//   - Allowed actions: 'accept' | 'decline' (vs going/maybe/not_going).
//   - Both actions UPSERT event_rsvps: accept→'going', decline→'not_going'.
//   - Decline ALSO removes the player from events.academy_callup_player_ids
//     via apply_callup_decline service-role RPC.
//
// Auth IS the signed token. HMAC verify happens server-side via
// public.verify_callup_token (SECURITY DEFINER). No user JWT required.
//
// Audit trail: callup_token_uses row (nonce + ip + ua + timestamp).
// pii_audit_log NOT used (auth.uid() is NULL from service-role context;
// pii_audit_log.actor_user_id is NOT NULL). Admin-flow add/remove RPCs
// continue to audit pii_audit_log for human-driven changes.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LABELS: Record<string, string> = { accept: "in", decline: "out" };

function escape(s: string): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function htmlPage(title: string, body: string, alts = ""): Response {
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title></head><body style="margin:0;padding:32px 16px;background:#f8fafc;font-family:Inter,system-ui,sans-serif;color:#0f172a;">
<div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;">
  <h1 style="margin:0 0 8px;font-size:22px;color:#4a8fd4;line-height:1.2;">${escape(title)}</h1>
  ${body ? `<div style="font-size:14px;color:#475569;line-height:1.5;margin-bottom:18px;">${body}</div>` : ""}
  ${alts}
  <div style="margin-top:20px;font-size:12px;color:#94a3b8;">Or open the Legacy Hoopers app for the full schedule.</div>
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

function altButtons(currentAction: string, _fnUrl: string, _ctx: { e: string; p: string; g: string }): string {
  // Re-mint not implemented at this layer (mirror rsvp-token-handler's
  // deferred per-action re-mint). We render plain copy so the parent can
  // re-open the original email and tap the inverse action (accept ↔
  // decline). Per-action re-mint deferred to a follow-up.
  void currentAction; void _fnUrl; void _ctx;
  return `<div style="font-size:12px;color:#475569;margin-top:12px;">Need to change? Reply to the email or open the app.</div>`;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("t");
  const action = url.searchParams.get("action");
  if (!token || !action) {
    return htmlPage("Invalid link", "This callup link is missing data.");
  }
  if (!["accept", "decline"].includes(action)) {
    return htmlPage("Invalid link", "Unknown response.");
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: payload, error: vErr } = await sb.rpc("verify_callup_token", { p_token: token });
  if (vErr || !payload) {
    return htmlPage("Link expired", "This callup link is no longer valid. Open the app to respond.");
  }
  if (action !== payload.r) {
    return htmlPage("Mismatch", "This link's button doesn't match its action.");
  }

  if (payload._already_used) {
    const { data: prior, error: priorErr } = await sb.from("callup_token_uses")
      .select("response").eq("nonce", payload.n).single();
    if (priorErr) console.error("[callup-token-handler] prior lookup:", priorErr.message);
    return htmlPage(`Already recorded as ${LABELS[prior?.response || payload.r] || payload.r}`, "");
  }

  // Lock the nonce single-use. If unique-violation races another tap,
  // treat as already-used (mirror rsvp-token-handler).
  const { error: useErr } = await sb.from("callup_token_uses").insert({
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

  // Map callup response -> event_rsvps response.
  const rsvpResponse = payload.r === "accept" ? "going" : "not_going";
  const { error: rsvpErr } = await sb.from("event_rsvps").upsert({
    event_id: payload.e,
    player_id: payload.p,
    guardian_id: payload.g,
    response: rsvpResponse,
    responded_at: new Date().toISOString(),
  }, { onConflict: "event_id,player_id" });
  if (rsvpErr) {
    return htmlPage("Hmm", "Recorded the tap but couldn't update the RSVP. Open the app to confirm.");
  }

  // Decline-only side effect: remove from events.academy_callup_player_ids.
  if (payload.r === "decline") {
    const { error: declineErr } = await sb.rpc("apply_callup_decline", {
      p_event_id: payload.e, p_player_id: payload.p,
    });
    if (declineErr) {
      console.error("apply_callup_decline failed", declineErr);
      // RSVP already saved; user-facing state is correct from their POV.
    }
  }

  // Confirmation page.
  const { data: ctx, error: ctxErr } = await sb.from("events")
    .select("title, start_at, location").eq("id", payload.e).maybeSingle();
  if (ctxErr) console.error("[callup-token-handler] event lookup:", ctxErr.message);
  const { data: player, error: playerErr } = await sb.from("players")
    .select("first_name").eq("id", payload.p).maybeSingle();
  if (playerErr) console.error("[callup-token-handler] player lookup:", playerErr.message);

  const playerName = player?.first_name || "Your player";
  const verbPhrase = payload.r === "accept" ? "is in" : "is out";
  const eventLine = ctx ? `${ctx.title || "Event"} · ${new Date(ctx.start_at).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}${ctx.location ? " · " + escape(ctx.location) : ""}` : "";
  return htmlPage(
    `Got it — ${escape(playerName)} ${verbPhrase}`,
    eventLine,
    altButtons(payload.r, url.origin + url.pathname, { e: payload.e, p: payload.p, g: payload.g }),
  );
});
