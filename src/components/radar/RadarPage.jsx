// Track-R R-1 — the Briefings Radar. A feed of READY proposals (auto-drafted,
// live-only per the #678 lifecycle), SCHEDULED, and SENT-this-week. Replaces the
// 4-step-wizard entry. Reads canonical surfaces only (spec §0); "Review & send"
// resumes the EXISTING draft in the composer (one-flow, closes the draft+sent
// race). Dismiss archives the proposal.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/useToast';
import { supabase } from '../../lib/supabase';
import { useRadarFeed } from '../../hooks/useRadarFeed';
import RadarSection from './RadarSection';
import ProposalCard from './ProposalCard';

const page = { display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600, margin: '0 auto', padding: 16 };
const headerRow = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 };
const pageTitle = { fontSize: 20, fontWeight: 700, color: 'var(--as-text-primary)', letterSpacing: '-0.01em' };
const newBtn = { minHeight: 40, padding: '0 14px', borderRadius: 10, border: 'none', backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 };
const skel = { height: 132, borderRadius: 10, backgroundColor: 'var(--as-bg-secondary)' };
const calm = { textAlign: 'center', padding: '48px 16px', color: 'var(--as-text-tertiary)', fontSize: 14, lineHeight: 1.5 };
const errBox = { padding: 16, borderRadius: 10, backgroundColor: 'var(--as-danger-soft)', color: 'var(--as-danger)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 };
const retryBtn = { minHeight: 36, padding: '0 14px', borderRadius: 8, border: 'none', backgroundColor: 'var(--as-danger)', color: 'var(--as-text-inverse)', fontSize: 13, fontWeight: 600, cursor: 'pointer' };

export default function RadarPage() {
  const { orgId } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { ready, scheduled, sent, loading, error, refetch } = useRadarFeed({ orgId });
  const [busyId, setBusyId] = useState(null);

  const review = (item) => navigate(`/admin/briefings/compose?draft=${item.id}`);
  const dismiss = async (item) => {
    setBusyId(item.id);
    const { error: e } = await supabase.from('comms_messages').update({ status: 'archived' }).eq('id', item.id);
    setBusyId(null);
    if (e) { showToast("Couldn't dismiss that briefing. Try again?", 'error'); return; }
    showToast('Dismissed.', 'success');
    refetch();
  };

  const isEmpty = !ready.length && !scheduled.length && !sent.length;

  // Header is always present so free-form compose (R-2) and sent history stay
  // reachable from the Radar entry, in every state.
  const header = (
    <div style={headerRow}>
      <span style={pageTitle}>Briefings</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="as-press" style={{ ...newBtn, backgroundColor: 'transparent', color: 'var(--as-accent)', border: '1px solid var(--as-border-default)' }} onClick={() => navigate('/admin/briefings/history')}>Sent</button>
        <button type="button" className="as-press" style={newBtn} onClick={() => navigate('/admin/briefings/new')}>+ New briefing</button>
      </div>
    </div>
  );

  let body;
  if (loading && isEmpty) {
    body = <>{[0, 1, 2].map((i) => <div key={i} style={skel} aria-hidden="true" />)}</>;
  } else if (error && isEmpty) {
    body = (
      <div style={errBox} role="alert">
        <span>Couldn’t load briefings.</span>
        <button type="button" style={retryBtn} onClick={refetch}>Retry</button>
      </div>
    );
  } else if (isEmpty) {
    body = <p style={calm} role="status">No briefings ready. They’ll appear here as games and weeks complete.</p>;
  } else {
    body = (
      <>
        <RadarSection title="Ready to send" count={ready.length}>
          {ready.length
            ? ready.map((item) => <ProposalCard key={item.id} item={item} busy={busyId === item.id} onReview={() => review(item)} onDismiss={() => dismiss(item)} />)
            : <p style={calm}>Nothing ready right now.</p>}
        </RadarSection>
        {scheduled.length > 0 && (
          <RadarSection title="Scheduled" count={scheduled.length} collapsible defaultOpen={false}>
            {scheduled.map((item) => <ProposalCard key={item.id} item={item} busy={busyId === item.id} onReview={() => review(item)} onDismiss={() => dismiss(item)} />)}
          </RadarSection>
        )}
        {sent.length > 0 && (
          <RadarSection title="Sent this week" count={sent.length} collapsible defaultOpen={false}>
            {sent.map((item) => <ProposalCard key={item.id} item={item} showActions={false} />)}
          </RadarSection>
        )}
      </>
    );
  }

  return <div style={page}>{header}{body}</div>;
}
