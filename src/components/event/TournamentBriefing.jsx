import { useEffect, useState } from 'react';
import { X, Copy, FileText, RefreshCw } from 'lucide-react';
import { useTournamentBriefing } from '../../hooks/useTournamentBriefing';
import { useToast } from '../../context/useToast';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export default function TournamentBriefing({ event, team, onClose }) {
  const { draftKeys, setDraftKeys, briefing, loading, error, loadDraft, generate } =
    useTournamentBriefing({ event, team });
  const [copied, setCopied] = useState(null);
  const { showToast } = useToast();
  const trapRef = useFocusTrap(true);

  useEffect(() => { loadDraft(); }, [loadDraft]);
  useEffect(() => { if (draftKeys !== undefined && !briefing) generate(draftKeys); }, [draftKeys, briefing, generate]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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
    backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)',
    fontSize: 15, fontWeight: 600, border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  };
  const secondaryBtn = {
    flex: 1, minHeight: 44, borderRadius: 10,
    backgroundColor: 'var(--em-bg-card)', color: 'var(--em-accent)',
    fontSize: 15, fontWeight: 600, border: '1.5px solid var(--em-accent)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  };
  const ghostBtn = {
    minHeight: 44, padding: '0 12px', borderRadius: 8,
    backgroundColor: 'transparent', color: 'var(--em-text-secondary)',
    fontSize: 13, fontWeight: 500, border: '1px solid var(--em-border-default)',
    display: 'inline-flex', alignItems: 'center', gap: 4,
  };

  return (
    <div ref={trapRef} role="dialog" aria-modal="true" aria-label="Tournament briefing"
      style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'var(--em-bg-page)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)', borderBottom: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)' }}>Tournament Briefing</div>
          <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', marginTop: 2 }}>{event?.tournament_name}</div>
        </div>
        <button type="button" onClick={onClose} className="sf-press" aria-label="Close" style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={20} strokeWidth={1.75} color="var(--em-text-primary)" />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, backgroundColor: 'var(--em-bg-page)' }}>
        {loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--em-text-secondary)', fontSize: 15 }}>Loading tournament events...</div>}
        {error && <div style={{ padding: 16, color: 'var(--em-danger)', fontSize: 13 }}>{error.message}</div>}

        {!loading && !error && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label htmlFor="tb-keys" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--em-text-secondary)' }}>
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
                  border: '1.5px solid var(--em-border-default)',
                  backgroundColor: 'var(--em-bg-tertiary)', color: 'var(--em-text-primary)',
                  fontSize: 15, fontFamily: 'Inter, sans-serif', resize: 'vertical',
                }}
              />
            </div>

            {briefing && (
              <div style={{ backgroundColor: 'var(--em-bg-card)', borderRadius: 10, overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: briefing.html }} />
            )}
          </>
        )}
      </div>

      {briefing && (
        <div style={{ display: 'flex', gap: 8, padding: 16, paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)', backgroundColor: 'var(--em-bg-card)', borderTop: '1px solid var(--em-border-default)' }}>
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
