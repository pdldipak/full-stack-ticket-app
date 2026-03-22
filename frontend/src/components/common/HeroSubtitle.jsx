export default function HeroSubtitle({ children, className = '' }) {
  return (
    <p
      className={`mx-auto max-w-sm text-center text-sm leading-relaxed text-slate-700 dark:text-slate-100 dark:[text-shadow:0_1px_4px_rgba(0,0,0,0.9)] ${className}`.trim()}
    >
      {children}
    </p>
  );
}
