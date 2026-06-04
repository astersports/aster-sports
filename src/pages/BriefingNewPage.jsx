// Track-R R-2 - free-form one-screen compose. Type an announcement, pick the
// audience, preview, send. No 4-step wizard. Reuses the tested submitBriefing +
// useBriefingDraft + PreviewPanel, so the send path is identical to the wizard's
// legacy path (compose -> queueRecipients -> send-tournament-message). AI-1: the
// "Draft with AI" control fills the Message body from the briefing-ai-draft edge
// fn (free-form lane); Send stays the unchanged submitBriefing path.

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/useToast';
import { useOrgSettings } from '../hooks/useOrgSettings';
import { useOrgTeams } from '../hooks/useOrgTeams';
import { useDigestRecipients } from '../hooks/useDigestRecipients';
import { useBriefingDraft } from '../hooks/useBriefingDraft';
import { submitBriefing } from '../components/briefings/composerSubmit';
import { friendlySendError } from '../lib/briefings/sendErrorMessage';
import { useAiDraft } from '../hooks/useAiDraft';
import AiDraftControls from '../components/briefings/AiDraftControls';
import PreviewPanel from '../components/briefings/PreviewPanel';

const page = { display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600, margin: '0 auto', padding: 16 };
const headerRow = { display: 'flex', alignItems: 'center', gap: 10 };
const backBtn = { background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--as-text-secondary)', display: 'inline-flex' };
const title = { fontSize: 20, fontWeight: 700, color: 'var(--as-text-primary)' };
const label = { fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--as-text-tertiary)', display: 'block', marginBottom: 6 };
const input = { width: '100%', minHeight: 44, padding: '0 12px', borderRadius: 10, fontSize: 15, fontFamily: 'inherit', backgroundColor: 'var(--as-bg-tertiary)', border: '1.5px solid var(--as-border-default)', color: 'var(--as-text-primary)' };
const textarea = { ...input, minHeight: 160, padding: 12, lineHeight: 1.5 };
const ghostBtn = { minHeight: 44, padding: '0 14px', borderRadius: 10, border: '1px solid var(--as-border-default)', background: 'transparent', color: 'var(--as-text-secondary)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 };
const sendBtn = (on) => ({ flex: 1, minHeight: 48, borderRadius: 10, border: 'none', backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 15, fontWeight: 600, cursor: on ? 'pointer' : 'not-allowed', opacity: on ? 1 : 0.5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 });
const note = { fontSize: 12, color: 'var(--as-text-tertiary)', lineHeight: 1.4 };

export default function BriefingNewPage() {
  const { orgId } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { pilotModeEnabled } = useOrgSettings(orgId);
  const { teams } = useOrgTeams();
  const { recipients } = useDigestRecipients({ orgId, pilotOnly: pilotModeEnabled });
  const draft = useBriefingDraft(null);
  const ai = useAiDraft();

  const [audience, setAudience] = useState('org_all'); // 'org_all' | team_id
  const [headline, setHeadline] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [gist, setGist] = useState('');
  const [hasDrafted, setHasDrafted] = useState(false);
  const [testOnly, setTestOnly] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [busy, setBusy] = useState(false);

  const state = useMemo(() => {
    const isTeam = audience !== 'org_all';
    return {
      kind: 'announcement', anchor_kind: 'org', anchor_id: null,
      audience_type: isTeam ? 'team' : 'org_all',
      audience_filter: isTeam ? { team_ids: [audience] } : null,
      body: { headline, body_text: bodyText }, signoff_message: '',
      send_mode: 'now', scheduled_for: null, test_only: testOnly, pilot_only: pilotModeEnabled,
    };
  }, [audience, headline, bodyText, testOnly, pilotModeEnabled]);

  const canSend = bodyText.trim().length > 0 && !busy;

  const onDraft = async (mode) => {
    const aud = audience !== 'org_all' ? { team_id: audience } : {};
    const r = await ai.draft({ kind: 'announcement', mode, gist, facts: headline ? { headline } : undefined, audience: aud });
    if (r) { setBodyText(r.body); setHasDrafted(true); }
  };

  const onSend = async () => {
    setBusy(true);
    try {
      await submitBriefing({ state, draft, recipients, coaches: [] });
      showToast(testOnly ? 'Test sent to admin@ only.' : 'Announcement sent.', 'success');
      navigate('/admin/briefings/radar');
    } catch (e) {
      showToast(friendlySendError(e) || "Couldn't send that. Try again in a moment.", 'error');
    } finally { setBusy(false); }
  };

  return (
    <div style={page}>
      <div style={headerRow}>
        <button type="button" style={backBtn} onClick={() => navigate('/admin/briefings/radar')} aria-label="Back to briefings"><ArrowLeft size={20} strokeWidth={1.75} /></button>
        <span style={title}>New announcement</span>
      </div>

      <div>
        <label htmlFor="r2-aud" style={label}>To</label>
        <select id="r2-aud" value={audience} onChange={(e) => setAudience(e.target.value)} style={input}>
          <option value="org_all">All families</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="r2-head" style={label}>Headline (optional)</label>
        <input id="r2-head" type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Spring season wrap-up" style={input} />
      </div>

      <AiDraftControls
        gist={gist} onGistChange={setGist} onDraft={onDraft}
        loading={ai.loading} warnings={ai.warnings} error={ai.error} hasDrafted={hasDrafted}
      />

      <div>
        <label htmlFor="r2-body" style={label}>Message</label>
        <textarea id="r2-body" value={bodyText} onChange={(e) => setBodyText(e.target.value)} placeholder="Write your message to families..." style={textarea} />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--as-text-secondary)' }}>
        <input type="checkbox" checked={testOnly} onChange={(e) => setTestOnly(e.target.checked)} />
        Send a test to admin@ first (recommended)
      </label>

      <button type="button" style={ghostBtn} onClick={() => setShowPreview((v) => !v)} aria-expanded={showPreview}>
        {showPreview ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
        {showPreview ? 'Hide preview' : 'Preview'}
      </button>
      {showPreview && <PreviewPanel state={state} families={recipients} coaches={[]} recipientCount={recipients?.length ?? null} />}

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="as-press" style={sendBtn(canSend)} disabled={!canSend} onClick={onSend}>
          <Send size={16} strokeWidth={1.75} /> {busy ? 'Sending...' : (testOnly ? 'Send test' : 'Send')}
        </button>
      </div>
      {pilotModeEnabled && <p style={note}>Pilot mode is on. Sends route to the pilot inbox; real families are not emailed.</p>}
    </div>
  );
}
