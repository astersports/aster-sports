import Header from './Header';
import BottomNav from './BottomNav';

// App shell for every authenticated page. The root is pinned to the
// dynamic viewport height (100dvh, with 100vh fallback) and clips
// overflow so the body can never become the scroll container. Header
// and BottomNav are position:fixed (out of flow), so <main> is the
// sole flex child and the sole scroll container — pages scroll inside
// it while the header/nav stay locked to the viewport.
export default function AppShell({ children }) {
  return (
    <div
      className="sf-app-shell flex flex-col"
      style={{ backgroundColor: 'var(--sf-bg-page)' }}
    >
      <Header />
      {/* overscroll-behavior: contain kills pull-to-refresh / rubber-band
          bounce inside main. Padding top/bottom clear the fixed Header
          and BottomNav (both of which include their safe-area insets). */}
      <main
        className="flex-1 overflow-x-hidden overflow-y-auto"
        style={{
          paddingTop: 'calc(56px + env(safe-area-inset-top, 0px))',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
