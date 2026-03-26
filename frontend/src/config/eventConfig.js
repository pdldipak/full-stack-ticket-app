/**
 * Single place to edit event branding, schedule, venues, and related UI copy.
 *
 * Program city names must match `src/constants/cities.js` (and backend `ALLOWED_CITIES`).
 * When you add a city, update CITIES and add matching keys under CITY_* below.
 */

import { CITIES } from '../constants/cities.js';

// --- Identity (hero, ticket detail, browser title) ---
export const EVENT_ORGANIZER = 'NRNA NCC Sweden';
export const SITE_PRODUCT_NAME = 'Tickets';

export const EVENT_TITLE = 'New Year Eve 2083 BS';
export const EVENT_ARTIST = 'Melina Rai';

/**
 * Middle segment of ticket codes (must match backend TICKET_CODE_EVENT_SLUG in .env).
 * Display-only example: TKT-{TICKET_CODE_EVENT_SLUG}-0001
 */
export const TICKET_CODE_EVENT_SLUG = 'NY-2083';

/** Line between organizer and title on the hero (e.g. “present”, “presents”, “welcomes”). */
export const EVENT_PRESENT_LABEL = 'present';

// --- Schedule: keys must match every entry in CITIES ---
export const CITY_EVENT_DATES = {
  Stockholm: '11 April 2026',
  Gothenburg: '12 April 2026',
};

export const CITY_EVENT_TIMES = {
  Stockholm: '16:00 – 20:00',
  Gothenburg: '16:00 – 20:00',
};

/** Use the literal "TBA" if the venue is not announced yet. */
export const CITY_VENUES = {
  Stockholm: 'Åstra Folkets Hus',
  Gothenburg: 'TBA',
};

// --- Public order page (`/order`) ---
export const ORDER_PAGE_HEADLINE = 'Order tickets';
export const ORDER_PAGE_NO_LOGIN_BADGE = '(no login)';

/**
 * Full intro under the headline. Default uses organizer + artist; replace the whole
 * string if you need wording that does not follow that pattern.
 */
export const ORDER_PAGE_INTRO = `${EVENT_ORGANIZER} · ${EVENT_ARTIST}. All fields are required, including payment and contact consent. The seller you choose verifies your order using the same phone number you enter here.`;

// --- Auth shell links ---
export const LOGIN_ORDER_LINK_TEXT = 'Order tickets (no login)';

// --- Payment UI (values `seller` / `nrna_ncc` must stay in sync with DB ENUM) ---
export const PAYMENT_LABEL_PAID_TO_ORG_ACCOUNT = 'NRNA NCC account';
export const PAYMENT_FILTER_LABEL_PAID_TO_ORG = 'To NRNA NCC';

// --- Helpers (used across pages) ---

export function getDocumentTitle() {
  return `${EVENT_ORGANIZER} · ${SITE_PRODUCT_NAME}`;
}

export function getSiteHeaderTitle() {
  return `${SITE_PRODUCT_NAME} · ${EVENT_ORGANIZER}`;
}

/** Example ticket code for scanner manual entry (sync with server TICKET_CODE_EVENT_SLUG). */
export function getTicketCodeExample() {
  return `TKT-${TICKET_CODE_EVENT_SLUG}-0001`;
}

export function getEventDateForCity(city) {
  return CITY_EVENT_DATES[city] || '';
}

export function getEventTimeForCity(city) {
  return CITY_EVENT_TIMES[city] || '';
}

export function getVenueForCity(city) {
  return CITY_VENUES[city] || '';
}

export function isVenueTba(city) {
  const v = getVenueForCity(city);
  return !v || v === 'TBA';
}

/** Cities list for branding (same order as CITIES). */
export function getProgramCities() {
  return CITIES;
}

if (import.meta.env.DEV) {
  for (const c of CITIES) {
    if (
      !(c in CITY_EVENT_DATES) ||
      !(c in CITY_EVENT_TIMES) ||
      !(c in CITY_VENUES)
    ) {
      // eslint-disable-next-line no-console
      console.warn(
        `[eventConfig] City "${c}" is in CITIES but missing from CITY_EVENT_DATES / CITY_EVENT_TIMES / CITY_VENUES.`
      );
    }
  }
}
