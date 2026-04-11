import PlaceholderPage from './PlaceholderPage';
import { House } from 'lucide-react';

// Placeholder — the real dashboard lands in a later prompt. Keeping this
// as a thin re-export makes it trivial to replace the body without
// touching the router.
export default function HomePage() {
  return <PlaceholderPage icon={House} title="Home" description="Your dashboard will live here." />;
}
