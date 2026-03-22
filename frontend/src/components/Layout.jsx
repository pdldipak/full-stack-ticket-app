import { Link, NavLink, useNavigate } from 'react-router-dom';
import { getSiteHeaderTitle } from '../config/eventConfig.js';
import { useAuth } from '../context/AuthContext.jsx';
import EventBranding from './EventBranding.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const navClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition ${
    isActive
      ? 'bg-emerald-600 text-white'
      : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
  }`;

export default function Layout({ children }) {
  const { username, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(role === 'scanner' ? '/scanner-login' : '/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Link
              to="/"
              className="text-lg font-semibold text-slate-900 dark:text-white block truncate"
            >
              {getSiteHeaderTitle()}
            </Link>
            <div className="mt-1 hidden sm:block max-w-xl">
              <EventBranding compact />
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            {(role === 'seller' || role === 'admin') && (
              <>
                <NavLink to="/tickets" className={navClass}>
                  All tickets
                </NavLink>
                <NavLink to="/tickets/new" className={navClass}>
                  New ticket
                </NavLink>
              </>
            )}
            {role === 'scanner' && (
              <NavLink to="/scanner" className={navClass}>
                Scanner
              </NavLink>
            )}
          </nav>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <ThemeToggle />
            <span>{username}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
