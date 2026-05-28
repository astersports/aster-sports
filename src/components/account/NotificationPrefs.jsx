import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/useToast';
import LoadingSkeleton from '../shared/LoadingSkeleton';

const CATEGORIES = [
  { key: 'schedule_change', label: 'Schedule changes' },
  { key: 'rsvp_reminder', label: 'RSVP reminders' },
  { key: 'score_published', label: 'Scores published' },
  { key: 'announcement', label: 'Announcements' },
  { key: 'chat_mention', label: 'Chat messages' },
  { key: 'ride_request', label: 'Ride requests' },
  { key: 'volunteer_opportunity', label: 'Volunteer opportunities' },
];

export default function NotificationPrefs({ userId, orgId }) {
  const { showToast } = useToast();
  const [prefs, setPrefs] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !orgId) return;
    supabase.from('user_preferences')
      .select('notification_preferences')
      .eq('user_id', userId).eq('org_id', orgId).maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('NotificationPrefs:', error.message);
        setPrefs(data?.notification_preferences || {});
        setLoading(false);
      });
  }, [userId, orgId]);

  const toggle = useCallback(async (key) => {
    const current = prefs[key]?.push !== false;
    const updated = { ...prefs, [key]: { ...prefs[key], push: !current } };
    setPrefs(updated);
    const { error } = await supabase.from('user_preferences')
      .upsert({ user_id: userId, org_id: orgId, notification_preferences: updated }, { onConflict: 'user_id,org_id' });
    if (error) {
      showToast("Couldn't save preference. Try again?", 'error');
      setPrefs(prefs);
    }
  }, [prefs, userId, orgId, showToast]);

  if (loading) return <LoadingSkeleton variant="card" count={1} />;

  return (
    <div style={{ backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', overflow: 'hidden' }}>
      {CATEGORIES.map((cat, i) => {
        const enabled = prefs[cat.key]?.push !== false;
        return (
          <div key={cat.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', minHeight: 44, borderTop: i === 0 ? 'none' : '1px solid var(--em-border-subtle)' }}>
            <span style={{ fontSize: 15, color: 'var(--em-text-primary)' }}>{cat.label}</span>
            <button type="button" onClick={() => toggle(cat.key)} className="em-press"
              role="switch" aria-checked={enabled} aria-label={`${cat.label} notifications`}
              style={{
                width: 48, height: 28, borderRadius: 14, border: 'none', padding: 2, cursor: 'pointer',
                backgroundColor: enabled ? 'var(--em-accent)' : 'var(--em-bg-tertiary)',
                transition: 'background-color 200ms',
              }}>
              <div style={{
                width: 24, height: 24, borderRadius: 12,
                backgroundColor: 'var(--em-text-inverse)', boxShadow: 'var(--em-shadow-sm)',
                transform: enabled ? 'translateX(20px)' : 'translateX(0)',
                transition: 'transform 200ms',
              }} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
