// E3/E4: full-page status states for the public schedule (empty / error /
// not-found). Warm, brand-voice microcopy + a Lucide icon, with an optional
// retry action on the error variant. Centered, token-only, 44px tap target.

import { CalendarX2, RotateCw, SearchX, WifiOff } from 'lucide-react';

const ICONS = { empty: CalendarX2, error: WifiOff, notFound: SearchX };

export default function PublicScheduleMessage({
  variant = 'empty', title, body, onRetry, retryLabel = 'Try again', inline = false,
}) {
  const Icon = ICONS[variant] || CalendarX2;
  // Full-page states (error / not-found) own the document <main>; the inline
  // empty state renders as a <section> nested inside the page's own <main>.
  const Tag = inline ? 'section' : 'main';
  const TitleTag = inline ? 'h2' : 'h1';
  return (
    <Tag
      style={{
        maxWidth: 600, margin: '0 auto', minHeight: inline ? 0 : '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center',
        padding: inline ? '40px 24px' : '48px 24px',
        backgroundColor: 'var(--as-bg-page)',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 64, height: 64, borderRadius: 9999, display: 'flex',
          alignItems: 'center', justifyContent: 'center', marginBottom: 16,
          backgroundColor: 'var(--as-bg-secondary)', color: 'var(--as-text-tertiary)',
        }}
      >
        <Icon size={28} strokeWidth={1.75} />
      </div>
      <TitleTag style={{ fontSize: 20, fontWeight: 700, color: 'var(--as-text-primary)', margin: 0, lineHeight: 1.2 }}>
        {title}
      </TitleTag>
      <p style={{ fontSize: 15, color: 'var(--as-text-secondary)', margin: '8px 0 0', maxWidth: 320, lineHeight: 1.5 }}>
        {body}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="as-press"
          aria-label={retryLabel}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            minHeight: 44, padding: '0 24px', marginTop: 24, borderRadius: 10,
            border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)',
            color: 'var(--as-accent)', fontSize: 15, fontWeight: 600,
          }}
        >
          <RotateCw size={16} strokeWidth={1.75} />
          {retryLabel}
        </button>
      )}
    </Tag>
  );
}
