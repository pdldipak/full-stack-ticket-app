import { ALLOWED_CITIES } from './cities.js';

/**
 * Per seller: ordered labels shown in the public order dropdown as seller1(Name, City, …).
 * Program-city access uses only entries that match ALLOWED_CITIES (e.g. Stockholm, Gothenburg).
 */
export const SELLER_ALLOWED_CITIES = {
  seller1: ['Rajendra', 'Stockholm'],
  seller2: ['Dipak', 'Stockholm'],
  seller3: ['Reena', 'Stockholm'],
  seller4: ['Rajendra', 'Stockholm', 'Gothenburg'],
};

/** Full list for UI — same order as in SELLER_ALLOWED_CITIES. */
export function getSellerDisplayParts(username) {
  const u = String(username || '').trim();
  const arr = SELLER_ALLOWED_CITIES[u];
  return Array.isArray(arr) ? [...arr] : [];
}

/** Cities this seller may use for tickets (subset of ALLOWED_CITIES). */
export function getAllowedCitiesForSeller(username) {
  return getSellerDisplayParts(username).filter((p) => ALLOWED_CITIES.includes(p));
}

export function sellerMayUseCity(username, city) {
  const c = String(city || '').trim();
  return getAllowedCitiesForSeller(username).includes(c);
}
