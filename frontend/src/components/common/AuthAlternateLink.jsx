import { Link } from 'react-router-dom';

export default function AuthAlternateLink({ to, children, variant = 'default' }) {
  const linkClass =
    variant === 'red'
      ? 'font-bold text-red-600 underline-offset-4 decoration-red-500/45 hover:text-red-700 hover:underline dark:text-red-400 dark:hover:text-red-300 dark:decoration-red-400/50'
      : 'font-medium text-emerald-700 underline-offset-4 decoration-emerald-600/40 hover:text-emerald-800 hover:underline dark:text-emerald-300 dark:hover:text-emerald-200 dark:decoration-emerald-400/50';

  return (
    <p className="text-center text-sm text-slate-600 dark:text-slate-400 dark:[text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
      <Link to={to} className={linkClass}>
        {children}
      </Link>
    </p>
  );
}
