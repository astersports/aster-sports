import Header from './Header';
import BottomNav from './BottomNav';
import PoweredByFooter from '../shared/PoweredByFooter';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useHomeRole } from '../../hooks/useHomeRole';

// App shell for every authenticated page. The root is pinned to the
// dynamic viewport height (100dvh, with 100vh fallback) and clips
// overflow so the body can never become the scroll container. Header
// and BottomNav are position:fixed (out of flow), so <main> is the
// sole flex child and the sole scroll container — pages scroll inside
// it while the header/nav stay locked to the viewport.
export default function AppShell({ children }) {
  const online = useOnlineStatus();
  // F-S2: the fixed preview banner (Header) adds 52px under the header
  // bar while view-as is active — pad <main> to match.
  const { isViewingAs } = useHomeRole();
  return (
    <div
      className="as-app-shell flex flex-col"
      style={{ backgroundColor: 'var(--as-bg-page)' }}
    >
      <Header />
      {!online && (
        <div
          role="status"
          aria-live="polite"
          style={{
            backgroundColor: 'var(--as-danger)',
            color: 'var(--as-text-inverse)',
            textAlign: 'center',
            padding: '6px 16px',
            fontSize: 13,
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          You're offline — some features may not work
        </div>
      )}
      {/* overscroll-behavior: contain kills pull-to-refresh / rubber-band
          bounce inside main. Padding top/bottom clear the fixed Header
          and BottomNav (both of which include their safe-area insets). */}
      <main
        className="flex-1 overflow-x-hidden overflow-y-auto"
        style={{
          paddingTop: `calc(${isViewingAs ? 108 : 56}px + env(safe-area-inset-top, 0px))`,
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
        <PoweredByFooter />
      </main>
      <BottomNav />
    </div>
  );
}
