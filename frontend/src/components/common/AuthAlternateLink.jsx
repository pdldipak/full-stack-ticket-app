import { Link } from 'react-router-dom';
import styles from './AuthAlternateLink.module.css';

export default function AuthAlternateLink({ to, children, variant = 'default' }) {
  const linkClass =
    variant === 'red' ? styles.authAlternateLink__linkRed : styles.authAlternateLink__link;

  return (
    <p className={styles.authAlternateLink}>
      <Link to={to} className={linkClass}>
        {children}
      </Link>
    </p>
  );
}
