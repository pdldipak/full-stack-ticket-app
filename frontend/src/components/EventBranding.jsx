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
} from '@src/config/eventConfig.js';
import styles from '@src/components/EventBranding.module.css';

export default function EventBranding({
  compact = false,
  forHero = false,
  /** Larger bold organizer line (e.g. public order page). */
  prominentOrganizer = false,
}) {
  const cities = getProgramCities();

  if (compact) {
    return (
      <p className={styles.eventBranding__compact}>
        <span className={styles.eventBranding__compactOrg}>{EVENT_ORGANIZER}</span>
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
    <div className={styles.eventBranding__stack}>
      <p
        className={
          prominentOrganizer && forHero
            ? styles.eventBranding__organizerProminentHero
            : forHero
              ? styles.eventBranding__organizerHero
              : styles.eventBranding__organizerPlain
        }
      >
        {EVENT_ORGANIZER}
      </p>
      <p className={forHero ? styles.eventBranding__presentHero : styles.eventBranding__presentPlain}>
        {EVENT_PRESENT_LABEL}
      </p>
      <h1 className={forHero ? styles.eventBranding__titleHero : styles.eventBranding__titlePlain}>
        {EVENT_TITLE}
        <span className={forHero ? styles.eventBranding__titleSepHero : styles.eventBranding__titleSepPlain}>
          {' '}
          ·{' '}
        </span>
        <span className={forHero ? styles.eventBranding__artistHero : styles.eventBranding__artistPlain}>
          {EVENT_ARTIST}
        </span>
      </h1>
      <div className={forHero ? styles.eventBranding__cityListHero : styles.eventBranding__cityListPlain}>
        {cities.map((city) => (
          <p key={city}>
            <span className={forHero ? styles.eventBranding__cityNameHero : styles.eventBranding__cityNamePlain}>
              {city}
            </span>{' '}
            —{' '}
            {CITY_EVENT_DATES[city]} · {CITY_EVENT_TIMES[city]}
            <br />
            <span className={forHero ? styles.eventBranding__venueHero : styles.eventBranding__venuePlain}>
              {isVenueTba(city) ? 'Venue TBA' : CITY_VENUES[city]}
            </span>
          </p>
        ))}
      </div>
    </div>
  );

  if (forHero) {
    return <div className={styles.eventBranding__heroCard}>{block}</div>;
  }

  return block;
}
