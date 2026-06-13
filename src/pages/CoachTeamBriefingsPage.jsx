// Track-R coach read-only team view (D5). Coaches see their team's briefings
// (proposals + sent) READ-ONLY - no approve/send/dismiss, consistent with the
// trigger-only model (DEF-2). Reuses the Radar feed components; team-scoped via
// team_staff (app-layer filter in pilot; team-scoped RLS is pre-cutover
// hardening). Mounted at /team-briefings, reachable from the coach home.

import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useGoBack } from '../hooks/useGoBack';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useRadarFeed } from '../hooks/useRadarFeed';
import RadarSection from '../components/radar/RadarSection';
import ProposalCard from '../components/radar/ProposalCard';

const page = { display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600, margin: '0 auto', padding: 16 };
const headerRow = { display: 'flex', alignItems: 'center', gap: 10 };
const backBtn = { background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--as-text-secondary)', display: 'inline-flex' };
const title = { fontSize: 20, fontWeight: 700, color: 'var(--as-text-primary)' };
const skel = { height: 132, borderRadius: 10, backgroundColor: 'var(--as-bg-secondary)' };
const calm = { textAlign: 'center', padding: '48px 16px', color: 'var(--as-text-tertiary)', fontSize: 14, lineHeight: 1.5 };
const note = { fontSize: 12, color: 'var(--as-text-tertiary)', lineHeight: 1.4 };

export default function CoachTeamBriefingsPage() {
  const { user, orgId } = useAuth();
  const goBack = useGoBack();
  const [teamIds, setTeamIds] = useState(null); // null = still resolving

  useEffect(() => {
    if (!user?.id) return undefined;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from('team_staff').select('team_id').eq('user_id', user.id);
      if (cancelled) return;
      setTeamIds(error ? [] : [...new Set((data || []).map((r) => r.team_id).filter(Boolean))]);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const { ready, scheduled, sent, loading } = useRadarFeed({ orgId, teamIds: teamIds || [] });
  const resolving = teamIds === null;
  const isEmpty = !ready.length && !scheduled.length && !sent.length;

  const ro = (list) => list.map((item) => <ProposalCard key={item.id} item={item} showActions={false} />);

  return (
    <div style={page}>
      <div style={headerRow}>
        <button type="button" style={backBtn} onClick={goBack} aria-label="Back"><ArrowLeft size={20} strokeWidth={1.75} /></button>
        <span style={title}>Team briefings</span>
      </div>

      {(resolving || loading) && isEmpty ? (
        [0, 1, 2].map((i) => <div key={i} style={skel} aria-hidden="true" />)
      ) : isEmpty ? (
        <p style={calm} role="status">No briefings for your team yet. They appear here as games and weeks complete.</p>
      ) : (
        <>
          <RadarSection title="Ready" count={ready.length}>{ro(ready)}</RadarSection>
          {scheduled.length > 0 && <RadarSection title="Scheduled" count={scheduled.length} collapsible defaultOpen={false}>{ro(scheduled)}</RadarSection>}
          {sent.length > 0 && <RadarSection title="Sent this week" count={sent.length} collapsible defaultOpen={false}>{ro(sent)}</RadarSection>}
        </>
      )}
      <p style={note}>Your admin reviews and sends these. This view is read-only.</p>
    </div>
  );
}
