import { lazy, Suspense, useState } from 'react';
import { Mail } from 'lucide-react';

const DigestComposer = lazy(() => import('./DigestComposer'));

// Header-mounted "Compose digest" button on /admin/briefings. Opens the
// FullScreenForm composer modal. Sized to live alongside the filter
// chips on the inbox header without crowding the layout.

export default function DigestComposeButton() {
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
        <Mail size={14} strokeWidth={1.75} /> Compose digest
      </button>
      {open && (
        <Suspense fallback={null}>
          <DigestComposer onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
