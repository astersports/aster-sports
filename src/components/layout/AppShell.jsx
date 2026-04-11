import Header from './Header';
import BottomNav from './BottomNav';

// Wraps every authenticated page with the fixed header + bottom nav and a
// scrollable content area. Pages render inside the <main>; the pb-20 clears
// the 64px bottom nav so scroll-to-bottom content stays reachable.
export default function AppShell({ children }) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--sf-bg-page)' }}
    >
      <Header />
      {/* Padding top/bottom track the fixed Header + BottomNav heights,
          both of which extend into the iOS safe-area insets. If you
          change Header or BottomNav heights, update these calc() values
          to match — keeping them inline avoids divergence between
          Tailwind classes and the components' actual rendered sizes.
          overflow-x-hidden here is redundant with the html/body rule
          but keeps scroll containment local. */}
      <main
        className="flex-1 overflow-x-hidden overflow-y-auto"
        style={{
          paddingTop: 'calc(56px + env(safe-area-inset-top, 0px))',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
