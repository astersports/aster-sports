// Wave 3.12 — unified inbox shell. 3-tab layout (Active / History /
// Compose). URL ?tab= drives selection. Hosts hero, tabs, search,
// filters, and the active tab's content. Mobile FAB persistent.
//
// Replaces the prior tournament-team grouped view. The old
// BriefingTournamentGroup / BriefingRow / DigestComposeButton
// components are kept in repo for reference but no longer routed.

import { lazy, Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

export default function BriefingsInboxPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { orgId } = useAuth();
  const tab = searchParams.get('tab') || 'active';
  const { filters, update: updateFilters, clear: clearFilters } = useBriefingFilters();
  const [search, setSearch] = useState('');
  const [composer, setComposer] = useState(null); // null | { kind, anchor_kind, anchor_id, draft_id }

  // For active count badge — same data ActiveQueue uses, computed up
  // here so InboxTabs can show a count without re-fetching.
  const { rows: dbRows } = useInboxQueue({ orgId });
  const { items: synthetic } = useNeedsBriefing({ orgId });
  const activeCount = useMemo(() => {
    const all = [...(dbRows || []), ...(synthetic || [])];
    return all.filter(isActiveBadgeItem).length;
  }, [dbRows, synthetic]);

  const setTab = (next) => {
    if (next === 'compose') { setComposer({}); return; }
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
        <BriefingsHero activeCount={activeCount} onCompose={() => setComposer({})} />
        <InboxTabs activeTab={tab} activeCount={activeCount} historyCount={0} onChange={setTab} />
        <InboxSearch value={search} onChange={setSearch} placeholder={tab === 'history' ? 'Search subject + body…' : 'Search briefings…'} />
        <InboxFilters filters={filters} onChange={updateFilters} onClear={clearFilters} />
        {tab === 'active' && <ActiveQueue filters={filters} search={search} onAction={onAction} onCompose={() => setComposer({})} onViewHistory={() => setTab('history')} />}
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
