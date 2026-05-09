import { Send } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import FullScreenForm from '../../shared/FullScreenForm';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/useToast';
import { useDigestRecipients } from '../../../hooks/useDigestRecipients';
import { useDigestEvents } from '../../../hooks/useDigestEvents';
import { useOrgStaff } from '../../../hooks/useOrgStaff';
import { useOrgSettings } from '../../../hooks/useOrgSettings';
import { defaultPeriod } from '../../../lib/engine/digestPeriod';
import { sendWeeklyDigest } from '../../../lib/digestSend';
import DigestComposerForm from './DigestComposerForm';
import DigestRecipientPreview from './DigestRecipientPreview';
import PilotModeBanner from './PilotModeBanner';

const sendBtn = { width: '100%', minHeight: 44, borderRadius: 10, backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)', fontSize: 15, fontWeight: 600, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' };

function shiftPeriod(period, deltaDays) {
  const start = new Date(period.start); start.setDate(start.getDate() + deltaDays);
  const end = new Date(period.end); end.setDate(end.getDate() + deltaDays);
  return { start, end };
}

export default function DigestComposer({ onClose }) {
  const { orgId } = useAuth();
  const { showToast } = useToast();
  const [period, setPeriod] = useState(() => defaultPeriod());
  const [bodyNotes, setBodyNotes] = useState('');
  const [opsEnabled, setOpsEnabled] = useState(false);
  const [opsNotes, setOpsNotes] = useState('');
  const [signoffMessage, setSignoffMessage] = useState('');
  const [testOnly, setTestOnly] = useState(true);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [sending, setSending] = useState(false);

  const { pilotModeEnabled } = useOrgSettings(orgId);
  const { recipients, loading: recipientLoading } = useDigestRecipients({ orgId, pilotOnly: pilotModeEnabled });
  const { events, tournaments, teams, rsvpCountsByEvent, loading: eventsLoading } = useDigestEvents({ orgId, period });
  const { staff: coaches } = useOrgStaff(orgId);

  const eventsByTeam = useMemo(() => {
    const m = new Map();
    for (const ev of events || []) {
      const arr = m.get(ev.team_id) || [];
      arr.push(ev); m.set(ev.team_id, arr);
    }
    return m;
  }, [events]);

  const familiesWithEvents = useMemo(() => recipients.map((r) => {
    const seen = new Set();
    const evs = [];
    for (const tid of r.team_ids || []) {
      for (const ev of eventsByTeam.get(tid) || []) {
        if (!seen.has(ev.id)) { seen.add(ev.id); evs.push(ev); }
      }
    }
    return { ...r, events: evs };
  }), [recipients, eventsByTeam]);

  const sendable = useMemo(() => familiesWithEvents.filter((f) => f.events.length > 0), [familiesWithEvents]);
  const skipped = familiesWithEvents.length - sendable.length;

  useEffect(() => {
    Promise.resolve().then(() => {
      if (!sendable.length) { setPreviewIndex(0); return; }
      const multiIdx = sendable.findIndex((f) => (f.team_ids || []).length > 1);
      setPreviewIndex(multiIdx >= 0 ? multiIdx : 0);
    });
  }, [sendable]);

  const previewFamily = sendable[previewIndex] || null;
  const onPrevPreview = () => setPreviewIndex((i) => (i - 1 + sendable.length) % Math.max(sendable.length, 1));
  const onNextPreview = () => setPreviewIndex((i) => (i + 1) % Math.max(sendable.length, 1));

  const onSend = async () => {
    setSending(true);
    try {
      const result = await sendWeeklyDigest({
        orgId, period,
        bodyNotes, signoffMessage,
        opsNotes: opsEnabled ? opsNotes : '',
        recipients: sendable, events, tournaments, teams, coaches,
        rsvpCountsByEvent,
        testOnly,
      });
      showToast(testOnly
        ? `Test sent to admin@. Composed ${result.composedFamilies} ${pilotModeEnabled ? 'pilot' : 'family'} digests.`
        : `Sent to ${result.sent || result.composedFamilies} ${pilotModeEnabled ? 'pilot recipients' : 'families'}.`,
        'success');
      onClose?.();
    } catch (e) {
      showToast(e.message || "Looks like that didn't go through. Try again?", 'error');
      setSending(false);
    }
  };

  const canSend = !sending && !!period?.start && sendable.length > 0;

  return (
    <FullScreenForm open onClose={onClose} title="Weekly Digest">
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 20, maxWidth: 760, margin: '0 auto' }}>
        <PilotModeBanner pilotModeEnabled={pilotModeEnabled} recipientCount={sendable.length} />
        <DigestComposerForm
          period={period}
          onPrevPeriod={() => setPeriod((p) => shiftPeriod(p, -7))}
          onNextPeriod={() => setPeriod((p) => shiftPeriod(p, 7))}
          recipientCount={sendable.length} skippedCount={skipped}
          recipientLoading={recipientLoading} eventsLoading={eventsLoading}
          outOfSeason={false} pilotModeEnabled={pilotModeEnabled}
          bodyNotes={bodyNotes} setBodyNotes={setBodyNotes}
          opsEnabled={opsEnabled} setOpsEnabled={setOpsEnabled}
          opsNotes={opsNotes} setOpsNotes={setOpsNotes}
          signoffMessage={signoffMessage} setSignoffMessage={setSignoffMessage}
          testOnly={testOnly} setTestOnly={setTestOnly}
        />

        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--em-text-secondary)', marginBottom: 8 }}>
            Preview
          </div>
          {previewFamily ? (
            <DigestRecipientPreview
              family={previewFamily} events={previewFamily.events}
              period={period} teams={teams} tournaments={tournaments}
              coaches={coaches}
              rsvpCountsByEvent={rsvpCountsByEvent}
              bodyNotes={bodyNotes}
              signoffMessage={signoffMessage}
              opsNotes={opsEnabled ? opsNotes : ''}
              index={previewIndex} total={sendable.length}
              onPrev={onPrevPreview} onNext={onNextPreview}
            />
          ) : (
            <div style={{ padding: 16, borderRadius: 8, backgroundColor: 'var(--em-bg-secondary)', color: 'var(--em-text-tertiary)', fontSize: 13, textAlign: 'center' }}>
              No families have events in this period.
            </div>
          )}
        </div>

        <button type="button" onClick={onSend} disabled={!canSend} className="sf-press"
          style={{ ...sendBtn, opacity: canSend ? 1 : 0.5 }}>
          <Send size={16} strokeWidth={1.75} />
          {sending ? 'Sending…' : (testOnly ? 'Send test to admin@' : `Send to ${sendable.length} ${pilotModeEnabled ? (sendable.length === 1 ? 'pilot recipient' : 'pilot recipients') : (sendable.length === 1 ? 'family' : 'families')}`)}
        </button>
      </div>
    </FullScreenForm>
  );
}
