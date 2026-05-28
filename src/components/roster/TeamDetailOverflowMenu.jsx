import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical } from 'lucide-react';
import { isStaff } from '../../lib/permissions';
import BottomSheet from '../shared/BottomSheet';

// 2026-05-21 (Teams PR C / §9.3) — overflow menu in the back-chevron
// strip. Per CLAUDE.md §16.14: destructive / secondary actions live in
// an overflow menu, not as floating chrome on the page. Staff get team
// management items (preserved from the retired CoachQuickActions); all
// roles get "View records" + "View schedule". Per anti-pattern #15 the
// dropdown ships as a BottomSheet (simple dialog, ≤2 items per row).
export default function TeamDetailOverflowMenu({ team, role }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);
  const go = (path) => { navigator.vibrate?.(10); close(); navigate(path); };

  const items = [];
  items.push({ key: 'records', label: 'View records', onClick: () => go(`/records?team=${team?.id}`) });
  items.push({ key: 'schedule', label: 'View full schedule', onClick: () => go(`/schedule?team=${team?.id}`) });
  if (role === 'admin') {
    items.push({ key: 'edit', label: 'Edit team', onClick: () => go('/admin/teams') });
  }
  if (isStaff(role)) {
    items.push({ key: 'tournaments', label: 'Tournaments', onClick: () => go(`/teams/${team?.id}/tournaments`) });
  }

  return (
    <>
      <button type="button" onClick={() => { navigator.vibrate?.(10); setOpen(true); }}
        aria-label="Team actions"
        className="em-press"
        style={{ minWidth: 44, minHeight: 44, padding: 0, background: 'none', border: 'none', color: 'var(--em-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <MoreVertical size={20} strokeWidth={1.75} aria-hidden="true" />
      </button>
      <BottomSheet open={open} onClose={close} initialHeight="40%" expandedHeight="60%">
        <div style={{ padding: '4px 0 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--em-text-tertiary)', padding: '8px 4px' }}>
            {team?.name}
          </div>
          {items.map((it) => (
            <button key={it.key} type="button" onClick={it.onClick}
              className="em-press"
              style={{ display: 'block', width: '100%', textAlign: 'left', minHeight: 44, padding: '0 8px', background: 'none', border: 'none', borderTop: '1px solid var(--em-border-subtle)', fontSize: 15, color: 'var(--em-text-primary)' }}>
              {it.label}
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}
