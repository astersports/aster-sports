import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSeasonRollover } from '../hooks/useSeasonRollover';
import Button from '../components/shared/Button';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { StepArchive, StepPlayers, StepCoaches, StepDetails, StepPreview } from '../components/admin/RolloverSteps';

export default function SeasonRolloverPage() {
  const { orgId } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [season, setSeason] = useState(null);
  const [teams, setTeams] = useState([]);
  const [plan, setPlan] = useState({ newSeasonName: '', startDate: '', endDate: '', teams: [] });
  const [confirmCommit, setConfirmCommit] = useState(false);
  const { execute, loading } = useSeasonRollover(season, orgId);

  useEffect(() => {
    if (!orgId) return;
    (async () => {
      const { data: s } = await supabase.from('seasons').select('*').eq('org_id', orgId).eq('status', 'active').maybeSingle();
      setSeason(s);
      if (!s) return;
      const { data: t } = await supabase.from('teams').select('*, roster_members(player_id, players(id, first_name, last_name, jersey_number, grad_year)), team_staff(user_id, role)').eq('org_id', orgId).order('sort_order');
      const mapped = (t || []).map((tm) => ({
        ...tm, players: (tm.roster_members || []).filter((r) => r.players).map((r) => ({ ...r.players, action: 'keep' })),
        coaches: (tm.team_staff || []).map((s) => ({ ...s, keep: true })),
      }));
      setTeams(mapped);
      setPlan((p) => ({ ...p, teams: mapped, newSeasonName: `Fall ${new Date().getFullYear()}` }));
    })();
  }, [orgId]);

  const commit = async () => { setConfirmCommit(false); const r = await execute(plan); if (r) navigate('/'); };
  const stats = {
    players: plan.teams.reduce((s, t) => s + t.players.filter((p) => p.action !== 'drop').length, 0),
    advanced: plan.teams.reduce((s, t) => s + t.players.filter((p) => p.action === 'advance').length, 0),
    dropped: plan.teams.reduce((s, t) => s + t.players.filter((p) => p.action === 'drop').length, 0),
    coaches: plan.teams.reduce((s, t) => s + t.coaches.filter((c) => c.keep).length, 0),
    teams: plan.teams.length,
  };

  if (!season) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--em-text-tertiary)' }}>No active season found.</div>;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9990, backgroundColor: 'var(--em-bg-page)', display: 'flex', flexDirection: 'column', paddingTop: 'env(safe-area-inset-top)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--em-border-default)' }}>
        <button type="button" onClick={() => navigate(-1)} style={{ fontSize: 15, color: 'var(--em-accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}>Cancel</button>
        <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)' }}>Season Rollover</span>
        <span style={{ fontSize: 13, color: 'var(--em-text-tertiary)' }}>Step {step}/5</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {step === 1 && <StepArchive season={season} teams={teams} />}
        {step === 2 && <StepPlayers plan={plan} setPlan={setPlan} />}
        {step === 3 && <StepCoaches plan={plan} setPlan={setPlan} />}
        {step === 4 && <StepDetails plan={plan} setPlan={setPlan} />}
        {step === 5 && <StepPreview plan={plan} stats={stats} />}
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '12px 16px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)', borderTop: '1px solid var(--em-border-default)' }}>
        {step > 1 && <Button variant="secondary" onClick={() => setStep(step - 1)} style={{ flex: 1 }}>Back</Button>}
        {step < 5 && <Button onClick={() => setStep(step + 1)} style={{ flex: 1 }}>Next</Button>}
        {step === 5 && <Button onClick={() => setConfirmCommit(true)} disabled={loading || !plan.newSeasonName} style={{ flex: 1 }}>{loading ? 'Rolling over…' : 'Roll Over'}</Button>}
      </div>
      {confirmCommit && <ConfirmDialog title="Commit Rollover?" message={`Archive ${season.name} and create ${plan.newSeasonName}?`} confirmLabel="Roll Over" destructive onConfirm={commit} onCancel={() => setConfirmCommit(false)} />}
    </div>,
    document.body
  );
}
