import { IconWarningTriangle } from './icons.jsx';

/**
 * @param {object} props
 * @param {string | null | undefined} props.message
 * @param {'hero' | 'inline'} [props.variant='inline'] — hero: icon + login styling; inline: compact for ticket forms
 */
export default function FormErrorAlert({ message, variant = 'inline' }) {
  if (!message) return null;

  if (variant === 'hero') {
    return (
      <div
        className="rounded-xl bg-red-100 border border-red-300 text-red-900 text-sm px-4 py-3 flex gap-3 items-start dark:bg-red-950/60 dark:border-red-500/30 dark:text-red-100"
        role="alert"
      >
        <IconWarningTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <span>{message}</span>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-3 py-2 dark:bg-red-950/50 dark:border-red-800 dark:text-red-200"
      role="alert"
    >
      {message}
    </div>
  );
}
