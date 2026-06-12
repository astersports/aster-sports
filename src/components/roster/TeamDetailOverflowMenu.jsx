import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus, MoreVertical } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { isStaff } from '../../lib/permissions';
import BottomSheet from '../shared/BottomSheet';
import SubscribeSheet from '../shared/SubscribeSheet';

// 2026-05-21 (Teams PR C / §9.3) — overflow menu in the back-chevron
// strip. Per CLAUDE.md §16.14: destructive / secondary actions live in
// an overflow menu, not as floating chrome on the page.
//
// F-S1 + SD-16 ph1 (PR-F', 2026-06-12): the parent menu no longer
// duplicates the bottom nav (its only items were "View records" /
// "View full schedule" — the operator's smoke-walk finding). Parents
// now get ONE item: Subscribe to calendar — the family-feed entry
// point (F-S3). The guardian token mints lazily via the authed RPC on
// first open. Staff keep the management items.
export default function TeamDetailOverflowMenu({ team, role }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [familyToken, setFamilyToken] = useState(null);

  const close = () => setOpen(false);
  const go = (path) => { navigator.vibrate?.(10); close(); navigate(path); };

  const openFamilySubscribe = async () => {
    navigator.vibrate?.(10);
    close();
    if (!familyToken) {
      const { data, error } = await supabase.rpc('get_or_create_family_feed_token');
      if (error || !data) { console.warn('family feed token:', error?.message || 'no guardian row'); return; }
      setFamilyToken(data);
    }
    setSubscribeOpen(true);
  };

  const items = [];
  if (role === 'parent') {
    items.push({ key: 'subscribe', label: 'Subscribe to calendar', icon: CalendarPlus, onClick: openFamilySubscribe });
  } else {
    items.push({ key: 'records', label: 'View records', onClick: () => go(`/records?team=${team?.id}`) });
    items.push({ key: 'schedule', label: 'View full schedule', onClick: () => go(`/schedule?team=${team?.id}`) });
    if (role === 'admin') {
      items.push({ key: 'edit', label: 'Edit team', onClick: () => go('/admin/teams') });
    }
    if (isStaff(role)) {
      items.push({ key: 'tournaments', label: 'Tournaments', onClick: () => go(`/teams/${team?.id}/tournaments`) });
    }
  }

  return (
    <>
      <button type="button" onClick={() => { navigator.vibrate?.(10); setOpen(true); }}
        aria-label="Team actions"
        className="as-press"
        style={{ minWidth: 44, minHeight: 44, padding: 0, background: 'none', border: 'none', color: 'var(--as-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <MoreVertical size={20} strokeWidth={1.75} aria-hidden="true" />
      </button>
      <BottomSheet open={open} onClose={close} initialHeight="40%" expandedHeight="60%">
        <div style={{ padding: '4px 0 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--as-text-tertiary)', padding: '8px 4px' }}>
            {team?.name}
          </div>
          {items.map((it) => (
            <button key={it.key} type="button" onClick={it.onClick}
              className="as-press"
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', minHeight: 44, padding: '0 8px', background: 'none', border: 'none', borderTop: '1px solid var(--as-border-subtle)', fontSize: 15, color: 'var(--as-text-primary)' }}>
              {it.icon && <it.icon size={18} strokeWidth={1.75} color="var(--as-text-secondary)" aria-hidden="true" />}
              {it.label}
            </button>
          ))}
        </div>
      </BottomSheet>
      <SubscribeSheet open={subscribeOpen} onClose={() => setSubscribeOpen(false)}
        feedFn="family-feed" feedToken={familyToken} title="Your family calendar" />
    </>
  );
}
