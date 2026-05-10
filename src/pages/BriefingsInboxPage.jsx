// Wave 3.12 — unified inbox shell. URL ?tab= drives selection. Hosts
// hero, tabs, search, filters, and the active tab's content.
//
// Wave 4.1b §3 — Bug C: URL params (?draft_id, ?kind, ?anchor_kind,
// ?anchor_id) now open the composer pre-populated. §6.F: Compose tab
// renamed to Drafts (in-progress drafts only). §2: pilot mode chip
// surfaced via BriefingsHero when org pilot mode is enabled.

import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrgSettings } from '../hooks/useOrgSettings';
import { useInboxQueue } from '../hooks/useInboxQueue';
import { useNeedsBriefing } from '../hooks/useNeedsBriefing';
import { useBriefingFilters } from '../hooks/useBriefingFilters';
import { isActiveBadgeItem } from '../lib/briefings/statusTable';
import BriefingsHero from '../components/briefings/inbox/BriefingsHero';
import InboxTabs from '../components/briefings/inbox/InboxTabs';
import InboxSearch from '../components/briefings/inbox/InboxSearch';
import InboxFilters from '../components/briefings/inbox/InboxFilters';
import ActiveQueue from '../components/briefings/inbox/ActiveQueue';
import HistoryView from '../components/briefings/inbox/HistoryView';
import ComposeFab from '../components/briefings/inbox/ComposeFab';

const BriefingComposer = lazy(() => import('../components/briefings/BriefingComposer'));

const wrap = { backgroundColor: 'var(--em-bg-page)', minHeight: '100vh' };
const inner = { maxWidth: 760, margin: '0 auto', padding: '0 16px 80px', display: 'flex', flexDirection: 'column', gap: 12 };

const COMPOSER_PARAMS = ['draft_id', 'kind', 'anchor_kind', 'anchor_id'];

export default function BriefingsInboxPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { orgId } = useAuth();
  const { pilotModeEnabled } = useOrgSettings(orgId);
  const tab = searchParams.get('tab') || 'active';
  const { filters, update: updateFilters, clear: clearFilters } = useBriefingFilters();
  const [search, setSearch] = useState('');
  const [composer, setComposer] = useState(null); // null | { kind, anchor_kind, anchor_id, draft_id }

  const { rows: dbRows } = useInboxQueue({ orgId });
  const { items: synthetic } = useNeedsBriefing({ orgId });
  const activeCount = useMemo(() => {
    const all = [...(dbRows || []), ...(synthetic || [])];
    return all.filter(isActiveBadgeItem).length;
  }, [dbRows, synthetic]);
  const draftCount = useMemo(() => (dbRows || []).filter((r) => r.status === 'draft').length, [dbRows]);

  // Bug C — open composer from URL params on first navigation. Strip
  // them after wiring so a refresh after dismissing doesn't re-open.
  // Promise.resolve to defer setState out of the effect body (matches
  // the pattern used in BriefingComposer + useInboxQueue elsewhere).
  useEffect(() => {
    if (composer) return undefined;
    const draftId = searchParams.get('draft_id');
    const kind = searchParams.get('kind');
    const anchorKind = searchParams.get('anchor_kind');
    const anchorId = searchParams.get('anchor_id');
    if (!draftId && !kind && !anchorId) return undefined;
    Promise.resolve().then(() => {
      setComposer({ draft_id: draftId, kind, anchor_kind: anchorKind, anchor_id: anchorId });
      const sp = new URLSearchParams(searchParams);
      COMPOSER_PARAMS.forEach((p) => sp.delete(p));
      setSearchParams(sp, { replace: true });
    });
    return undefined;
  }, [composer, searchParams, setSearchParams]);

  const setTab = (next) => {
    const sp = new URLSearchParams(searchParams);
    sp.set('tab', next);
    setSearchParams(sp, { replace: true });
  };

  const onAction = (row, status) => {
    if (status === 'clear_filters') { clearFilters(); setSearch(''); return; }
    if (!row) return;
    if (row.synthetic_id) {
      setComposer({ kind: row.kind, anchor_kind: row.anchor_kind, anchor_id: row.anchor_id });
    } else {
      setComposer({ draft_id: row.id });
    }
  };

  return (
    <div style={wrap}>
      <div style={inner}>
        <BriefingsHero activeCount={activeCount} onCompose={() => setComposer({})} pilotModeEnabled={pilotModeEnabled} tab={tab} />
        <InboxTabs activeTab={tab} activeCount={activeCount} draftCount={draftCount} historyCount={0} onChange={setTab} />
        <InboxSearch value={search} onChange={setSearch} placeholder={tab === 'history' ? 'Search subject + body…' : 'Search briefings…'} />
        <InboxFilters filters={filters} onChange={updateFilters} onClear={clearFilters} />
        {tab === 'active' && <ActiveQueue filters={filters} search={search} onAction={onAction} onCompose={() => setComposer({})} onViewHistory={() => setTab('history')} />}
        {tab === 'drafts' && <ActiveQueue filters={filters} search={search} onAction={onAction} onCompose={() => setComposer({})} onViewHistory={() => setTab('history')} viewFilter="drafts" />}
        {tab === 'history' && <HistoryView filters={filters} search={search} onCompose={() => setComposer({})} />}
      </div>
      <ComposeFab onClick={() => setComposer({})} />
      {composer && (
        <Suspense fallback={null}>
          <BriefingComposer
            initialKind={composer.kind}
            initialAnchorKind={composer.anchor_kind}
            initialAnchorId={composer.anchor_id}
            initialDraftId={composer.draft_id}
            onClose={() => setComposer(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
