// L99 wave 4.1+4.2 foundation step F1: unsubscribe-handler
// Anonymous endpoint (verify_jwt:false). Auth IS the HMAC-signed token.
// Pattern matches invite-parent + rsvp-token-handler.
//
// GET /unsubscribe-handler?t=<token>
//   1. Verify token via verify_unsubscribe_token RPC
//   2. Resolve guardian's org → name + reply-to email (Wave 3.B #28 P0-5)
//   3. UPSERT guardian_email_preferences SET unsubscribed_at=now()
//   4. Render HTML confirmation with the org's identity
//   Idempotent: re-tap shows same confirmation.
//
// CRITICAL: Must remain verify_jwt:false. Token IS the auth.
// Anyone can mint a token via mint_unsubscribe_token RPC (granted to authenticated),
// but verify is granted only to service_role and runs server-side here.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const FALLBACK_ORG_NAME = "your team";
const FALLBACK_REPLY_TO = "noreply@astersports.app";

function escape(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function htmlPage(title: string, body: string, orgName: string, replyEmail: string): Response {
  const orgN = escape(orgName);
  const orgEmail = escape(replyEmail);
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title></head><body style="margin:0;padding:48px 16px;background:#f8fafc;font-family:Inter,system-ui,sans-serif;color:#0f172a;">
<div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:32px 28px;box-shadow:0 1px 2px rgba(0,0,0,0.04);">
  <h1 style="margin:0 0 12px;font-size:22px;color:#0f172a;line-height:1.3;font-weight:700;">${escape(title)}</h1>
  <div style="font-size:14px;color:#475569;line-height:1.6;">${body}</div>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px;"/>
  <div style="font-size:12px;color:#94a3b8;line-height:1.5;">${orgN} · <a href="mailto:${orgEmail}" style="color:#4a8fd4;text-decoration:none;">${orgEmail}</a></div>
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

// Per Wave 3.B #28 P0-5: render org identity from the guardian's org so a
// future second tenant's parent doesn't see "Aster AAU" in their
// unsubscribe page. Fallbacks are intentionally generic ("your team",
// platform sender) rather than tenant-named so a missing-row case never
// leaks the wrong org's identity.
async function loadOrgContext(sb: SupabaseClient, guardianId: string): Promise<{ orgName: string; replyEmail: string }> {
  const { data: g, error: gErr } = await sb.from("guardians").select("org_id").eq("id", guardianId).maybeSingle();
  if (gErr || !g?.org_id) return { orgName: FALLBACK_ORG_NAME, replyEmail: FALLBACK_REPLY_TO };
  const orgId = g.org_id as string;
  const [{ data: org }, { data: settings }] = await Promise.all([
    sb.from("organizations").select("name").eq("id", orgId).maybeSingle(),
    sb.from("organization_settings").select("reply_to_email").eq("organization_id", orgId).maybeSingle(),
  ]);
  return {
    orgName: (org?.name as string | undefined) ?? FALLBACK_ORG_NAME,
    replyEmail: (settings?.reply_to_email as string | undefined) ?? FALLBACK_REPLY_TO,
  };
}

Deno.serve(async (req) => {
  // Per RFC 8058 (One-Click List-Unsubscribe), accept POST too
  const url = new URL(req.url);
  const token = url.searchParams.get("t");

  if (!token) {
    return htmlPage("Invalid link", "This unsubscribe link is missing data. Reply to the email if you need help.", FALLBACK_ORG_NAME, FALLBACK_REPLY_TO);
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: guardianId, error: vErr } = await sb.rpc("verify_unsubscribe_token", { p_token: token });
  if (vErr || !guardianId) {
    return htmlPage("Invalid link", "This unsubscribe link is invalid or expired. Reply to the email if you need help.", FALLBACK_ORG_NAME, FALLBACK_REPLY_TO);
  }

  const { orgName, replyEmail } = await loadOrgContext(sb, guardianId);

  const { data: existing, error: existingErr } = await sb.from("guardian_email_preferences")
    .select("unsubscribed_at").eq("guardian_id", guardianId).maybeSingle();
  if (existingErr) console.error("[unsubscribe-handler] preference lookup:", existingErr.message);

  if (existing?.unsubscribed_at) {
    return htmlPage(
      "Already unsubscribed",
      "You were unsubscribed on " + new Date(existing.unsubscribed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" }) + `. You will no longer receive briefing emails. Reply to ${escape(replyEmail)} if you want to resubscribe.`,
      orgName,
      replyEmail,
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
      `We could not record your unsubscribe. Please reply to ${escape(replyEmail)} and we will remove you manually.`,
      orgName,
      replyEmail,
    );
  }

  return htmlPage(
    "You are unsubscribed",
    `You will no longer receive briefing emails from ${escape(orgName)}. If you change your mind, reply to ${escape(replyEmail)} and we will resubscribe you.`,
    orgName,
    replyEmail,
  );
});
