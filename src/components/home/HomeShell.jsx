// HomeShell — composes the inner home slots in the shell-contract-v2 fixed
// order: HomeGreeting → NeedsYou → ComingUp → RoleTail. The outer slots
// (HomeHeader, BottomNav) are AppShell chrome (src/components/layout/), so
// the shell owns only the scrollable body. Pure composition — it never
// queries; each role page supplies its items + tail via props (the hooks
// own fetching, which fixes the LCP fan-out per the GO packet).
export default function HomeShell({ greeting, needsYou, comingUp, tail }) {
  return (
    <div className="px-4 py-5 flex flex-col gap-6 as-fade-in">
      {greeting}
      {needsYou}
      {comingUp}
      {tail}
    </div>
  );
}
