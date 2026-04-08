import styles from './PrimaryGradientButton.module.css';

export default function PrimaryGradientButton({ children, disabled, type = 'submit' }) {
  return (
    <button type={type} disabled={disabled} className={styles.primaryGradientButton}>
      {children}
    </button>
  );
}
