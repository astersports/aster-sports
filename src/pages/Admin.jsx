import { Link } from 'react-router-dom';

export default function Admin() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/admin/events"
          className="block rounded-lg border border-(--color-border-tertiary) p-5 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-(--color-text-primary) mb-1">Events</h2>
          <p className="text-sm text-(--color-text-secondary)">Create, edit, and manage team events</p>
        </Link>
        <Link
          to="/admin/locations"
          className="block rounded-lg border border-(--color-border-tertiary) p-5 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-(--color-text-primary) mb-1">Locations</h2>
          <p className="text-sm text-(--color-text-secondary)">Manage venues and sub-locations</p>
        </Link>
        <Link
          to="/admin/opponents"
          className="block rounded-lg border border-(--color-border-tertiary) p-5 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-(--color-text-primary) mb-1">Opponents</h2>
          <p className="text-sm text-(--color-text-secondary)">Manage opponent teams for games</p>
        </Link>
      </div>
    </div>
  );
}
