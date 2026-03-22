import { IconLock, IconUser } from './icons.jsx';

const inputClass =
  'w-full rounded-xl border pl-11 pr-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition shadow-inner bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-slate-950/50 dark:border-slate-600/80 dark:text-white dark:placeholder:text-slate-600';

const labelClass =
  'block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300';

export default function AuthTextField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  icon = 'user',
}) {
  const Icon = icon === 'lock' ? IconLock : IconUser;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
          <Icon />
        </span>
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          className={inputClass}
          placeholder={placeholder}
          required
        />
      </div>
    </div>
  );
}
