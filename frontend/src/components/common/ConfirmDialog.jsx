import { useEffect } from 'react';
import FormErrorAlert from '@src/components/common/FormErrorAlert.jsx';
import styles from './ConfirmDialog.module.css';

/**
 * Modal confirmation dialog (replaces window.confirm for consistent UI).
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  children,
  onCancel,
  onConfirm,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isLoading = false,
  error,
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, isLoading, onCancel]);

  if (!open) return null;

  return (
    <div className={styles.confirmDialog__backdrop} role="presentation">
      <button
        type="button"
        className={styles.confirmDialog__scrim}
        aria-label="Close dialog"
        onClick={() => !isLoading && onCancel()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className={styles.confirmDialog__panel}
      >
        <h2 id="confirm-dialog-title" className={styles.confirmDialog__title}>
          {title}
        </h2>
        {(message || children) && (
          <div className={styles.confirmDialog__body}>{message ? <p>{message}</p> : children}</div>
        )}
        {error ? (
          <div className={styles.confirmDialog__errorWrap}>
            <FormErrorAlert message={error} />
          </div>
        ) : null}
        <div className={styles.confirmDialog__actions}>
          <button
            type="button"
            className={styles.confirmDialog__cancel}
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={styles.confirmDialog__confirm}
            onClick={() => onConfirm()}
            disabled={isLoading}
          >
            {isLoading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
