import { useEffect } from 'react';
import FormErrorAlert from './FormErrorAlert.jsx';

/**
 * Modal confirmation dialog (replaces window.confirm for consistent UI).
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {string} props.title
 * @param {string} [props.message]
 * @param {import('react').ReactNode} [props.children]
 * @param {() => void} props.onCancel
 * @param {() => void | Promise<void>} props.onConfirm
 * @param {string} [props.confirmLabel='Confirm']
 * @param {string} [props.cancelLabel='Cancel']
 * @param {boolean} [props.isLoading=false]
 * @param {string | null} [props.error]
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/70"
        aria-label="Close dialog"
        onClick={() => !isLoading && onCancel()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        <h2
          id="confirm-dialog-title"
          className="text-lg font-semibold text-slate-900 dark:text-white"
        >
          {title}
        </h2>
        {(message || children) && (
          <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            {message ? <p>{message}</p> : children}
          </div>
        )}
        {error ? (
          <div className="mt-4">
            <FormErrorAlert message={error} />
          </div>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-600"
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
