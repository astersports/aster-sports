import { useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import ModalBackground from '../shared/ModalBackground';

export default function ShareScheduleButton({ teamId, teamName }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/schedule/${teamId}`;

  const copy = async () => {
    await navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: `${teamName} Schedule`, url });
    } else {
      setOpen(true);
    }
  };

  return (
    <>
      <button type="button" onClick={share} className="em-press" aria-label="Share schedule"
        style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 44, padding: '0 14px', borderRadius: 10, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', color: 'var(--em-accent)', fontSize: 14, fontWeight: 500 }}>
        <Share2 size={16} strokeWidth={1.75} /> Share
      </button>
      {open && createPortal(
        <ModalBackground onClick={() => setOpen(false)} zIndex={9998}>
          <div className="em-fade-in" role="dialog" aria-modal="true" style={{ backgroundColor: 'var(--em-bg-card)', borderRadius: 16, padding: 20, width: '100%', maxWidth: 360, margin: 16, boxShadow: 'var(--em-shadow-lg)' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)', marginBottom: 12 }}>Share {teamName} Schedule</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', backgroundColor: 'var(--em-bg-secondary)', borderRadius: 10, marginBottom: 12 }}>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--em-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
              <button type="button" onClick={copy} className="em-press" style={{ minWidth: 44, minHeight: 36, borderRadius: 8, border: 'none', backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                {copied ? <Check size={16} strokeWidth={2} /> : <Copy size={16} strokeWidth={1.75} />}
              </button>
            </div>
            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--em-text-tertiary)' }}>
              Anyone with this link can view the schedule — no login required.
            </div>
          </div>
        </ModalBackground>,
        document.body
      )}
    </>
  );
}
