import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const DEFAULT_QUIET = {
  weekday: { start: '21:00', end: '07:00' },
  weekend: { start: '22:00', end: '08:00' },
};

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  const ampm = hr >= 12 ? 'PM' : 'AM';
  const h12 = hr % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export default function QuietHoursCard({ userId, orgId }) {
  const [quiet, setQuiet] = useState(DEFAULT_QUIET);

  useEffect(() => {
    if (!userId || !orgId) return;
    supabase.from('user_preferences')
      .select('quiet_hours').eq('user_id', userId).eq('org_id', orgId).maybeSingle()
      .then(({ data }) => {
        if (data?.quiet_hours) setQuiet({ ...DEFAULT_QUIET, ...data.quiet_hours });
      });
  }, [userId, orgId]);

  return (
    <div style={{ backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 15, color: 'var(--em-text-primary)' }}>Weekdays</span>
        <span style={{ fontSize: 13, color: 'var(--em-text-tertiary)' }}>
          {formatTime(quiet.weekday?.start)} – {formatTime(quiet.weekday?.end)}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 15, color: 'var(--em-text-primary)' }}>Weekends</span>
        <span style={{ fontSize: 13, color: 'var(--em-text-tertiary)' }}>
          {formatTime(quiet.weekend?.start)} – {formatTime(quiet.weekend?.end)}
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--em-text-tertiary)', marginTop: 8 }}>
        Notifications are silenced during these hours.
      </div>
    </div>
  );
}
