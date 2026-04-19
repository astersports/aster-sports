import TextEmptyState from '../components/shared/TextEmptyState';

export default function MessagesPage() {
  return (
    <TextEmptyState
      heading="No messages yet"
      message="Team announcements and messages will appear here."
    />
  );
}
