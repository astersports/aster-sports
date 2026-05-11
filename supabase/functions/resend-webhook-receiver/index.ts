// Wave 4.4-A2 (v3) — Resend webhook receiver, expanded to 8 event types.
// Wave 4.4-A2b (v4) — rank-based delivery_status transitions. Out-of-order
// event arrival (Resend retries, dashboard replays, Svix at-least-once)
// previously corrupted state: an email.delivered arriving after
// email.opened would downgrade delivery_status from 'opened' to
// 'delivered', breaking open-rate analytics. Status now advances only if
// the incoming event's rank exceeds the current row's rank, or if the
// incoming state is terminal (bounced/complained/unsubscribed/failed).
// Timestamps remain idempotent independently (NULL → first-event-wins).
//
// Anonymous endpoint (verify_jwt:false). Auth via svix signature header.
//
// Wave 4.4-A1 (migration 20260511180000) added clicked_at, bounced_at,
// delivered_at, unsubscribed_at, complained_at to comms_message_recipients
// and widened the delivery_status enum to include 'clicked' and
// 'complained'. This receiver writes to those columns per event.
//
// Idempotency: each *_at column is written only if currently NULL.
// Timestamps don't go backwards. Re-delivered events yield no-op responses.
//
// State machine (logical) for delivery_status:
//   queued (0) → sent (1) → delivered (2) → opened (3) → clicked (4)
//                                    ↓
//                          bounced | complained | failed | unsubscribed
//                                                         (rank 100, terminal)
// Terminal states always win, even if current rank is higher. Transient
// signals (email.delivery_delayed) log a warning but don't transition.
//
// Structured logging: every handled event emits one console line with
// event_type, recipient_id, action taken. Failures emit error level.
// Signature verification failures emit 401 + log without leaking secret.
// Suppressed downgrades emit an info log so out-of-order arrivals show
// up in Vercel logs (debugging hook for the rank-comparison logic).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Webhook } from "https://esm.sh/svix@1.21.0";

// Event type → handler config. ts=column name to stamp first-time event;
// status=delivery_status value to write; level=log severity.
// null ts means no timestamp column; null status means no status transition.
const HANDLERS: Record<string, { ts: string | null; status: string | null; level: "info" | "warn" | "error" }> = {
  "email.sent":             { ts: null,              status: "sent",        level: "info" },
  "email.delivered":        { ts: "delivered_at",    status: "delivered",   level: "info" },
  "email.opened":           { ts: "opened_at",       status: "opened",      level: "info" },
  "email.clicked":          { ts: "clicked_at",      status: "clicked",     level: "info" },
  "email.bounced":          { ts: "bounced_at",      status: "bounced",     level: "warn" },
  "email.complained":       { ts: "complained_at",   status: "complained",  level: "warn" },
  "email.delivery_delayed": { ts: null,              status: null,          level: "warn" },
  "email.failed":           { ts: null,              status: "failed",      level: "error" },
};

// Wave 4.4-A2b: rank lookup for the delivery_status state machine.
// Higher rank = later in the lifecycle. Terminal states pinned to 100
// so they win against any current state regardless of progression.
// Status update writes ONLY IF newRank > currentRank OR newRank >= 100.
const STATE_RANK: Record<string, number> = {
  queued: 0, sent: 1, delivered: 2, opened: 3, clicked: 4,
  bounced: 100, complained: 100, unsubscribed: 100, failed: 100,
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function log(level: "info" | "warn" | "error", msg: string, ctx: Record<string, unknown> = {}) {
  const line = `[resend-webhook] ${msg} ${JSON.stringify(ctx)}`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const secret = Deno.env.get("RESEND_WEBHOOK_SECRET");
  if (!secret) { log("error", "RESEND_WEBHOOK_SECRET unset — function not configured"); return json({ error: "Webhook not configured" }, 503); }

  const svixId = req.headers.get("svix-id");
  const svixTs = req.headers.get("svix-timestamp");
  const svixSig = req.headers.get("svix-signature");
  if (!svixId || !svixTs || !svixSig) { log("warn", "missing svix headers"); return json({ error: "Missing svix headers" }, 401); }

  const payload = await req.text();
  let evt: { type?: string; data?: { to?: string[]; email?: string; created_at?: string }; created_at?: string };
  try {
    evt = new Webhook(secret).verify(payload, { "svix-id": svixId, "svix-timestamp": svixTs, "svix-signature": svixSig }) as typeof evt;
  } catch (err) {
    log("error", "svix verify failed", { reason: (err as Error).message });
    return json({ error: "Invalid signature" }, 401);
  }

  const eventType = evt.type ?? "";
  const data = evt.data ?? {};
  const recipientEmail = (data.to?.[0] ?? data.email ?? "").toString().toLowerCase();
  const eventTimestamp = data.created_at ?? evt.created_at ?? new Date().toISOString();

  const handler = HANDLERS[eventType];
  if (!handler) { log("info", "event type not tracked", { event_type: eventType }); return json({ ok: true, note: `event type not tracked: ${eventType}` }); }
  if (!recipientEmail) { log("warn", "no recipient email in payload", { event_type: eventType }); return json({ ok: true, note: "no recipient email in payload" }); }

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  // Wave 4.4-A2b: always read delivery_status (rank comparison) in addition
  // to id and the event's timestamp column. selectCols dedupes via Set so
  // delivery_status doesn't duplicate when handler.ts is null.
  const colSet = new Set<string>(["id", "delivery_status"]);
  if (handler.ts) colSet.add(handler.ts);
  const { data: rec } = await sb.from("comms_message_recipients")
    .select([...colSet].join(", "))
    .eq("email_at_send", recipientEmail)
    .gte("created_at", sevenDaysAgo)
    .order("created_at", { ascending: false })
    .limit(1).maybeSingle();
  if (!rec) { log("warn", "no matching recipient row", { event_type: eventType, email: recipientEmail }); return json({ ok: true, note: "no matching recipient row" }); }

  const recId = (rec as { id: string }).id;
  const update: Record<string, unknown> = {};
  // Idempotent timestamp write (only if column is currently NULL).
  if (handler.ts && !(rec as Record<string, unknown>)[handler.ts]) update[handler.ts] = eventTimestamp;
  // Wave 4.4-A2b: rank-based status update. Advance only if new rank
  // exceeds current rank, OR if the new state is terminal (rank >= 100).
  // Out-of-order arrivals that would downgrade (e.g. delivered after
  // opened) log + skip the status write but still apply the timestamp.
  if (handler.status) {
    const currentStatus = (rec as { delivery_status?: string }).delivery_status || "queued";
    const currentRank = STATE_RANK[currentStatus] ?? 0;
    const newRank = STATE_RANK[handler.status] ?? 0;
    if (newRank > currentRank || newRank >= 100) {
      update.delivery_status = handler.status;
    } else {
      log("info", "status downgrade suppressed", { event_type: eventType, recipient_id: recId, current: currentStatus, attempted: handler.status });
    }
  }
  if (Object.keys(update).length === 0) { log("info", "idempotent no-op", { event_type: eventType, recipient_id: recId }); return json({ ok: true, note: "idempotent no-op", recipient_id: recId }); }

  const { error: updateErr } = await sb.from("comms_message_recipients").update(update).eq("id", recId);
  if (updateErr) { log("error", "update failed", { event_type: eventType, recipient_id: recId, reason: updateErr.message }); return json({ error: updateErr.message }, 500); }

  log(handler.level, "event applied", { event_type: eventType, recipient_id: recId, applied: update });
  return json({ ok: true, recipient_id: recId, applied: update });
});
