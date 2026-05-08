// Drains queued recipients for a tournament_messages row and dispatches
// via Resend in a single batch call. Per-recipient status updates so a
// single bounce doesn't fail the whole send.
//
// Caller must be admin or coach in the message's org_id.
// Body: { message_id: uuid, dry_run?: boolean }
// Returns: { ok: boolean, sent: int, failed: int, errors: string[] }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FROM_EMAIL = "briefings@legacyhoopers.org";
const FROM_NAME = "Coach Frank · Legacy Hoopers";
const REPLY_TO = "fsamaritano@gmail.com";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "No auth header" }, 401);

  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: authErr } = await supabaseAuth.auth.getUser();
  if (authErr || !user) return json({ error: "Invalid auth" }, 401);

  let body: { message_id?: string; dry_run?: boolean };
  try { body = await req.json(); }
  catch { return json({ error: "Invalid JSON body" }, 400); }
  if (!body.message_id) return json({ error: "message_id required" }, 400);

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: message, error: msgErr } = await sb
    .from("tournament_messages")
    .select("id, org_id, subject, body_html, body_plain, sent_at")
    .eq("id", body.message_id).single();
  if (msgErr || !message) return json({ error: "Message not found" }, 404);
  if (message.sent_at) return json({ error: "Already sent" }, 409);

  const { data: roles } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", message.org_id)
    .in("role", ["admin", "coach"]);
  if (!roles || roles.length === 0) return json({ error: "Not authorized" }, 403);

  const { data: recipients, error: recErr } = await sb
    .from("tournament_message_recipients")
    .select("id, email_at_send")
    .eq("message_id", body.message_id)
    .eq("delivery_status", "queued");
  if (recErr) return json({ error: recErr.message }, 500);
  if (!recipients || recipients.length === 0) return json({ error: "No queued recipients" }, 400);
  if (recipients.length > 100) return json({ error: "Batch limit 100; chunk required" }, 400);

  if (body.dry_run) return json({ ok: true, dry_run: true, would_send: recipients.length });

  const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
  const fromHeader = `${FROM_NAME} <${FROM_EMAIL}>`;

  const batch = recipients.map((r) => ({
    from: fromHeader,
    to: [r.email_at_send],
    subject: message.subject,
    html: message.body_html,
    text: message.body_plain,
    reply_to: REPLY_TO,
  }));

  const { data: batchData, error: batchErr } = await resend.batch.send(batch);

  const errors: string[] = [];
  let sent = 0;
  let failed = 0;

  if (batchErr) {
    failed = recipients.length;
    errors.push(batchErr.message ?? "Batch rejected");
    await sb.from("tournament_message_recipients")
      .update({ delivery_status: "failed", delivery_method: "resend_api" })
      .in("id", recipients.map((r) => r.id));
  } else {
    const updates = (batchData?.data ?? []).map((res: any, i: number) => {
      const recipientId = recipients[i].id;
      if (res?.id) {
        sent++;
        return sb.from("tournament_message_recipients")
          .update({ delivery_status: "sent", delivery_method: "resend_api" })
          .eq("id", recipientId);
      } else {
        failed++;
        errors.push(`${recipients[i].email_at_send}: ${res?.error ?? "unknown"}`);
        return sb.from("tournament_message_recipients")
          .update({ delivery_status: "failed", delivery_method: "resend_api" })
          .eq("id", recipientId);
      }
    });
    await Promise.all(updates);
  }

  await sb.from("tournament_messages")
    .update({
      sent_at: new Date().toISOString(),
      sent_by: user.id,
      recipient_count: recipients.length,
      delivery_method: "resend_api",
    })
    .eq("id", body.message_id);

  return json({ ok: failed === 0, sent, failed, errors });
});
