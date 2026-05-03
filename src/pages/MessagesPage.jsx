import { MessageSquare } from 'lucide-react';
import EmptyState from '../components/shared/EmptyState';

export default function MessagesPage() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100dvh - 160px)' }}>
      <EmptyState
        icon={MessageSquare}
        title="Messages launching summer 2026"
        description="Team announcements, coach updates, and parent conversations will live here. We're building something great."
      />
    </div>
  );
}
