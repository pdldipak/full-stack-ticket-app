import {
  CITY_EVENT_DATES,
  CITY_EVENT_TIMES,
  CITY_VENUES,
  EVENT_ARTIST,
  EVENT_ORGANIZER,
  EVENT_PRESENT_LABEL,
  EVENT_TITLE,
  getProgramCities,
  isVenueTba,
} from '../config/eventConfig.js';

export default function EventBranding({
  compact = false,
  forHero = false,
  /** Larger bold organizer line (e.g. public order page). */
  prominentOrganizer = false,
}) {
  const cities = getProgramCities();

  if (compact) {
    return (
      <p className="text-slate-600 dark:text-slate-500 text-xs leading-relaxed">
        <span className="text-slate-700 dark:text-slate-400">{EVENT_ORGANIZER}</span>
        {' · '}
        {EVENT_TITLE}
        {' · '}
        {EVENT_ARTIST}
        <br />
        {cities.map((city, idx) => (
          <span key={city}>
            {idx > 0 && <br />}
            {city} — {CITY_EVENT_DATES[city]}, {CITY_EVENT_TIMES[city]}
            {isVenueTba(city) ? ' (venue TBA)' : `, ${CITY_VENUES[city]}`}
          </span>
        ))}
      </p>
    );
  }

  const block = (
    <div className="text-center space-y-2">
      <p
        className={
          prominentOrganizer && forHero
            ? 'text-xl sm:text-2xl font-bold tracking-tight text-emerald-800 drop-shadow-sm dark:text-emerald-200 dark:drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]'
            : forHero
              ? 'text-xs font-semibold uppercase tracking-wide text-emerald-700 drop-shadow-sm dark:text-emerald-300 dark:drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]'
              : 'text-emerald-700 dark:text-emerald-400/90 text-xs font-semibold tracking-wide uppercase'
        }
      >
        {EVENT_ORGANIZER}
      </p>
      <p
        className={
          forHero
            ? 'text-xs text-slate-600 dark:text-slate-300 dark:drop-shadow-sm'
            : 'text-slate-600 dark:text-slate-500 text-xs'
        }
      >
        {EVENT_PRESENT_LABEL}
      </p>
      <h1
        className={
          forHero
            ? 'text-xl font-bold leading-snug text-slate-900 sm:text-2xl dark:text-white dark:[text-shadow:0_2px_12px_rgba(0,0,0,0.85),0_1px_2px_rgba(0,0,0,0.9)]'
            : 'text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug'
        }
      >
        {EVENT_TITLE}
        <span
          className={
            forHero
              ? 'font-normal text-slate-600 dark:text-slate-200'
              : 'text-slate-600 dark:text-slate-300 font-normal'
          }
        >
          {' '}
          ·{' '}
        </span>
        <span className={forHero ? 'text-slate-800 dark:text-white' : 'text-slate-800 dark:text-slate-100'}>
          {EVENT_ARTIST}
        </span>
      </h1>
      <div
        className={
          forHero
            ? 'mx-auto max-w-md space-y-2 pt-1 text-center text-sm text-slate-700 dark:text-slate-200 dark:[text-shadow:0_1px_4px_rgba(0,0,0,0.85)]'
            : 'text-slate-600 dark:text-slate-400 text-sm space-y-2 pt-1 text-center max-w-md mx-auto'
        }
      >
        {cities.map((city) => (
          <p key={city}>
            <span
              className={
                forHero
                  ? 'font-medium text-slate-900 dark:text-white'
                  : 'text-slate-800 dark:text-slate-300 font-medium'
              }
            >
              {city}
            </span>{' '}
            —{' '}
            {CITY_EVENT_DATES[city]} · {CITY_EVENT_TIMES[city]}
            <br />
            <span className={forHero ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500 dark:text-slate-500'}>
              {isVenueTba(city) ? 'Venue TBA' : CITY_VENUES[city]}
            </span>
          </p>
        ))}
      </div>
    </div>
  );

  if (forHero) {
    return (
      <div className="rounded-2xl border border-slate-200/90 bg-white/90 px-4 py-5 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/70 backdrop-blur-md sm:px-5 dark:border-white/20 dark:bg-slate-950/75 dark:shadow-2xl dark:ring-black/50 dark:ring-white/10">
        {block}
      </div>
    );
  }

  return block;
}
