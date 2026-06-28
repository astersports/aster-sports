// §4.O L99 — friendly error state for the opponents directory. Kindness
// microcopy (§16.3) + a retry that calls the hook's refetch. Tokens only.

import { CloudOff } from 'lucide-react';
import EmptyState from '../shared/EmptyState';
import Button from '../shared/Button';

export default function OpponentsErrorState({ onRetry }) {
  return (
    <div role="alert" className="as-fade-in">
      <EmptyState
        icon={CloudOff}
        title="Couldn't load opponents"
        description="Couldn't reach the server. Try again in a moment."
        action={
          onRetry ? (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Try again
            </Button>
          ) : null
        }
      />
    </div>
  );
}
