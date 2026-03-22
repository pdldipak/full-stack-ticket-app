import ThemeToggle from '../ThemeToggle.jsx';
import LoginPageBackground from './LoginPageBackground.jsx';

export default function AuthShell({ children }) {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center px-4 py-12 bg-slate-100 dark:bg-slate-950 isolate">
      <LoginPageBackground />
      <div className="absolute right-4 top-4 z-[2]">
        <ThemeToggle />
      </div>
      <div className="relative z-[1] mx-auto w-full max-w-md min-w-0 space-y-7">{children}</div>
    </div>
  );
}
