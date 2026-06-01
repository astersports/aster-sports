import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTournament } from '../hooks/useTournament';
import TournamentHeader from '../components/tournament/TournamentHeader';
import TournamentTabs from '../components/tournament/TournamentTabs';
import AggregateRsvpBlock from '../components/tournament/AggregateRsvpBlock';
import TournamentBriefingHistory from '../components/tournament/TournamentBriefingHistory';
import OverviewTab from '../components/tournament/tabs/OverviewTab';
import GamesTab from '../components/tournament/tabs/GamesTab';
import RosterTab from '../components/tournament/tabs/RosterTab';
import MessagesTab from '../components/tournament/tabs/MessagesTab';
import ScenariosTab from '../components/tournament/tabs/ScenariosTab';
import FilterSelect from '../components/shared/FilterSelect';

export default function TournamentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { tournament, loading, error, refetch } = useTournament(id);
  const [activeTab, setActiveTab] = useState('overview');
  const [teamFilter, setTeamFilter] = useState(null);

  const isStaff = role === 'admin' || role === 'coach';
  const teams = tournament?.teams || [];

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--as-text-secondary)', fontSize: 15 }}>Loading tournament…</div>;
  }

  if (error || !tournament) {
    return (
      <div style={{ padding: 16 }}>
        <button type="button" onClick={() => navigate('/tournaments')} className="as-press" aria-label="Back" style={{ minHeight: 44, padding: '8px 12px', border: 'none', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--as-accent)', fontSize: 15, fontWeight: 500, marginBottom: 12 }}>
          <ArrowLeft size={16} strokeWidth={1.75} /> Tournaments
        </button>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--as-text-primary)', marginBottom: 6 }}>Tournament not found</div>
          <div style={{ fontSize: 13, color: 'var(--as-text-secondary)' }}>{error ? error.message : 'This tournament may have been archived or deleted.'}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: '8px 16px 0' }}>
        <button type="button" onClick={() => navigate('/tournaments')} className="as-press" aria-label="Back" style={{ minHeight: 44, padding: '8px 0', border: 'none', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--as-accent)', fontSize: 15, fontWeight: 500 }}>
          <ArrowLeft size={16} strokeWidth={1.75} /> Tournaments
        </button>
      </div>

      <TournamentHeader tournament={tournament} isStaff={isStaff} onChange={refetch} />

      {isStaff && <AggregateRsvpBlock tournamentId={tournament.id} />}

      {teams.length > 1 && (
        <div style={{ padding: '8px 16px' }}>
          <FilterSelect
            value={teamFilter}
            onChange={setTeamFilter}
            options={[{ value: null, label: 'All Teams' }, ...teams.map((t) => ({ value: t.id, label: t.name, color: t.team_color }))]}
            ariaLabel="Filter by team"
          />
        </div>
      )}

      <TournamentTabs active={activeTab} onChange={setActiveTab} />

      <div style={{ padding: 16 }}>
        {activeTab === 'overview' && <OverviewTab tournament={tournament} isStaff={isStaff} onChange={refetch} />}
        {activeTab === 'games' && <GamesTab tournament={tournament} teamFilter={teamFilter} />}
        {activeTab === 'roster' && <RosterTab tournament={tournament} teamFilter={teamFilter} />}
        {activeTab === 'messages' && <MessagesTab tournament={tournament} isStaff={isStaff} />}
        {activeTab === 'scenarios' && <ScenariosTab tournament={tournament} teamFilter={teamFilter} />}
      </div>

      {isStaff && <TournamentBriefingHistory tournament={tournament} />}
    </div>
  );
}
