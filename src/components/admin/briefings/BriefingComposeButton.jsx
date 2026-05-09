// Wave 3.11 follow-up — replaces DigestComposeButton on the inbox
// header. Opens the unified BriefingComposer (handles all 8 kinds via
// the kind picker step). DigestComposer + DigestComposeButton kept
// alongside this for now until 3.12 inbox redesign migrates fully.

import { lazy, Suspense, useState } from 'react';
import { Mail } from 'lucide-react';

const BriefingComposer = lazy(() => import('../../briefings/BriefingComposer'));

export default function BriefingComposeButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="sf-press"
        style={{
          minHeight: 36, padding: '0 14px', borderRadius: 9999, border: 'none',
          fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
          backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
        <Mail size={14} strokeWidth={1.75} /> Compose
      </button>
      {open && (
        <Suspense fallback={null}>
          <BriefingComposer onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
