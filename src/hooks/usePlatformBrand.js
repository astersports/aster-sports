import { useEffect } from 'react';

// Reset the brand tokens to Aster Sports platform defaults on mount (§3 /
// §16.11). The no-login Hub is platform-branded, but main.jsx applies any
// cached org brand_colors before React mounts (closing the authed brand-flash),
// which would otherwise leave a logged-out / previously-signed-in visitor's Hub
// wearing a stale org accent (e.g. the pre-rebrand cobalt) instead of Aster
// gold. Same reset LoginPage performs; every public /hub* page calls this.
export function usePlatformBrand() {
  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty('--as-header', '#151525');
    r.setProperty('--as-accent', '#C9952E');
    r.setProperty('--as-accent-hover', '#D4A843');
    r.setProperty('--as-accent-soft', 'rgba(201,149,46,0.1)');
    r.setProperty('--as-text-on-dark', '#F5F0E8');
  }, []);
}
