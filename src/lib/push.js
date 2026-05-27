// Wave C PR B — Web Push subscription helpers (client side).
//
// Gracefully no-op when unsupported OR when VITE_VAPID_PUBLIC_KEY is unset,
// so the UI ships dormant until the env var lands in Vercel. iOS Safari
// only supports web push inside an installed PWA (16.4+); isPushSupported
// reflects runtime capability — subscribe() surfaces a clear error if the
// browser refuses (e.g. not installed to Home Screen).

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export function isPushSupported() {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator
    && typeof window !== 'undefined' && 'PushManager' in window && 'Notification' in window
    && !!VAPID_PUBLIC;
}

// base64url VAPID key -> Uint8Array applicationServerKey (pure).
export function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

// PushSubscription -> push_subscriptions row shape (pure).
export function subscriptionToRow(sub, { userId, orgId }) {
  const json = typeof sub?.toJSON === 'function' ? sub.toJSON() : sub;
  return {
    user_id: userId,
    org_id: orgId || null,
    endpoint: json.endpoint,
    p256dh: json.keys?.p256dh,
    auth_key: json.keys?.auth,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    last_used_at: new Date().toISOString(),
  };
}

export async function getPushState() {
  if (!isPushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return sub ? 'on' : 'off';
}

export async function subscribeToPush({ supabase, userId, orgId }) {
  if (!isPushSupported()) throw new Error('Push notifications aren’t supported on this device.');
  if (!userId) throw new Error('Not signed in.');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notification permission was not granted.');
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
  });
  const { error } = await supabase.from('push_subscriptions').upsert(subscriptionToRow(sub, { userId, orgId }), { onConflict: 'endpoint' });
  if (error) throw error;
  return 'on';
}

export async function unsubscribeFromPush({ supabase }) {
  if (!isPushSupported()) return 'unsupported';
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    const { endpoint } = sub;
    await sub.unsubscribe();
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  }
  return 'off';
}
