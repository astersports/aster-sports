// E9: lightweight SEO/meta head management for the public (crawlable,
// unauthenticated) schedule page. Sets document.title, a meta description,
// a canonical link, and Open Graph title/description so a shared link
// renders a meaningful preview. Pure-effect; all writes happen inside
// useEffect (never in render) and are reverted on unmount so the SPA's
// other routes aren't left with a stale head. No Date.now()/Math.random().

import { useEffect } from 'react';
import { publicScheduleUrl } from '../../lib/publicUrls';

function upsertMeta(selector, attrs) {
  let el = document.head.querySelector(selector);
  const created = !el;
  if (!el) {
    el = document.createElement('meta');
    document.head.appendChild(el);
  }
  const prev = {};
  for (const [k, v] of Object.entries(attrs)) {
    prev[k] = el.getAttribute(k);
    el.setAttribute(k, v);
  }
  return () => {
    if (created) { el.remove(); return; }
    for (const [k, v] of Object.entries(prev)) {
      if (v == null) el.removeAttribute(k); else el.setAttribute(k, v);
    }
  };
}

export function usePublicScheduleMeta(team, orgName, teamId) {
  useEffect(() => {
    if (!team) return undefined;
    const title = `${team.name} Schedule${orgName ? ` · ${orgName}` : ''}`;
    const description = `Upcoming games and events for ${team.name}${orgName ? ` (${orgName})` : ''}. View the schedule, download the calendar, or subscribe — no login needed.`;
    const url = publicScheduleUrl(teamId);

    document.title = title;
    const cleanups = [
      upsertMeta('meta[name="description"]', { name: 'description', content: description }),
      upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title }),
      upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description }),
      upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' }),
    ];

    let canonical = document.head.querySelector('link[rel="canonical"]');
    const createdCanonical = !canonical;
    const prevHref = canonical?.getAttribute('href') ?? null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

    return () => {
      document.title = 'Aster Sports';
      cleanups.forEach((fn) => fn());
      if (createdCanonical) canonical.remove();
      else if (prevHref != null) canonical.setAttribute('href', prevHref);
    };
  }, [team, orgName, teamId]);
}
