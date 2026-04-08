import { useEffect } from 'react';
import styles from './MessageDialog.module.css';

/**
 * Simple informational modal (single action).
 */
export default function MessageDialog({
  open,
  title,
  children,
  onClose,
  closeLabel = 'OK',
  variant = 'default',
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const isSuccess = variant === 'success';

  return (
    <div className={styles.messageDialog__root} role="presentation">
      <button
        type="button"
        className={isSuccess ? styles.messageDialog__scrimSuccess : styles.messageDialog__scrimDefault}
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="message-dialog-title"
        className={`${styles.messageDialog__panel} ${
          isSuccess ? styles.messageDialog__panelSuccess : styles.messageDialog__panelDefault
        }`}
      >
        {isSuccess && <div className={styles.messageDialog__accent} aria-hidden />}
        <h2
          id="message-dialog-title"
          className={`${styles.messageDialog__title} ${
            isSuccess ? styles.messageDialog__titleSuccess : styles.messageDialog__titleDefault
          }`}
        >
          {title}
        </h2>
        {children ? (
          <div
            className={`${styles.messageDialog__body} ${
              isSuccess ? styles.messageDialog__bodySuccess : styles.messageDialog__bodyDefault
            }`}
          >
            {children}
          </div>
        ) : null}
        <div className={styles.messageDialog__footer}>
          <button
            type="button"
            className={isSuccess ? styles.messageDialog__btnSuccess : styles.messageDialog__btnDefault}
            onClick={onClose}
          >
            {closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
