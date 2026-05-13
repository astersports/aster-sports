import { useState } from 'react';
import { Check, Copy, Download, QrCode } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function QrInviteButton({ teamId, teamName }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const signupUrl = `${window.location.origin}/login?team=${teamId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(signupUrl)}`;

  const copy = async () => {
    await navigator.clipboard?.writeText(signupUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `${teamName.replace(/\s+/g, '-')}-invite-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="sf-press" aria-label="QR invite code"
        style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 44, padding: '0 14px', borderRadius: 10, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', color: 'var(--em-accent)', fontSize: 14, fontWeight: 500 }}>
        <QrCode size={16} strokeWidth={1.75} /> Invite
      </button>
      {open && createPortal(
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 9998 }} onClick={() => setOpen(false)} role="dialog" aria-modal="true">
          <div className="sf-fade-in" style={{ backgroundColor: 'var(--em-bg-card)', borderRadius: 16, padding: 20, width: '100%', maxWidth: 360, boxShadow: 'var(--em-shadow-lg)' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)', marginBottom: 4 }}>Invite Parents</h2>
            <p style={{ fontSize: 13, color: 'var(--em-text-tertiary)', marginBottom: 16 }}>Parents scan this QR code to sign up and join {teamName}.</p>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <img src={qrUrl} alt={`QR code for ${teamName} invite`} width={200} height={200} style={{ borderRadius: 8 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', backgroundColor: 'var(--em-bg-secondary)', borderRadius: 10, marginBottom: 12 }}>
              <span style={{ flex: 1, fontSize: 12, color: 'var(--em-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{signupUrl}</span>
              <button type="button" onClick={copy} className="sf-press" aria-label="Copy link"
                style={{ minWidth: 44, minHeight: 36, borderRadius: 8, border: 'none', backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                {copied ? <Check size={16} strokeWidth={2} /> : <Copy size={16} strokeWidth={1.75} />}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={download} className="sf-press"
                style={{ flex: 1, minHeight: 44, borderRadius: 10, border: '1px solid var(--em-border-default)', backgroundColor: 'transparent', color: 'var(--em-text-primary)', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Download size={14} strokeWidth={1.75} /> Save QR
              </button>
              <button type="button" onClick={() => setOpen(false)} className="sf-press"
                style={{ flex: 1, minHeight: 44, borderRadius: 10, border: 'none', backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
