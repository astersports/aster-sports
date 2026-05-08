import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTeams } from '../hooks/useTeams';
import { useTournaments } from '../hooks/useTournaments';
import { useTournamentEvents } from '../hooks/useTournamentEvents';
import { useTeamRecipients } from '../hooks/useTeamRecipients';
import { useComposeBriefing } from '../hooks/useComposeBriefing';
import { generateTournamentBriefing } from '../lib/tournamentBriefing';
import { TOURNAMENT_MESSAGE_TYPES } from '../lib/constants';
import { formatDateRange } from '../lib/formatDateRange';
import BriefingSetupForm from '../components/compose/BriefingSetupForm';
import BriefingNarrativeInputs from '../components/compose/BriefingNarrativeInputs';
import BriefingPreviewPane from '../components/compose/BriefingPreviewPane';
import RecipientPicker from '../components/compose/RecipientPicker';
import SendConfirmDialog from '../components/compose/SendConfirmDialog';
import Button from '../components/shared/Button';
import Toast from '../components/shared/Toast';

export default function ComposeBriefingPage() {
  const [params] = useSearchParams();
  const { user, orgId, orgName } = useAuth();

  const [tournamentId, setTournamentId] = useState(params.get('tournament') || null);
  const [teamId, setTeamId]             = useState(params.get('team') || null);
  const [messageType, setMessageType]   = useState('preliminary_schedule');
  const [coachKeys, setCoachKeys]       = useState('');
  const [survivalText, setSurvivalText] = useState('');
  const [subjectOverride, setSubject]   = useState('');
  const [testSendOnly, setTestSendOnly] = useState(false);
  const [selectedIds, setSelectedIds]   = useState(new Set());
  const [confirmOpen, setConfirmOpen]   = useState(false);
  const [toast, setToast]               = useState(null);

  const { tournaments } = useTournaments({ statusFilter: 'all', seasonFilter: 'all', limit: 50 });
  const { teams } = useTeams(orgId);
  const { events } = useTournamentEvents(tournamentId, teamId);
  const { recipients, loading: recipientsLoading } = useTeamRecipients(teamId);
  const { send, sending, result, error, reset } = useComposeBriefing();

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled || !tournamentId) return;
      const { data } = await supabase.from('tournaments')
        .select('coach_theme, survival_notes, game_day_guide')
        .eq('id', tournamentId).maybeSingle();
      if (cancelled || !data) return;
      setCoachKeys(data.coach_theme || '');
      setSurvivalText(data.survival_notes || data.game_day_guide || '');
    });
    return () => { cancelled = true; };
  }, [tournamentId]);

  useEffect(() => {
    Promise.resolve().then(() => setSelectedIds(new Set(recipients.map((r) => r.guardian_id))));
  }, [recipients]);

  const tournament = tournaments.find((t) => t.id === tournamentId) || null;
  const team       = teams.find((t) => t.id === teamId) || null;

  const briefing = useMemo(() => {
    if (!tournament || !team || events.length === 0) return { html: '', plainText: '', subject: '' };
    return generateTournamentBriefing({
      teamName: team.name,
      tournamentName: tournament.name,
      dateLabel: formatDateRange(tournament.start_date, tournament.end_date),
      events,
      coachKeys,
      survivalText,
      orgName: orgName || 'Legacy Hoopers',
    });
  }, [tournament, team, events, coachKeys, survivalText, orgName]);

  const subject = subjectOverride || briefing.subject;
  const messageTypeLabel = TOURNAMENT_MESSAGE_TYPES.find((m) => m.value === messageType)?.label || messageType;

  const effectiveRecipients = testSendOnly
    ? (user?.email ? [{ guardian_id: 'test', email: user.email, name: 'Me (test)', children: [] }] : [])
    : recipients.filter((r) => selectedIds.has(r.guardian_id));

  const ready = Boolean(tournament && team && events.length > 0);
  const canSend = ready && !!subject && effectiveRecipients.length > 0 && !sending;

  const toggle = (id) => setSelectedIds((s) => {
    const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n;
  });
  const closeDialog = () => {
    if (sending) return;
    if (result) setToast({ message: `Sent ${result.sent ?? 0}, ${result.failed ?? 0} failed`, variant: 'success' });
    setConfirmOpen(false); reset();
  };
  const doSend = async () => {
    try { await send({ orgId, tournamentId, messageType, subject, html: briefing.html, plainText: briefing.plainText, recipients: effectiveRecipients }); }
    catch { /* dialog surfaces the error */ }
  };

  return (
    <div className="px-4 py-4 sf-fade-in" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--em-text-primary)', letterSpacing: '-0.01em' }}>Compose briefing</h1>
          <div style={{ fontSize: 13, color: 'var(--em-text-secondary)' }}>One-tap weekly tournament dispatch.</div>
        </div>
        <Button onClick={() => setConfirmOpen(true)} disabled={!canSend}>
          <Send size={18} strokeWidth={1.75} /> {testSendOnly ? 'Send test' : 'Send'}
        </Button>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
        <div className="flex flex-col gap-4">
          <BriefingSetupForm
            tournaments={tournaments} tournamentId={tournamentId} onTournamentChange={setTournamentId}
            teams={teams} teamId={teamId} onTeamChange={setTeamId}
            messageType={messageType} onMessageTypeChange={setMessageType}
            subject={subjectOverride} onSubjectChange={setSubject}
            defaultSubject={briefing.subject}
          />
          <BriefingNarrativeInputs
            coachKeys={coachKeys} onCoachKeysChange={setCoachKeys}
            survivalText={survivalText} onSurvivalChange={setSurvivalText}
          />
          <RecipientPicker
            recipients={recipients} selectedIds={selectedIds} onToggle={toggle}
            onSelectAll={() => setSelectedIds(new Set(recipients.map((r) => r.guardian_id)))}
            onSelectNone={() => setSelectedIds(new Set())}
            testSendOnly={testSendOnly} onTestSendOnlyChange={setTestSendOnly}
            adminEmail={user?.email} loading={recipientsLoading}
          />
        </div>
        <BriefingPreviewPane
          html={briefing.html} plainText={briefing.plainText}
          eventCount={events.length} recipientCount={team ? recipients.length : null}
          ready={ready}
        />
      </div>

      <SendConfirmDialog
        open={confirmOpen} onClose={closeDialog} onConfirm={doSend}
        sending={sending} result={result} error={error}
        tournamentName={tournament?.name || ''} teamName={team?.name || ''}
        subject={subject} recipientCount={effectiveRecipients.length}
        messageTypeLabel={messageTypeLabel} isTestSend={testSendOnly}
      />
      <Toast message={toast?.message} variant={toast?.variant} onDismiss={() => setToast(null)} />
    </div>
  );
}
