export default function PrimaryGradientButton({ children, disabled, type = 'submit' }) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="w-full rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 py-3 font-semibold text-white shadow-lg shadow-emerald-900/25 transition-all hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.99] disabled:opacity-50 disabled:shadow-none dark:shadow-emerald-900/40"
    >
      {children}
    </button>
  );
}
