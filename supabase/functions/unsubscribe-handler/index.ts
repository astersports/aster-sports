// L99 wave 4.1+4.2 foundation step F1: unsubscribe-handler
// Anonymous endpoint (verify_jwt:false). Auth IS the HMAC-signed token.
// Pattern matches invite-parent + rsvp-token-handler.
//
// GET /unsubscribe-handler?t=<token>
//   1. Verify token via verify_unsubscribe_token RPC
//   2. UPSERT guardian_email_preferences SET unsubscribed_at=now()
//   3. Render HTML confirmation
//   Idempotent: re-tap shows same confirmation.
//
// CRITICAL: Must remain verify_jwt:false. Token IS the auth.
// Anyone can mint a token via mint_unsubscribe_token RPC (granted to authenticated),
// but verify is granted only to service_role and runs server-side here.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function escape(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function htmlPage(title: string, body: string): Response {
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title></head><body style="margin:0;padding:48px 16px;background:#f8fafc;font-family:Inter,system-ui,sans-serif;color:#0f172a;">
<div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:32px 28px;box-shadow:0 1px 2px rgba(0,0,0,0.04);">
  <h1 style="margin:0 0 12px;font-size:22px;color:#1e3a5f;line-height:1.3;font-weight:700;">${escape(title)}</h1>
  <div style="font-size:14px;color:#475569;line-height:1.6;">${body}</div>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px;"/>
  <div style="font-size:12px;color:#94a3b8;line-height:1.5;">Legacy Hoopers · <a href="mailto:admin@legacyhoopers.org" style="color:#4a8fd4;text-decoration:none;">admin@legacyhoopers.org</a></div>
</div></body></html>`;
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

Deno.serve(async (req) => {
  // Per RFC 8058 (One-Click List-Unsubscribe), accept POST too
  const url = new URL(req.url);
  const token = url.searchParams.get("t");

  if (!token) {
    return htmlPage("Invalid link", "This unsubscribe link is missing data. Reply to the email if you need help.");
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: guardianId, error: vErr } = await sb.rpc("verify_unsubscribe_token", { p_token: token });
  if (vErr || !guardianId) {
    return htmlPage("Invalid link", "This unsubscribe link is invalid or expired. Reply to the email if you need help.");
  }

  const { data: existing } = await sb.from("guardian_email_preferences")
    .select("unsubscribed_at").eq("guardian_id", guardianId).maybeSingle();

  if (existing?.unsubscribed_at) {
    return htmlPage(
      "Already unsubscribed",
      "You were unsubscribed on " + new Date(existing.unsubscribed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + ". You will no longer receive briefing emails. Reply to admin@legacyhoopers.org if you want to resubscribe."
    );
  }

  const { error: upsertErr } = await sb.from("guardian_email_preferences").upsert({
    guardian_id: guardianId,
    unsubscribed_at: new Date().toISOString(),
    digest_subscribed: false,
    tournament_subscribed: false,
    updated_at: new Date().toISOString(),
  }, { onConflict: "guardian_id" });

  if (upsertErr) {
    console.error("unsubscribe upsert failed:", upsertErr);
    return htmlPage(
      "Hmm, something went wrong",
      "We could not record your unsubscribe. Please reply to admin@legacyhoopers.org and we will remove you manually."
    );
  }

  return htmlPage(
    "You are unsubscribed",
    "You will no longer receive briefing emails from Legacy Hoopers. If you change your mind, reply to admin@legacyhoopers.org and we will resubscribe you."
  );
});
