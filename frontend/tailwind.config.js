/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './src/**/*.module.css'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      /**
       * Default Tailwind only defines opacity keys at steps of 5 (0, 5, 10, …, 100).
       * Utilities like `bg-black/18` then do not exist, and `@apply` in CSS modules fails.
       * Expose every integer 0–100 so any `/NN` opacity modifier resolves in @apply.
       */
      opacity: Object.fromEntries(
        Array.from({ length: 101 }, (_, i) => [String(i), String(i / 100)])
      ),
    },
  },
  plugins: [],
};
