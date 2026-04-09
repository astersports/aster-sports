import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function NavLink({ to, children }) {
  const { pathname } = useLocation();
  const active = pathname === to || (to !== '/' && pathname.startsWith(to));
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={`hover:underline ${active ? 'font-semibold underline' : ''}`}
    >
      {children}
    </Link>
  );
}

export default function Layout() {
  const { userRole, organization, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const orgName = organization?.name || 'Skyfire';

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:text-sm">
        Skip to content
      </a>
      <header className="bg-[var(--sf-header)] text-[var(--sf-text-on-dark)] px-6 py-4 flex items-center justify-between" role="banner">
        <Link to="/" className="text-xl font-bold tracking-tight">{orgName}</Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-4 text-sm" aria-label="Main navigation">
          <NavLink to="/schedule">Schedule</NavLink>
          <NavLink to="/roster">Roster</NavLink>
          {userRole === 'admin' && <NavLink to="/admin">Admin</NavLink>}
          <button
            onClick={signOut}
            className="ml-2 bg-[var(--sf-accent)] hover:bg-[var(--sf-accent-hover)] text-[var(--sf-text-on-dark)] px-3 py-1 rounded text-sm font-medium"
          >
            Sign Out
          </button>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="sm:hidden p-1"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <nav id="mobile-menu" className="sm:hidden bg-[var(--sf-header)] text-[var(--sf-text-on-dark)] px-6 pb-4 flex flex-col gap-3 text-sm" aria-label="Mobile navigation">
          <NavLink to="/schedule">Schedule</NavLink>
          <NavLink to="/roster">Roster</NavLink>
          {userRole === 'admin' && <NavLink to="/admin">Admin</NavLink>}
          <button
            onClick={signOut}
            className="bg-[var(--sf-accent)] hover:bg-[var(--sf-accent-hover)] text-[var(--sf-text-on-dark)] px-3 py-2 rounded text-sm font-medium text-left"
          >
            Sign Out
          </button>
        </nav>
      )}

      <main id="main-content" className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
