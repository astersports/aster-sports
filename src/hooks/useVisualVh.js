import { useEffect, useState } from 'react';

// Tracks visible viewport height. Subscribes to visualViewport resize
// on modern browsers (iOS 13+, evergreen) with window resize fallback.
// Intentionally does NOT listen to visualViewport scroll — on iOS that
// fires as the URL bar auto-hides, which would resize mid-interaction.
export function useVisualVh() {
  const read = () => {
    if (typeof window === 'undefined') return 800;
    return Math.round(window.visualViewport?.height ?? window.innerHeight);
  };
  const [vh, setVh] = useState(read);
  useEffect(() => {
    const update = () => setVh(read());
    const vv = window.visualViewport;
    vv?.addEventListener('resize', update);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      vv?.removeEventListener('resize', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);
  return vh;
}
