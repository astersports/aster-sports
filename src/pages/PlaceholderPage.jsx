import EmptyState from '../components/shared/EmptyState';

// One-shot placeholder for stub routes. Any page that only exists so the
// router has somewhere to land should render this until a real
// implementation lands.
export default function PlaceholderPage({ icon, title, description }) {
  return (
    <div className="pt-8">
      <EmptyState
        icon={icon}
        title={title}
        description={description || 'Coming soon.'}
      />
    </div>
  );
}
