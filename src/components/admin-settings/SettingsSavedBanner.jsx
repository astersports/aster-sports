import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

// Save-feedback banner (§16.1 microcopy + presence). The page bumps `savedTick`
// (a monotonically increasing counter) whenever a section save succeeds; this
// component shows a confirmation toast and auto-dismisses after 3s. Using a
// counter rather than a timestamp keeps Date.now()/Math.random() out of render
// per the purity lint. The setState in the effect is justified — it is a
// timer-driven dismissal, not synchronous derived state. Token-only colors.
export default function SettingsSavedBanner({ savedTick }) {
  const [visible, setVisible] = useState(false);

  // Timer-driven presence toast, not synchronous derived state: a save-tick
  // bump shows the banner and schedules its auto-dismiss. Justified setState
  // in an effect (external timer sync), so the conservative rule is disabled.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!savedTick) return undefined;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(t);
  }, [savedTick]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!visible) return null;
  return (
    <div role="status" aria-live="polite" className="as-fade-in" style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', marginBottom: 16,
      backgroundColor: 'var(--as-success-soft)', border: '1px solid var(--as-success)',
      borderRadius: 10,
    }}>
      <Check size={18} strokeWidth={2} aria-hidden="true" style={{ color: 'var(--as-success)', flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: 'var(--as-text-primary)' }}>Settings saved.</span>
    </div>
  );
}
