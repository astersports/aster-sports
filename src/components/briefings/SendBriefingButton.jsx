// Wave 3.13 — generic "Send briefing" button used on event /
// tournament / team detail pages. Pre-populates BriefingComposer
// with anchor + optional kind filter so admins land in the right
// step with the right scope.

import { Mail } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';

const BriefingComposer = lazy(() => import('./BriefingComposer'));

const baseStyle = {
  minHeight: 44, padding: '0 14px', borderRadius: 10,
  fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
  border: '1.5px solid var(--em-border-default)',
  backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-primary)',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};
const iconOnlyStyle = {
  minWidth: 44, minHeight: 44, padding: 0, borderRadius: 10,
  border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

export default function SendBriefingButton({ anchorKind, anchorId, kindFilter, variant = 'icon-label', iconColor = 'var(--em-text-primary)' }) {
  const [open, setOpen] = useState(false);
  const ariaLabel = `Send briefing about this ${anchorKind || 'anchor'}`;
  const isIconOnly = variant === 'icon-only';

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="sf-press" aria-label={ariaLabel} style={isIconOnly ? iconOnlyStyle : baseStyle}>
        <Mail size={isIconOnly ? 20 : 14} strokeWidth={1.75} color={isIconOnly ? iconColor : undefined} />
        {!isIconOnly && <span>Send briefing</span>}
      </button>
      {open && (
        <Suspense fallback={null}>
          <BriefingComposer
            initialAnchorKind={anchorKind}
            initialAnchorId={anchorId}
            initialKindFilter={kindFilter}
            onClose={() => setOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
}
