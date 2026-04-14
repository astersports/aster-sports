import { useEffect } from 'react';

// Two bundled effects for the schedule screen:
// 1) Save the <main> scroll position to sessionStorage continuously so
//    navigating to an event detail and back restores position.
// 2) On first load (when loading flips false), either restore the
//    saved scroll or scroll to today's date-group header.
//
// Scroll container is the app-wide <main> in AppShell; this page has
// no internal scroll container.
export function useScheduleScroll(loading) {
  useEffect(() => {
    const el = document.querySelector('main');
    if (!el) return;
    const save = () => {
      try { sessionStorage.setItem('sf.schedule.scroll', String(el.scrollTop)); } catch { /* ignore */ }
    };
    el.addEventListener('scroll', save, { passive: true });
    return () => el.removeEventListener('scroll', save);
  }, []);

  useEffect(() => {
    if (loading) return;
    const main = document.querySelector('main');
    let saved = null;
    try { saved = sessionStorage.getItem('sf.schedule.scroll'); } catch { /* ignore */ }
    if (saved && main) {
      const n = parseInt(saved, 10);
      if (!Number.isNaN(n) && n > 0) { main.scrollTop = n; return; }
    }
    const today = new Date().toISOString().slice(0, 10);
    const target = document.querySelector(`[data-date-group="${today}"]`);
    if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, [loading]);
}
