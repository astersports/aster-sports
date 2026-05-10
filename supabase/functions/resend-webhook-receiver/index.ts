// L99 wave 4.1+4.2 foundation step F2: resend-webhook-receiver
// Anonymous endpoint (verify_jwt:false). Auth via Svix signature header.
// Resend posts events here for delivery, opens, bounces, complaints.
// Updates comms_message_recipients with delivery_status + opened_at.
//
// CONFIGURATION:
//   1. Frank sets RESEND_WEBHOOK_SECRET env var on this function
//   2. Frank registers webhook in Resend dashboard pointing to:
//      https://vrwwpsbfbnveawqwbdmj.supabase.co/functions/v1/resend-webhook-receiver
//   3. Resend gives a signing secret — paste into RESEND_WEBHOOK_SECRET
//
// Until configured, function rejects all requests as unauthorized.
// Pattern: invite-parent style shared-secret/signed-payload auth.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Webhook } from "https://esm.sh/svix@1.21.0";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const secret = Deno.env.get("RESEND_WEBHOOK_SECRET");
  if (!secret) {
    console.error("RESEND_WEBHOOK_SECRET env not set");
    return json({ error: "Webhook not configured" }, 503);
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return json({ error: "Missing svix headers" }, 401);
  }

  const payload = await req.text();

  let evt: any;
  try {
    const wh = new Webhook(secret);
    evt = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (err) {
    console.error("svix verify failed:", err);
    return json({ error: "Invalid signature" }, 401);
  }

  // Resend event format: { type: 'email.delivered'|'email.opened'|'email.bounced'|..., data: {...} }
  // data.email_id is the Resend message ID; we matched email-at-send by recipient email + recent send window.
  // For better tracking, send-tournament-message should store data.email_id in comms_message_recipients (future enhancement).
  // For now: match by email_at_send + recency.

  const eventType: string = evt.type ?? "";
  const data = evt.data ?? {};
  const recipientEmail: string = (data.to?.[0] ?? data.email ?? "").toString().toLowerCase();
  const eventTimestamp: string | undefined = data.created_at ?? evt.created_at;

  if (!recipientEmail) {
    return json({ ok: true, note: "no recipient email in payload" });
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: rec } = await sb.from("comms_message_recipients")
    .select("id, opened_at")
    .eq("email_at_send", recipientEmail)
    .gte("created_at", sevenDaysAgo)
    .order("created_at", { ascending: false })
    .limit(1).maybeSingle();

  if (!rec) {
    return json({ ok: true, note: "no matching recipient row" });
  }

  let update: Record<string, unknown> = {};
  if (eventType === "email.delivered") {
    update.delivery_status = "delivered";
  } else if (eventType === "email.opened") {
    if (!rec.opened_at) {
      update.opened_at = eventTimestamp ?? new Date().toISOString();
    }
  } else if (eventType === "email.bounced" || eventType === "email.complained") {
    update.delivery_status = eventType === "email.bounced" ? "bounced" : "complained";
  } else {
    return json({ ok: true, note: "event type not tracked: " + eventType });
  }

  if (Object.keys(update).length === 0) {
    return json({ ok: true, note: "no fields to update" });
  }

  const { error: updateErr } = await sb.from("comms_message_recipients")
    .update(update).eq("id", rec.id);

  if (updateErr) {
    console.error("webhook update failed:", updateErr);
    return json({ error: updateErr.message }, 500);
  }

  return json({ ok: true, recipient_id: rec.id, applied: update });
});
