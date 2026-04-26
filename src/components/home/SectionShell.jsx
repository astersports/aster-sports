// src/components/home/SectionShell.jsx
// Phase 1 Step 5B: Persona-aware section primitive.
// State machine: loading > error > empty > children.
// Stale-data mode: when refetching with existing data, keeps data visible
// and shows a pulsing accent dot next to the title.

import { AlertCircle } from 'lucide-react';
import TextEmptyState from '../shared/TextEmptyState';
import { useDensity } from '../../hooks/useDensity';
import SectionSkeleton from './SectionSkeleton';

const TITLE_STYLE = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: 'var(--em-text-tertiary)',
};

const DENSITY_TITLE_MB = { minimal: 4, medium: 8, maximum: 12 };

export default function SectionShell({
  title,
  titleCount,
  titleAction = null,
  loading = false,
  error = null,
  empty = null,
  onRetry,
  skeletonVariant = 'plain',
  skeletonRows = 1,
  sectionKey = 'default',
  footer = null,
  hideHeader = false,
  children,
}) {
  const { density } = useDensity(sectionKey);
  const titleMb = DENSITY_TITLE_MB[density] ?? DENSITY_TITLE_MB.medium;
  const hasChildren = children !== undefined && children !== null && children !== false;
  const showSkeleton = loading && !hasChildren;
  const isRefreshing = loading && hasChildren;

  return (
    <section className="min-w-0">
      {!hideHeader && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: titleMb, minHeight: 16, gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span style={TITLE_STYLE}>{title}</span>
            {typeof titleCount === 'number' && (
              <span style={{ ...TITLE_STYLE, opacity: 0.7, fontVariantNumeric: 'tabular-nums' }}>{titleCount}</span>
            )}
            {isRefreshing && (
              <span aria-hidden="true" className="animate-pulse"
                style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: 'var(--em-accent)', marginLeft: 2, flexShrink: 0 }} />
            )}
          </div>
          {titleAction && <div style={{ flexShrink: 0 }}>{titleAction}</div>}
        </div>
      )}

      <span aria-live="polite" aria-atomic="true" className="sr-only">
        {showSkeleton ? `Loading ${title}` : error ? `Error loading ${title}` : ''}
      </span>

      {showSkeleton ? (
        <SectionSkeleton variant={skeletonVariant} rows={skeletonRows} />
      ) : error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : empty ? (
        <EmptyState empty={empty} />
      ) : (
        <>
          <div className="sf-fade-in">{children}</div>
          {footer && <div style={{ marginTop: 10 }}>{footer}</div>}
        </>
      )}
    </section>
  );
}

function ErrorState({ error, onRetry }) {
  const msg = (typeof error === 'string' ? error : error?.message) || "Something went wrong. Try again in a moment.";
  return (
    <div role="alert" className="sf-fade-in"
      style={{ backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--em-danger)' }}>
        <AlertCircle size={16} strokeWidth={1.75} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>Couldn&apos;t load</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', lineHeight: 1.4 }}>{msg}</div>
      {onRetry && (
        <button type="button" onClick={onRetry} className="sf-press"
          style={{ alignSelf: 'flex-start', minHeight: 36, padding: '0 12px', borderRadius: 8, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-primary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
          Try again
        </button>
      )}
    </div>
  );
}

function EmptyState({ empty }) {
  const obj = typeof empty === 'object' ? empty : {};
  const heading = obj.heading || 'Nothing here yet';
  const message = obj.message || '';
  const actionLabel = obj.actionLabel;
  const onAction = obj.onAction;
  return (
    <div className="sf-fade-in">
      <TextEmptyState heading={heading} message={message} />
      {actionLabel && onAction && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
          <button type="button" onClick={onAction} className="sf-press"
            style={{ minHeight: 40, padding: '0 16px', borderRadius: 8, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-primary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
