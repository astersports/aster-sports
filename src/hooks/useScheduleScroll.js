import { useEffect, useRef } from 'react';

// Two bundled effects for the schedule screen:
// 1) Save the <main> scrollTop to sessionStorage continuously.
// 2) On first ready render (after loading flips false), either restore
//    the saved scroll OR scroll to today's date-group. Clears the
//    saved value after restoring so a fresh visit later scrolls to
//    today as expected. Runs once per mount via an internal ref.
export function useScheduleScroll(loading, ready = true) {
  const didInit = useRef(false);

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
    console.log('[scheduleScroll] effect fire', { loading, ready, didInit: didInit.current });
    if (loading || !ready || didInit.current) return;
    didInit.current = true;

    const main = document.querySelector('main');
    let saved = null;
    try { saved = sessionStorage.getItem('sf.schedule.scroll'); } catch { /* ignore */ }
    console.log('[scheduleScroll] main=', !!main, 'saved=', saved);
    if (saved !== null && main) {
      const n = parseInt(saved, 10);
      if (!Number.isNaN(n)) {
        main.scrollTop = n;
        try { sessionStorage.removeItem('sf.schedule.scroll'); } catch { /* ignore */ }
        console.log('[scheduleScroll] restored to', n, '— skipping today scroll');
        return;
      }
    }
    const today = new Date().toISOString().slice(0, 10);
    const target = document.querySelector(`[data-date-group="${today}"]`);
    const allGroups = Array.from(document.querySelectorAll('[data-date-group]')).map((e) => e.getAttribute('data-date-group'));
    console.log('[scheduleScroll] today=', today, 'targetFound=', !!target, 'allGroups=', allGroups);
    if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, [loading, ready]);
}
