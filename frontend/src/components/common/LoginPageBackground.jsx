/**
 * Full-viewport hero for login screens. Image lives at `public/event-login-bg.png`
 * (replace that file to change artwork; keep the same name or update the URL below).
 */
export default function LoginPageBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-slate-100 dark:bg-slate-950" />
      <div
        className="absolute inset-0 bg-cover bg-no-repeat opacity-[0.22] dark:opacity-100"
        style={{
          backgroundImage: "url('/event-login-bg.png')",
          backgroundPosition: 'center top',
        }}
      />
      <div className="absolute inset-0 bg-white/65 dark:bg-black/18" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-100/90 via-slate-100/50 to-slate-200/80 dark:from-transparent dark:via-slate-950/15 dark:to-slate-950/45" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_95%_85%_at_50%_35%,transparent_0%,rgba(241,245,249,0.85)_100%)] dark:bg-[radial-gradient(ellipse_95%_85%_at_50%_35%,transparent_0%,rgba(15,23,42,0.25)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-5%,rgba(16,185,129,0.12),transparent_45%)] dark:bg-[radial-gradient(ellipse_120%_80%_at_50%_-5%,rgba(16,185,129,0.06),transparent_45%)]" />
    </div>
  );
}
