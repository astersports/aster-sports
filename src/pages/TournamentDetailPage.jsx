import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTournament } from '../hooks/useTournament';
import TournamentHeader from '../components/tournament/TournamentHeader';
import TournamentTabs from '../components/tournament/TournamentTabs';
import OverviewTab from '../components/tournament/tabs/OverviewTab';

export default function TournamentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { tournament, loading, error, refetch } = useTournament(id);
  const [activeTab, setActiveTab] = useState('overview');

  const isStaff = role === 'admin' || role === 'coach';

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--em-text-secondary)', fontSize: 15 }}>
        Loading tournament…
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div style={{ padding: 16 }}>
        <button type="button" onClick={() => navigate('/tournaments')} className="sf-press" aria-label="Back to tournaments" style={{
          minHeight: 44, padding: '8px 12px', border: 'none', backgroundColor: 'transparent',
          display: 'flex', alignItems: 'center', gap: 6, color: 'var(--em-accent)',
          fontSize: 15, fontWeight: 500, cursor: 'pointer', marginBottom: 12,
        }}>
          <ArrowLeft size={16} strokeWidth={1.75} /> Tournaments
        </button>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--em-text-primary)', marginBottom: 6 }}>
            Tournament not found
          </div>
          <div style={{ fontSize: 13, color: 'var(--em-text-secondary)' }}>
            {error ? error.message : 'This tournament may have been archived or deleted.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: '8px 16px 0' }}>
        <button type="button" onClick={() => navigate('/tournaments')} className="sf-press" aria-label="Back to tournaments" style={{
          minHeight: 44, padding: '8px 0', border: 'none', backgroundColor: 'transparent',
          display: 'flex', alignItems: 'center', gap: 6, color: 'var(--em-accent)',
          fontSize: 15, fontWeight: 500, cursor: 'pointer',
        }}>
          <ArrowLeft size={16} strokeWidth={1.75} /> Tournaments
        </button>
      </div>

      <TournamentHeader tournament={tournament} isStaff={isStaff} onChange={refetch} />
      <TournamentTabs active={activeTab} onChange={setActiveTab} />

      <div style={{ padding: 16 }}>
        {activeTab === 'overview' && <OverviewTab tournament={tournament} isStaff={isStaff} onChange={refetch} />}
        {activeTab === 'games' && <TabStub label="Games" />}
        {activeTab === 'roster' && <TabStub label="Roster" />}
        {activeTab === 'messages' && <TabStub label="Messages" />}
        {activeTab === 'scenarios' && <TabStub label="Scenarios" />}
      </div>
    </div>
  );
}

function TabStub({ label }) {
  return (
    <div style={{ padding: 40, textAlign: 'center', backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)' }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--em-text-primary)', marginBottom: 6 }}>
        {label} tab
      </div>
      <div style={{ fontSize: 13, color: 'var(--em-text-secondary)' }}>
        Coming soon — we're building something great.
      </div>
    </div>
  );
}
