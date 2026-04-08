import ThemeToggle from '@src/components/ThemeToggle.jsx';
import LoginPageBackground from '@src/components/common/LoginPageBackground.jsx';
import styles from './AuthShell.module.css';

export default function AuthShell({ children }) {
  return (
    <div className={styles.authShell}>
      <LoginPageBackground />
      <div className={styles.authShell__toggle}>
        <ThemeToggle />
      </div>
      <div className={styles.authShell__content}>{children}</div>
    </div>
  );
}
