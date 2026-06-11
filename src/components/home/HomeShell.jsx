// HomeShell — composes the inner home slots in the shell-contract-v2 fixed
// order: HomeGreeting → NeedsYou → ComingUp → Registration → RoleTail. The outer
// slots (HomeHeader, BottomNav) are AppShell chrome (src/components/layout/), so
// the shell owns only the scrollable body. Pure composition — it never
// queries; each role page supplies its items + tail via props (the hooks
// own fetching, which fixes the LCP fan-out per the GO packet). `registration`
// is the H-1 admin open-program lane (null for coach/parent + when nothing open).
export default function HomeShell({ greeting, needsYou, comingUp, registration, tail }) {
  return (
    <div className="px-4 py-5 flex flex-col gap-6 as-fade-in">
      {greeting}
      {needsYou}
      {comingUp}
      {registration}
      {tail}
    </div>
  );
}
