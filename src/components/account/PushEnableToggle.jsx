// Wave C PR B — device-level "push notifications on this device" toggle.
// Does the real OS permission + pushManager.subscribe + push_subscriptions
// row (the category switches in NotificationPrefs only store which kinds to
// push). Dormant/unsupported states render an explanatory caption rather
// than a dead switch. iOS web push requires an installed PWA — surfaced.

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/useToast';
import { getPushState, subscribeToPush, unsubscribeFromPush } from '../../lib/push';

const card = { backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', padding: '12px 14px', marginBottom: 8 };
const caption = { fontSize: 13, color: 'var(--em-text-secondary)', lineHeight: 1.4 };

export default function PushEnableToggle({ userId, orgId }) {
  const { showToast } = useToast();
  const [state, setState] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    getPushState().then((s) => { if (!cancelled) setState(s); }).catch(() => { if (!cancelled) setState('unsupported'); });
    return () => { cancelled = true; };
  }, []);

  if (state === 'loading') return null;
  if (state === 'unsupported') {
    return <div style={card}><div style={caption}>To get push notifications on iPhone, add this app to your Home Screen (Share → Add to Home Screen), then reopen it and turn this on.</div></div>;
  }

  const on = state === 'on';
  const busy = state === 'busy';
  const denied = state === 'denied';

  const handle = async () => {
    if (denied) { showToast('Notifications are blocked in your device settings — enable them there first.', 'info'); return; }
    setState('busy');
    try {
      const next = on ? await unsubscribeFromPush({ supabase }) : await subscribeToPush({ supabase, userId, orgId });
      setState(next);
      showToast(next === 'on' ? 'Push notifications on for this device.' : 'Push notifications off.', 'success');
    } catch (e) {
      setState(on ? 'on' : 'off');
      showToast(e.message || "Couldn't change push notifications.", 'error');
    }
  };

  return (
    <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
      <span style={{ fontSize: 15, color: 'var(--em-text-primary)' }}>
        Push on this device{denied ? ' (blocked in settings)' : ''}
      </span>
      <button type="button" onClick={handle} disabled={busy} className="sf-press"
        role="switch" aria-checked={on} aria-label="Push notifications on this device"
        style={{ width: 48, height: 28, borderRadius: 14, border: 'none', padding: 2, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1, backgroundColor: on ? 'var(--em-accent)' : 'var(--em-bg-tertiary)', transition: 'background-color 200ms' }}>
        <div style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'var(--em-text-inverse)', boxShadow: 'var(--em-shadow-sm)', transform: on ? 'translateX(20px)' : 'translateX(0)', transition: 'transform 200ms' }} />
      </button>
    </div>
  );
}
