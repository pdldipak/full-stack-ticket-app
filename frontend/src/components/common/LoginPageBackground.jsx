import styles from './LoginPageBackground.module.css';

/**
 * Full-viewport hero for login screens. Image lives at `public/event-login-bg.png`
 */
export default function LoginPageBackground() {
  return (
    <div className={styles.loginPageBackground} aria-hidden>
      <div className={styles.loginPageBackground__base} />
      <div
        className={styles.loginPageBackground__image}
        style={{
          backgroundImage: "url('/event-login-bg.png')",
          backgroundPosition: 'center top',
        }}
      />
      <div className={styles.loginPageBackground__wash} />
      <div className={styles.loginPageBackground__gradientA} />
      <div className={styles.loginPageBackground__gradientB} />
      <div className={styles.loginPageBackground__gradientC} />
    </div>
  );
}
