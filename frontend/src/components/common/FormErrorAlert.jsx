import { IconWarningTriangle } from '@src/components/common/icons.jsx';
import styles from './FormErrorAlert.module.css';

/**
 * @param {object} props
 * @param {string | null | undefined} props.message
 * @param {'hero' | 'inline'} [props.variant='inline'] — hero: icon + login styling; inline: compact for ticket forms
 */
export default function FormErrorAlert({ message, variant = 'inline' }) {
  if (!message) return null;

  if (variant === 'hero') {
    return (
      <div className={styles.formErrorAlert__hero} role="alert">
        <IconWarningTriangle className={styles.formErrorAlert__heroIcon} />
        <span>{message}</span>
      </div>
    );
  }

  return (
    <div className={styles.formErrorAlert__inline} role="alert">
      {message}
    </div>
  );
}
