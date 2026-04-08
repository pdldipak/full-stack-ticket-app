import { Link, NavLink, useNavigate } from 'react-router-dom';
import { getSiteHeaderTitle } from '@src/config/eventConfig.js';
import { useAuth } from '@src/context/AuthContext.jsx';
import EventBranding from '@src/components/EventBranding.jsx';
import styles from '@src/components/Layout.module.css';
import ThemeToggle from '@src/components/ThemeToggle.jsx';

const navClass = ({ isActive }) =>
  `${styles.layout__navLink} ${isActive ? styles.layout__navLink_active : styles.layout__navLink_inactive}`;

export default function Layout({ children }) {
  const { username, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(role === 'scanner' ? '/scanner-login' : '/login');
  };

  return (
    <div className={styles.layout__root}>
      <a href="#main-content" className={styles.layout__skipLink}>
        Skip to content
      </a>
      <header className={styles.layout__header}>
        <div className={styles.layout__inner}>
          <div className={styles.layout__brandCol}>
            <Link to="/" className={styles.layout__siteTitle}>
              {getSiteHeaderTitle()}
            </Link>
            <div className={styles.layout__compactBranding}>
              <EventBranding compact />
            </div>
          </div>
          <nav className={styles.layout__nav}>
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
          <div className={styles.layout__toolbar}>
            <ThemeToggle />
            <span>{username}</span>
            <button type="button" onClick={handleLogout} className={styles.layout__logout}>
              Log out
            </button>
          </div>
        </div>
      </header>
      <main id="main-content" className={styles.layout__main} tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
