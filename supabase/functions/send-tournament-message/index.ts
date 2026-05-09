// Drains queued recipients for a comms_messages row and dispatches
// via Resend. Per-recipient status updates so a single bounce doesn't
// fail the whole send.
//
// Wave 3: per-recipient body capture (body_html_rendered, body_plain_rendered,
// subject_rendered) for kinds like weekly_digest where each family gets a
// personalized body. Falls back to message-level body when per-recipient
// columns are null. Chunks into batches of 100 (Resend's batch limit) so
// digests with >100 recipients dispatch in multiple calls.
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
const RESEND_BATCH_LIMIT = 100;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "No auth header" }, 401);

  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
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
    .from("comms_messages")
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
    .from("comms_message_recipients")
    .select("id, email_at_send, body_html_rendered, body_plain_rendered, subject_rendered")
    .eq("message_id", body.message_id)
    .eq("delivery_status", "queued");
  if (recErr) return json({ error: recErr.message }, 500);
  if (!recipients || recipients.length === 0) return json({ error: "No queued recipients" }, 400);

  if (body.dry_run) return json({ ok: true, dry_run: true, would_send: recipients.length });

  const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
  const fromHeader = `${FROM_NAME} <${FROM_EMAIL}>`;
  const errors: string[] = [];
  let sent = 0;
  let failed = 0;

  for (const group of chunk(recipients, RESEND_BATCH_LIMIT)) {
    const batch = group.map((r) => ({
      from: fromHeader,
      to: [r.email_at_send],
      subject: r.subject_rendered ?? message.subject,
      html: r.body_html_rendered ?? message.body_html,
      text: r.body_plain_rendered ?? message.body_plain,
      reply_to: REPLY_TO,
    }));
    const { data: batchData, error: batchErr } = await resend.batch.send(batch);
    if (batchErr) {
      failed += group.length;
      errors.push(batchErr.message ?? "Batch rejected");
      await sb.from("comms_message_recipients")
        .update({ delivery_status: "failed", delivery_method: "resend_api" })
        .in("id", group.map((r) => r.id));
      continue;
    }
    const updates = (batchData?.data ?? []).map((res: any, i: number) => {
      const recipientId = group[i].id;
      if (res?.id) {
        sent++;
        return sb.from("comms_message_recipients")
          .update({ delivery_status: "sent", delivery_method: "resend_api" })
          .eq("id", recipientId);
      }
      failed++;
      errors.push(`${group[i].email_at_send}: ${res?.error ?? "unknown"}`);
      return sb.from("comms_message_recipients")
        .update({ delivery_status: "failed", delivery_method: "resend_api" })
        .eq("id", recipientId);
    });
    await Promise.all(updates);
  }

  await sb.from("comms_messages")
    .update({
      sent_at: new Date().toISOString(),
      sent_by: user.id,
      recipient_count: recipients.length,
      delivery_method: "resend_api",
    })
    .eq("id", body.message_id);

  return json({ ok: failed === 0, sent, failed, errors });
});
