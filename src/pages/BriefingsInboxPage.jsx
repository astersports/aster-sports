// Wave 3.12 — unified inbox shell. URL ?tab= drives selection. Hosts
// hero, tabs, search, filters, and the active tab's content.
//
// Wave 4.1b §3 — Bug C: URL params (?draft_id, ?kind, ?anchor_kind,
// ?anchor_id) now open the composer pre-populated. §6.F: Compose tab
// renamed to Drafts (in-progress drafts only). §2: pilot mode chip
// surfaced via BriefingsHero when org pilot mode is enabled.
//
// Wave 4.4-B Session 1: deep-link parsing extracted to
// useBriefingDeepLink hook (new + legacy taxonomies, /compose path
// auto-opens composer). Closing the composer when on /compose
// navigates back to /admin/briefings so the URL stays consistent.

import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBriefingDeepLink } from '../hooks/useBriefingDeepLink';
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

export default function BriefingsInboxPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { orgId } = useAuth();
  const { pilotModeEnabled } = useOrgSettings(orgId);
  const tab = searchParams.get('tab') || 'active';
  const { filters, update: updateFilters, clear: clearFilters } = useBriefingFilters();
  const [search, setSearch] = useState('');
  const [composer, setComposer] = useState(null); // null | { kind, anchor_kind, anchor_id, draft_id }
  const deepLink = useBriefingDeepLink();

  const { rows: dbRows } = useInboxQueue({
    orgId,
    kind: filters.kind,
    teamIds: filters.teams,
    dateRange: filters.dateRange,
  });
  const { items: synthetic } = useNeedsBriefing({ orgId });
  const activeCount = useMemo(() => {
    const all = [...(dbRows || []), ...(synthetic || [])];
    return all.filter(isActiveBadgeItem).length;
  }, [dbRows, synthetic]);
  // Wave 4.8 6c — drafts come from the RPC tagged source='comms_messages';
  // synth rows are tagged source='synthetic' and excluded from this count.
  const draftCount = useMemo(
    () => (dbRows || []).filter((r) => r.source !== 'synthetic' && r.status === 'draft').length,
    [dbRows],
  );

  // Wave 4.4-B Session 1: deep-link parser handles old+new param taxonomy
  // plus /admin/briefings/compose route as a cold-start entry. Auto-open
  // composer + strip params so refresh after dismiss doesn't re-open.
  useEffect(() => {
    if (composer || !deepLink.shouldOpenComposer) return undefined;
    Promise.resolve().then(() => {
      setComposer(deepLink.composerInit);
      deepLink.consume();
    });
    return undefined;
  }, [composer, deepLink]);

  // Close composer: if we arrived via /compose route, redirect to the
  // inbox so the URL stays consistent. Otherwise just close the modal.
  const closeComposer = () => {
    setComposer(null);
    if (deepLink.isComposeRoute) navigate('/admin/briefings', { replace: true });
  };

  const setTab = (next) => {
    const sp = new URLSearchParams(searchParams);
    sp.set('tab', next);
    setSearchParams(sp, { replace: true });
  };

  const onAction = (row, status) => {
    if (status === 'clear_filters') { clearFilters(); setSearch(''); return; }
    if (!row) return;
    // Wave 4.8 6c — synthetic rows from briefing_active_queue have
    // source='synthetic' (id=null). Legacy safety-net rows from
    // useNeedsBriefing have synthetic_id set. Both paths route to
    // composer with anchor pre-fill, NOT draft_id.
    const isSynthetic = row.source === 'synthetic' || !!row.synthetic_id;
    if (isSynthetic) {
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
            onClose={closeComposer}
          />
        </Suspense>
      )}
    </div>
  );
}
