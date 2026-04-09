import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Unauthorized() {
  const { userRole, signOut } = useAuth();
  const notActivated = !userRole;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      {notActivated ? (
        <>
          <h1 className="text-2xl font-bold mb-2">Account Not Activated</h1>
          <p className="text-slate-600 mb-4">
            Your account hasn't been set up yet. Please contact your program director to get access.
          </p>
          <button
            onClick={signOut}
            className="bg-[var(--sf-accent)] hover:bg-[var(--sf-accent-hover)] text-white font-medium px-4 py-2 rounded text-sm"
          >
            Sign Out
          </button>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-4">You don't have permission to view this page.</p>
          <Link to="/" className="text-[var(--sf-accent)] hover:underline">Back to Dashboard</Link>
        </>
      )}
    </div>
  );
}
