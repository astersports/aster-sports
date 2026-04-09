import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { userRole } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="text-slate-600">
        Signed in as <span className="font-semibold capitalize">{userRole}</span>
      </p>
    </div>
  );
}
