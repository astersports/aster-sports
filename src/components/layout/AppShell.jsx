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
      <main className="flex-1 overflow-y-auto pt-14 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
