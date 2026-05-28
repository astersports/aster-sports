// Wave C PR D — Web Push send. Sends an aes128gcm push to a target
// user's (or org's) push_subscriptions. VAPID keys + the cron_secret
// live in app_secrets (AP #33); inbound auth is the shared cron_secret
// Bearer (verify_jwt:false — config.toml entry + AP #31 audit test).
// Uses the npm web-push library for VAPID JWT (ES256) + RFC 8291
// payload encryption rather than hand-rolling the crypto. Prunes
// 404/410 ("gone") subscriptions so dead devices don't accumulate.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

async function getAppSecret(sb: ReturnType<typeof createClient>, name: string): Promise<string> {
  const { data, error } = await sb.from("app_secrets").select("value").eq("name", name).maybeSingle();
  if (error) throw new Error(`getAppSecret('${name}') failed: ${error.message}`);
  if (!data || data.value === null) {
    throw new Error(`app_secrets.${name} is NULL — provision it via SQL UPDATE before this function can run.`);
  }
  return data.value as string;
}

Deno.serve(async (req) => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

  const presented = req.headers.get("Authorization")?.replace(/^Bearer\s+/, "") ?? "";
  let expectedCron: string;
  try { expectedCron = await getAppSecret(sb, "cron_secret"); }
  catch (e) { return json({ error: (e as Error).message }, 500); }
  if (presented !== expectedCron) return json({ error: "Unauthorized" }, 401);

  let vapidPublic: string;
  let vapidPrivate: string;
  try {
    vapidPublic = await getAppSecret(sb, "vapid_public_key");
    vapidPrivate = await getAppSecret(sb, "vapid_private_key");
  } catch (e) { return json({ error: (e as Error).message }, 500); }
  webpush.setVapidDetails("mailto:info@legacyhoopers.org", vapidPublic, vapidPrivate);

  const payloadIn = await req.json().catch(() => ({}));
  const { user_id, user_ids, org_id, title, body: msgBody, url } = payloadIn as {
    user_id?: string; user_ids?: string[]; org_id?: string; title?: string; body?: string; url?: string;
  };
  if (!title) return json({ error: "title required" }, 400);

  let query = sb.from("push_subscriptions").select("id, endpoint, p256dh, auth_key");
  if (Array.isArray(user_ids) && user_ids.length) query = query.in("user_id", user_ids);
  else if (user_id) query = query.eq("user_id", user_id);
  else if (org_id) query = query.eq("org_id", org_id);
  else return json({ error: "user_id, user_ids, or org_id required" }, 400);

  const { data: subs, error } = await query;
  if (error) return json({ error: error.message }, 500);
  if (!subs || subs.length === 0) return json({ sent: 0, note: "no subscriptions" });

  const payload = JSON.stringify({ title, body: msgBody ?? "", url: url ?? "/" });
  let sent = 0;
  const failures: Array<Record<string, unknown>> = [];
  for (const s of subs) {
    const sub = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } };
    try {
      await webpush.sendNotification(sub, payload);
      sent += 1;
      await sb.from("push_subscriptions").update({ last_used_at: new Date().toISOString() }).eq("id", s.id);
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) {
        await sb.from("push_subscriptions").delete().eq("id", s.id);
        failures.push({ id: s.id, pruned: true });
      } else {
        failures.push({ id: s.id, error: String((e as { body?: string }).body ?? (e as Error).message ?? e).slice(0, 200) });
      }
    }
  }
  return json({ sent, failed: failures.length, failures });
});
