import { CalendarX, RefreshCw } from 'lucide-react';

// L99 SchedulePage enhancement #1: the schedule never surfaced
// useScheduleData().error — a failed fetch fell through to an empty list
// that read as "no events" (a lie, per AP #63 same-concept divergence).
// This is the dedicated error surface: kindness microcopy (§16.3), a
// 44px retry target, and an assertive live region so a screen reader
// announces the failure instead of silently rendering nothing.
export default function ScheduleErrorState({ onRetry }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '32px 16px', gap: 12, minHeight: 160,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 48, height: 48, borderRadius: 9999, display: 'flex', alignItems: 'center',
          justifyContent: 'center', backgroundColor: 'var(--as-danger-soft)', color: 'var(--as-danger)',
        }}
      >
        <CalendarX size={24} strokeWidth={1.75} />
      </span>
      <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--as-text-primary)' }}>
        Couldn't load the schedule
      </div>
      <div style={{ fontSize: 14, color: 'var(--as-text-tertiary)', maxWidth: 320, lineHeight: 1.5 }}>
        Couldn't reach the server. Try again in a moment.
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={() => { navigator.vibrate?.(10); onRetry(); }}
          className="as-press"
          style={{
            display: 'flex', alignItems: 'center', gap: 8, minHeight: 44, padding: '0 20px',
            borderRadius: 10, border: '1px solid var(--as-accent)', backgroundColor: 'var(--as-bg-card)',
            color: 'var(--as-accent)', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
          }}
        >
          <RefreshCw size={16} strokeWidth={1.75} aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  );
}
