// Wave 3.11 follow-up — kind picker (step 1). 8 cards, sorted by
// recently-used, falling back to spec order. Disabled cards (rsvp_nudge
// pre-wave 4.0) show a "Coming soon" badge.

import { Bell, CalendarClock, CalendarDays, Flag, Medal, Megaphone, MessageSquare, Trophy, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { KIND_METADATA, sortKinds } from '../../lib/briefings/kindMetadata';

const ICON_MAP = { Bell, CalendarClock, CalendarDays, Flag, Medal, Megaphone, MessageSquare, Trophy, UserPlus };

const cardStyle = (disabled) => ({
  width: '100%', minHeight: 96, padding: 14, borderRadius: 12,
  border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)',
  display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
  cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1,
  fontFamily: 'inherit',
});
const iconWrap = { width: 40, height: 40, borderRadius: 10, backgroundColor: 'var(--em-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const labelStyle = { fontSize: 16, fontWeight: 600, color: 'var(--em-text-primary)' };
const descStyle = { fontSize: 13, color: 'var(--em-text-secondary)', marginTop: 2 };
const metaStyle = { fontSize: 11, color: 'var(--em-text-tertiary)', marginTop: 4, letterSpacing: '0.04em' };
const badgeStyle = { marginLeft: 'auto', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 9999, backgroundColor: 'var(--em-bg-tertiary)', color: 'var(--em-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' };

function relTime(ms) {
  if (!ms) return '';
  const days = Math.floor((Date.now() - ms) / 86400000);
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

export default function StepKindPicker({ onPick, visibleKinds = null }) {
  const { orgId } = useAuth();
  const [usage, setUsage] = useState({});
  const [counts, setCounts] = useState({});

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (!orgId) return;
      const { data } = await supabase.from('comms_messages').select('kind, sent_at').eq('org_id', orgId).eq('status', 'sent').order('sent_at', { ascending: false }).limit(200);
      if (cancelled) return;
      const u = {}; const c = {};
      (data || []).forEach((row) => {
        const ms = row.sent_at ? new Date(row.sent_at).getTime() : 0;
        if (!u[row.kind] || ms > u[row.kind]) u[row.kind] = ms;
        c[row.kind] = (c[row.kind] || 0) + 1;
      });
      setUsage(u); setCounts(c);
    });
    return () => { cancelled = true; };
  }, [orgId]);

  const ordered = sortKinds(usage).filter((k) => !visibleKinds || visibleKinds.includes(k));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {ordered.map((k) => {
        const m = KIND_METADATA[k];
        if (!m) return null;
        const Icon = ICON_MAP[m.icon] || MessageSquare;
        const last = relTime(usage[k]);
        const ct = counts[k] || 0;
        const meta = ct ? `Last sent ${last} · ${ct} sent` : 'Not sent yet';
        return (
          <button key={k} type="button" className="sf-press" disabled={m.disabled} style={cardStyle(m.disabled)} onClick={() => !m.disabled && onPick(k, m)}>
            <span style={iconWrap}><Icon size={20} strokeWidth={1.75} color="var(--em-accent)" /></span>
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span style={labelStyle}>{m.label}</span>
              <span style={descStyle}>{m.description}</span>
              <span style={metaStyle}>{meta}</span>
            </span>
            {m.badge && <span style={badgeStyle}>{m.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}
