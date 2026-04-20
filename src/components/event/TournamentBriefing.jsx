import { useEffect, useState } from 'react';
import { X, Copy, FileText, RefreshCw } from 'lucide-react';
import { useTournamentBriefing } from '../../hooks/useTournamentBriefing';
import { useToast } from '../../context/ToastContext';

export default function TournamentBriefing({ event, team, onClose }) {
  const { draftKeys, setDraftKeys, briefing, loading, error, loadDraft, generate } =
    useTournamentBriefing({ event, team });
  const [copied, setCopied] = useState(null);
  const { showToast } = useToast();

  useEffect(() => { loadDraft(); }, [loadDraft]);
  useEffect(() => { if (draftKeys !== undefined && !briefing) generate(draftKeys); }, [draftKeys, briefing, generate]);

  async function copyText(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      navigator.vibrate?.(10);
      setCopied(label);
      showToast(`${label} copied`);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      showToast('Copy failed', 'error');
    }
  }

  const primaryBtn = {
    flex: 1, minHeight: 44, borderRadius: 10,
    backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-inverse)',
    fontSize: 14, fontWeight: 600, border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  };
  const secondaryBtn = {
    flex: 1, minHeight: 44, borderRadius: 10,
    backgroundColor: 'var(--sf-bg-card)', color: 'var(--sf-accent)',
    fontSize: 14, fontWeight: 600, border: '1.5px solid var(--sf-accent)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  };
  const ghostBtn = {
    minHeight: 36, padding: '0 12px', borderRadius: 8,
    backgroundColor: 'transparent', color: 'var(--sf-text-secondary)',
    fontSize: 12, fontWeight: 500, border: '1px solid var(--sf-border-default)',
    display: 'inline-flex', alignItems: 'center', gap: 4,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'var(--sf-bg-page)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)', borderBottom: '1px solid var(--sf-border-default)', backgroundColor: 'var(--sf-bg-card)' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--sf-text-primary)' }}>Tournament Briefing</div>
          <div style={{ fontSize: 12, color: 'var(--sf-text-secondary)', marginTop: 2 }}>{event?.tournament_name}</div>
        </div>
        <button type="button" onClick={onClose} className="sf-press" aria-label="Close" style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={20} strokeWidth={1.75} color="var(--sf-text-primary)" />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, backgroundColor: 'var(--sf-bg-page)' }}>
        {loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--sf-text-secondary)', fontSize: 14 }}>Loading tournament events...</div>}
        {error && <div style={{ padding: 16, color: 'var(--sf-danger)', fontSize: 13 }}>{error.message}</div>}

        {!loading && !error && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label htmlFor="tb-keys" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--sf-text-secondary)' }}>
                  Coach Kenny's Keys
                </label>
                <button type="button" onClick={() => generate(draftKeys)} className="sf-press" style={ghostBtn}>
                  <RefreshCw size={12} strokeWidth={1.75} /> Refresh preview
                </button>
              </div>
              <textarea
                id="tb-keys"
                value={draftKeys}
                onChange={(e) => setDraftKeys(e.target.value)}
                placeholder="One key per line. Pre-filled from coach_notes on each game."
                rows={5}
                style={{
                  width: '100%', minHeight: 110, padding: 12, borderRadius: 10,
                  border: '1.5px solid var(--sf-border-default)',
                  backgroundColor: 'var(--sf-bg-tertiary)', color: 'var(--sf-text-primary)',
                  fontSize: 14, fontFamily: 'Inter, sans-serif', resize: 'vertical',
                }}
              />
            </div>

            {briefing && (
              <div style={{ backgroundColor: '#ffffff', borderRadius: 10, overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: briefing.html }} />
            )}
          </>
        )}
      </div>

      {briefing && (
        <div style={{ display: 'flex', gap: 8, padding: 16, paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)', backgroundColor: 'var(--sf-bg-card)', borderTop: '1px solid var(--sf-border-default)' }}>
          <button type="button" onClick={() => copyText(briefing.html, 'HTML')} className="sf-press" style={primaryBtn}>
            <Copy size={16} strokeWidth={1.75} />
            {copied === 'HTML' ? 'Copied' : 'Copy HTML'}
          </button>
          <button type="button" onClick={() => copyText(briefing.plainText, 'Plain text')} className="sf-press" style={secondaryBtn}>
            <FileText size={16} strokeWidth={1.75} />
            {copied === 'Plain text' ? 'Copied' : 'Copy Text'}
          </button>
        </div>
      )}
    </div>
  );
}
