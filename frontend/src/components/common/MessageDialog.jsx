import { useEffect } from 'react';

const variantPanel = {
  default:
    'border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 shadow-xl',
  success:
    'border-2 border-emerald-500 bg-gradient-to-br from-white via-emerald-50/90 to-teal-50/80 shadow-2xl shadow-emerald-600/25 ring-2 ring-emerald-400/35 dark:border-emerald-400 dark:from-slate-900 dark:via-emerald-950/50 dark:to-slate-900 dark:shadow-emerald-950/40 dark:ring-emerald-500/25',
};

const variantTitle = {
  default: 'text-slate-900 dark:text-white',
  success:
    'text-emerald-900 dark:text-emerald-50 [text-shadow:0_1px_0_rgba(255,255,255,0.4)] dark:[text-shadow:0_1px_2px_rgba(0,0,0,0.9)]',
};

const variantBody = {
  default: 'text-slate-700 dark:text-slate-300',
  success: 'text-emerald-950/90 dark:text-emerald-100/95',
};

const defaultButton =
  'rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500';

const successButton =
  'rounded-lg bg-gradient-to-b from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-900/30 transition hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.99] dark:from-emerald-600 dark:to-emerald-700 dark:hover:from-emerald-500 dark:hover:to-emerald-600';

/**
 * Simple informational modal (single action).
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {string} props.title
 * @param {import('react').ReactNode} [props.children]
 * @param {() => void} props.onClose
 * @param {string} [props.closeLabel='OK']
 * @param {'default'|'success'} [props.variant]
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className={
          variant === 'success'
            ? 'absolute inset-0 bg-slate-900/55 backdrop-blur-[2px] dark:bg-emerald-950/60'
            : 'absolute inset-0 bg-slate-900/60 dark:bg-black/70'
        }
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="message-dialog-title"
        className={`relative z-10 w-full max-w-md overflow-hidden rounded-xl p-6 ${variantPanel[variant] ?? variantPanel.default}`}
      >
        {variant === 'success' && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500"
            aria-hidden
          />
        )}
        <h2
          id="message-dialog-title"
          className={`text-lg font-semibold ${variantTitle[variant] ?? variantTitle.default}`}
        >
          {title}
        </h2>
        {children ? (
          <div
            className={`mt-4 text-sm space-y-3 ${variantBody[variant] ?? variantBody.default}`}
          >
            {children}
          </div>
        ) : null}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className={variant === 'success' ? successButton : defaultButton}
            onClick={onClose}
          >
            {closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
