import { IconQrGridSmall, IconTicketsSmall } from './icons.jsx';

const variants = {
  seller: {
    className:
      'inline-flex items-center gap-2 rounded-full border border-slate-300/90 bg-white/90 backdrop-blur-sm px-3.5 py-1.5 text-xs font-medium tracking-wide text-slate-800 shadow-md shadow-slate-900/10 dark:border-slate-500/50 dark:bg-slate-950/80 dark:text-slate-100 dark:shadow-lg dark:shadow-black/40 dark:[text-shadow:0_1px_2px_rgba(0,0,0,0.8)]',
    Icon: IconTicketsSmall,
    iconClass: 'text-emerald-600 dark:text-emerald-400',
  },
  scanner: {
    className:
      'inline-flex items-center gap-2 rounded-full border border-emerald-300/80 bg-emerald-50/95 backdrop-blur-sm px-3.5 py-1.5 text-xs font-medium tracking-wide text-emerald-900 shadow-md shadow-emerald-900/10 dark:border-emerald-400/35 dark:bg-slate-950/80 dark:text-emerald-200 dark:shadow-lg dark:shadow-black/40 dark:[text-shadow:0_1px_2px_rgba(0,0,0,0.8)]',
    Icon: IconQrGridSmall,
    iconClass: 'text-emerald-600 dark:text-emerald-400',
  },
};

export default function AuthRoleBadge({ variant, children }) {
  const cfg = variants[variant];
  if (!cfg) return null;
  const { Icon } = cfg;

  return (
    <div className="flex justify-center">
      <span className={cfg.className}>
        <Icon className={`h-4 w-4 ${cfg.iconClass}`} />
        {children}
      </span>
    </div>
  );
}
