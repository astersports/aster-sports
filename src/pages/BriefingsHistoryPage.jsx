// §4.AI Option C — PR A. Sent-only briefings history page. Replaces
// the History tab of the retired BriefingsInboxPage. Reuses
// useInboxHistory (which already queries comms_messages directly with
// .eq('status','sent')) + InboxSearch + InboxFilters + HistoryView
// from the legacy inbox tree. The tabs/active-queue/synthetic-row UI
// is gone; only the sent archive remains.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBriefingFilters } from '../hooks/useBriefingFilters';
import AdminBackHeader from '../components/admin/AdminBackHeader';
import InboxSearch from '../components/briefings/inbox/InboxSearch';
import InboxFilters from '../components/briefings/inbox/InboxFilters';
import HistoryView from '../components/briefings/inbox/HistoryView';

const wrap = { backgroundColor: 'var(--as-bg-page)', minHeight: '100vh' };
const inner = { maxWidth: 760, margin: '0 auto', padding: '0 16px 80px', display: 'flex', flexDirection: 'column', gap: 12 };
const titleStyle = { fontSize: 24, fontWeight: 700, color: 'var(--as-text-primary)', margin: 0, letterSpacing: '-0.01em' };
const subStyle = { fontSize: 14, color: 'var(--as-text-secondary)', marginTop: 2 };

export default function BriefingsHistoryPage() {
  const { orgId } = useAuth(); // referenced for downstream hooks via context
  const navigate = useNavigate();
  const { filters, update: updateFilters, clear: clearFilters } = useBriefingFilters();
  const [search, setSearch] = useState('');
  void orgId;

  return (
    <div style={wrap}>
      <div style={inner}>
        <AdminBackHeader />
        <header style={{ padding: '12px 0' }}>
          <h1 style={titleStyle}>Sent briefings</h1>
          <div style={subStyle}>Search and review what's gone out.</div>
        </header>
        <InboxSearch value={search} onChange={setSearch} placeholder="Search subject + body…" />
        <InboxFilters filters={filters} onChange={updateFilters} onClear={clearFilters} />
        <HistoryView
          filters={filters}
          search={search}
          onCompose={() => navigate('/admin/briefings/compose')}
        />
      </div>
    </div>
  );
}
